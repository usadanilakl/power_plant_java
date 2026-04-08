package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.*;
import java.time.Instant;
import java.util.*;

/**
 * Migrates data from a local H2 database file into the current datasource (PostgreSQL).
 *
 * Opens a direct JDBC connection to the H2 .mv.db file, reads all entity and join tables,
 * and batch-inserts into the active datasource. The H2 file is not modified.
 *
 * Usage: start the app with the 'postgres' profile, then call the migration endpoint.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class H2ToPostgresMigrationService {

    private final JdbcTemplate jdbcTemplate;
    private final EntityTableRegistry entityTableRegistry;
    private final SharePointSyncOrchestrator sharePointSyncOrchestrator;

    /**
     * Global migration lock — when true, all client write paths must reject incoming changes.
     * Checked by HubSyncController.exchange() to block client→hub sync during migration.
     */
    public static final java.util.concurrent.atomic.AtomicBoolean migrationInProgress =
        new java.util.concurrent.atomic.AtomicBoolean(false);

    @Value("${h2.migration.db-path:./db/proddb}")
    private String h2DbPath;

    /**
     * Check if an H2 database file exists for migration.
     */
    public MigrationStatus getStatus() {
        MigrationStatus status = new MigrationStatus();

        String h2File = h2DbPath + ".mv.db";
        status.setH2FileExists(new java.io.File(h2File).exists());
        status.setH2FilePath(h2File);

        if (status.isH2FileExists()) {
            status.setH2FileSizeMb(new java.io.File(h2File).length() / 1024.0 / 1024.0);
        }

        // Check current datasource type
        try {
            String dbProduct = jdbcTemplate.execute((Connection conn) ->
                conn.getMetaData().getDatabaseProductName());
            status.setCurrentDatabase(dbProduct);
            status.setRunningOnPostgres(dbProduct != null && dbProduct.toLowerCase().contains("postgresql"));
        } catch (Exception e) {
            status.setCurrentDatabase("unknown");
        }

        // Count existing records in PG
        if (status.isRunningOnPostgres()) {
            long total = 0;
            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType);
                try {
                    Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
                    if (count != null) total += count;
                } catch (Exception ignored) {}
            }
            status.setTargetRecordCount(total);
        }

        return status;
    }

    /**
     * Perform the migration from H2 file to the current (PostgreSQL) datasource.
     * NOT @Transactional — each table inserts independently so one FK error doesn't kill the rest.
     */
    public MigrationResult migrate() {
        MigrationResult result = new MigrationResult();
        long startTime = System.currentTimeMillis();

        MigrationStatus status = getStatus();
        if (!status.isH2FileExists()) {
            result.setSuccess(false);
            result.setError("H2 database file not found at: " + status.getH2FilePath());
            return result;
        }
        if (!status.isRunningOnPostgres()) {
            result.setSuccess(false);
            result.setError("Not running on PostgreSQL. Current database: " + status.getCurrentDatabase()
                + ". Add 'postgres' to active profiles first.");
            return result;
        }
        // Acquire global lock BEFORE any destructive action
        if (!migrationInProgress.compareAndSet(false, true)) {
            result.setSuccess(false);
            result.setError("Another migration is already in progress");
            return result;
        }
        sharePointSyncOrchestrator.setClientSyncInProgress(true);

        // Drain in-flight SharePoint syncs before touching tables.
        // The flag above prevents new syncs; this waits for active ones to finish.
        if (!sharePointSyncOrchestrator.waitForActiveSyncsToDrain(60_000)) {
            sharePointSyncOrchestrator.setClientSyncInProgress(false);
            migrationInProgress.set(false);
            result.setSuccess(false);
            result.setError("Timed out waiting for in-flight SharePoint syncs to drain");
            return result;
        }

        String h2Url = "jdbc:h2:file:" + h2DbPath + ";ACCESS_MODE_DATA=r;DB_CLOSE_ON_EXIT=TRUE";

        // Now safe to do destructive operations — clients are blocked, SP sync is drained
        if (status.getTargetRecordCount() > 0) {
            log.info("PostgreSQL has {} existing records — clearing before migration", status.getTargetRecordCount());
            clearAllTables();
        }
        disableForeignKeys();
        try (Connection h2Conn = DriverManager.getConnection(h2Url, "sa", "password")) {
            log.info("Connected to H2 database at {}", h2DbPath);

            int totalMigrated = 0;
            Map<String, Integer> tableCounts = new LinkedHashMap<>();

            Map<String, String> tableErrors = new LinkedHashMap<>();

            // Discover ALL user tables from H2 using JDBC metadata (works in read-only mode)
            List<String> h2Tables = new ArrayList<>();
            DatabaseMetaData h2Meta = h2Conn.getMetaData();
            try (ResultSet rs = h2Meta.getTables(null, "PUBLIC", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    h2Tables.add(rs.getString("TABLE_NAME").toLowerCase());
                }
            }
            if (h2Tables.isEmpty()) {
                // Fallback: try without schema filter
                try (ResultSet rs = h2Meta.getTables(null, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        String schema = rs.getString("TABLE_SCHEMA");
                        if (schema == null || "PUBLIC".equalsIgnoreCase(schema)) {
                            h2Tables.add(rs.getString("TABLE_NAME").toLowerCase());
                        }
                    }
                }
            }
            log.info("Found {} tables in H2 database", h2Tables.size());

            // Migrate all tables — try each one against PG
            for (String tableName : h2Tables) {
                try {
                    // Check if table exists in PG
                    List<String> pgCols = getTargetColumns(tableName);
                    if (pgCols.isEmpty()) {
                        log.debug("Skipping {} — not in PostgreSQL", tableName);
                        continue;
                    }
                    int[] counts = migrateTable(h2Conn, tableName);
                    tableCounts.put(tableName, counts[0]);
                    totalMigrated += counts[0];
                    if (counts[1] > 0) {
                        tableErrors.put(tableName, counts[1] + " rows failed");
                    }
                } catch (Exception e) {
                    log.warn("Could not migrate table {}: {}", tableName, e.getMessage());
                    tableCounts.put(tableName, -1);
                    tableErrors.put(tableName, e.getMessage());
                }
            }

            // Reset sequences so post-migration inserts don't collide with imported IDs
            // This is critical — if it fails, mark migration as failed
            String sequenceError = null;
            try {
                resetSequences();
            } catch (Exception e) {
                sequenceError = "Sequence reset failed: " + e.getMessage();
                log.error(sequenceError, e);
            }

            long elapsed = System.currentTimeMillis() - startTime;
            boolean success = tableErrors.isEmpty() && sequenceError == null;
            result.setSuccess(success);
            result.setTotalRecords(totalMigrated);
            result.setTableCounts(tableCounts);
            result.setTableErrors(tableErrors);
            result.setElapsedMs(elapsed);
            if (success) {
                log.info("Migration complete: {} total records in {}ms", totalMigrated, elapsed);
            } else {
                StringBuilder err = new StringBuilder();
                if (!tableErrors.isEmpty()) err.append(tableErrors.size()).append(" tables had errors");
                if (sequenceError != null) {
                    if (err.length() > 0) err.append("; ");
                    err.append(sequenceError);
                }
                result.setError(err.toString());
                log.warn("Migration completed with errors in {}ms: {}", elapsed, err);
            }

        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            result.setSuccess(false);
            result.setError(e.getMessage());
        } finally {
            enableForeignKeys();
            sharePointSyncOrchestrator.setClientSyncInProgress(false);
            migrationInProgress.set(false);
        }

        return result;
    }

    /** Returns [inserted, failed] */
    private int[] migrateTable(Connection h2Conn, String tableName) throws SQLException {
        // Read column metadata from H2 (uppercase table names)
        String h2TableName = tableName.toUpperCase();
        List<String> columns = new ArrayList<>();

        try (ResultSet rs = h2Conn.createStatement().executeQuery(
                "SELECT * FROM " + h2TableName + " LIMIT 0")) {
            ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                columns.add(meta.getColumnName(i).toLowerCase());
            }
        } catch (SQLException e) {
            // Table might not exist in H2
            log.debug("Table {} not found in H2: {}", h2TableName, e.getMessage());
            return new int[]{0, 0};
        }

        if (columns.isEmpty()) return new int[]{0, 0};

        // Read all rows from H2
        List<Object[]> rows = new ArrayList<>();
        try (Statement stmt = h2Conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + h2TableName)) {
            int colCount = columns.size();
            while (rs.next()) {
                Object[] row = new Object[colCount];
                for (int i = 0; i < colCount; i++) {
                    row[i] = rs.getObject(i + 1);
                }
                rows.add(row);
            }
        }

        if (rows.isEmpty()) {
            log.info("Table {} ({} in H2): 0 rows in H2", tableName, h2TableName);
            return new int[]{0, 0};
        }

        // Filter to columns that exist in PG target (case-insensitive match)
        List<String> pgColumns = getTargetColumns(tableName);
        Set<String> pgColumnsLower = new HashSet<>();
        for (String c : pgColumns) pgColumnsLower.add(c.toLowerCase());

        List<Integer> validIndices = new ArrayList<>();
        List<String> validColumns = new ArrayList<>();
        for (int i = 0; i < columns.size(); i++) {
            String colLower = columns.get(i).toLowerCase();
            if (pgColumnsLower.contains(colLower)) {
                validIndices.add(i);
                validColumns.add(colLower); // use lowercase for PG INSERT
            }
        }

        log.info("Table {}: {} rows in H2, {} H2 columns, {} PG columns, {} matched",
            tableName, rows.size(), columns.size(), pgColumns.size(), validColumns.size());
        if (validColumns.size() < columns.size()) {
            List<String> unmatchedH2 = new ArrayList<>(columns);
            unmatchedH2.removeAll(pgColumns);
            List<String> unmatchedPg = new ArrayList<>(pgColumns);
            unmatchedPg.removeAll(columns);
            if (!unmatchedH2.isEmpty()) log.warn("Table {} — H2 columns not in PG: {}", tableName, unmatchedH2);
            if (!unmatchedPg.isEmpty()) log.warn("Table {} — PG columns not in H2: {}", tableName, unmatchedPg);
        }

        // Insert into PG — ON CONFLICT DO NOTHING handles duplicates from concurrent pollers
        String colList = String.join(", ", validColumns);
        String placeholders = String.join(", ", Collections.nCopies(validColumns.size(), "?"));
        String insertSql = "INSERT INTO " + tableName + " (" + colList + ") VALUES (" + placeholders + ") ON CONFLICT DO NOTHING";

        int inserted = 0;
        int failed = 0;
        String lastError = null;
        for (Object[] row : rows) {
            try {
                Object[] values = validIndices.stream().map(i -> row[i]).toArray();
                jdbcTemplate.update(insertSql, values);
                inserted++;
            } catch (Exception e) {
                failed++;
                lastError = e.getMessage();
                if (failed <= 3) {
                    log.warn("Failed to insert row into {}: {}", tableName, e.getMessage());
                }
            }
        }
        if (failed > 0) {
            log.warn("Table {}: {} inserted, {} FAILED. Last error: {}", tableName, inserted, failed, lastError);
        }
        return new int[]{inserted, failed};
    }

    /**
     * Reset PostgreSQL sequences after migration so next inserts don't collide with imported IDs.
     *
     * Two cases handled:
     * 1. id_seq (DevicePrefixedIdGenerator): finds max(MOD(id, 1B)) across all tables for this device,
     *    restarts id_seq above that value.
     * 2. IDENTITY columns (e.g., hub_stored_backups): resets each table's identity to MAX(id)+1.
     */
    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    private static final long FALLBACK_DEVICE_NUMBER = 99L;

    /**
     * @throws RuntimeException if any sequence reset fails — this MUST be propagated
     * because leaving sequences in a bad state causes ID collisions on the next insert.
     */
    private void resetSequences() {
        // 1. Reset id_seq based on device prefix
        // Mirror DevicePrefixedIdGenerator: fall back to device 99 if machine-id.properties missing
        long deviceNumber = readDeviceNumber();
        if (deviceNumber < 0 || deviceNumber > 99) {
            log.warn("device.number not configured — using fallback device {} for sequence reset", FALLBACK_DEVICE_NUMBER);
            deviceNumber = FALLBACK_DEVICE_NUMBER;
        }
        long rangeStart = deviceNumber * DEVICE_ID_MULTIPLIER;
        long rangeEnd = rangeStart + DEVICE_ID_MULTIPLIER;
        long maxSuffix = 0;

        List<String> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.columns " +
            "WHERE LOWER(column_name) = 'id' AND table_schema = CURRENT_SCHEMA " +
            "AND LOWER(table_name) NOT LIKE '%_aud' AND LOWER(table_name) <> 'revinfo'",
            String.class);

        for (String table : tables) {
            try {
                Long tMax = jdbcTemplate.queryForObject(
                    "SELECT MAX(MOD(id, ?)) FROM " + table + " WHERE id >= ? AND id < ?",
                    Long.class, DEVICE_ID_MULTIPLIER, rangeStart, rangeEnd);
                if (tMax != null && tMax > maxSuffix) maxSuffix = tMax;
            } catch (Exception e) {
                // Per-table read failure is non-fatal — table might not have numeric id
                log.debug("Could not read id from {}: {}", table, e.getMessage());
            }
        }

        // Always restart id_seq, even if maxSuffix is 0 — ensures it's at a known state
        long newStart = Math.max(maxSuffix + 1, 1);
        jdbcTemplate.execute("ALTER SEQUENCE id_seq RESTART WITH " + newStart);
        log.info("Reset id_seq to {} (device {} max suffix {})", newStart, deviceNumber, maxSuffix);

        // 2. Reset IDENTITY column sequences (auto-generated by PG for SERIAL/BIGSERIAL)
        // pg_class/pg_depend are PG-specific — skip this step on non-PG dialects
        List<Map<String, Object>> identitySeqs;
        try {
            identitySeqs = jdbcTemplate.queryForList(
                "SELECT s.relname AS seq_name, t.relname AS table_name, a.attname AS column_name " +
                "FROM pg_class s " +
                "JOIN pg_depend d ON d.objid = s.oid " +
                "JOIN pg_class t ON t.oid = d.refobjid " +
                "JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid " +
                "WHERE s.relkind = 'S' AND d.deptype = 'a'");
        } catch (Exception e) {
            log.debug("Identity sequence discovery skipped (non-PostgreSQL dialect): {}", e.getMessage());
            return;
        }

        List<String> failedSeqs = new ArrayList<>();
        for (Map<String, Object> row : identitySeqs) {
            String seqName = (String) row.get("seq_name");
            String tableName = (String) row.get("table_name");
            String colName = (String) row.get("column_name");
            if ("id_seq".equals(seqName)) continue; // already handled above
            try {
                Long maxId = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(" + colName + "), 0) FROM " + tableName, Long.class);
                long restart = (maxId != null ? maxId : 0L) + 1;
                jdbcTemplate.execute("ALTER SEQUENCE " + seqName + " RESTART WITH " + restart);
                log.info("Reset sequence {} to {} (table {})", seqName, restart, tableName);
            } catch (Exception e) {
                log.error("Failed to reset sequence {}: {}", seqName, e.getMessage());
                failedSeqs.add(seqName);
            }
        }

        if (!failedSeqs.isEmpty()) {
            throw new RuntimeException("Failed to reset " + failedSeqs.size() +
                " sequences: " + String.join(", ", failedSeqs));
        }
    }

    private long readDeviceNumber() {
        java.io.File file = new java.io.File("./machine-id.properties");
        if (!file.exists()) return -1;
        try (java.io.FileInputStream fis = new java.io.FileInputStream(file)) {
            java.util.Properties props = new java.util.Properties();
            props.load(fis);
            String val = props.getProperty("device.number");
            return val != null ? Long.parseLong(val.trim()) : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    private void clearAllTables() {
        // Get ALL PG tables and truncate them
        try {
            List<String> pgTables = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'", String.class);
            for (String table : pgTables) {
                try { jdbcTemplate.execute("TRUNCATE TABLE " + table + " CASCADE"); } catch (Exception ignored) {}
            }
            log.info("Cleared {} PostgreSQL tables before migration", pgTables.size());
        } catch (Exception e) {
            log.warn("Could not clear all tables: {}", e.getMessage());
        }
    }

    private void disableForeignKeys() {
        // Drop all FK constraints, re-create them after migration
        fkConstraints.clear();
        try {
            List<Map<String, Object>> fks = jdbcTemplate.queryForList(
                "SELECT tc.table_name, tc.constraint_name, " +
                "ccu.table_name AS ref_table, " +
                "kcu.column_name, ccu.column_name AS ref_column " +
                "FROM information_schema.table_constraints tc " +
                "JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name " +
                "JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name " +
                "WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'"
            );
            for (Map<String, Object> fk : fks) {
                String table = (String) fk.get("table_name");
                String constraint = (String) fk.get("constraint_name");
                String column = (String) fk.get("column_name");
                String refTable = (String) fk.get("ref_table");
                String refColumn = (String) fk.get("ref_column");
                fkConstraints.add(new String[]{table, constraint, column, refTable, refColumn});
                try {
                    jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT " + constraint);
                } catch (Exception e) {
                    log.warn("Could not drop FK {}.{}: {}", table, constraint, e.getMessage());
                }
            }
            log.info("Dropped {} FK constraints for migration", fkConstraints.size());
        } catch (Exception e) {
            log.error("Failed to query FK constraints: {}", e.getMessage());
        }
    }

    private final List<String[]> fkConstraints = new ArrayList<>();

    private void enableForeignKeys() {
        int restored = 0;
        for (String[] fk : fkConstraints) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + fk[0] +
                    " ADD CONSTRAINT " + fk[1] +
                    " FOREIGN KEY (" + fk[2] + ") REFERENCES " + fk[3] + "(" + fk[4] + ")");
                restored++;
            } catch (Exception e) {
                log.warn("Could not restore FK {}.{}: {}", fk[0], fk[1], e.getMessage());
            }
        }
        log.info("Restored {}/{} FK constraints after migration", restored, fkConstraints.size());
    }

    private List<String> getTargetColumns(String tableName) {
        try {
            // Use SELECT to get column names — more reliable than JDBC metadata across dialects
            return jdbcTemplate.execute((Connection conn) -> {
                List<String> cols = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM " + tableName + " LIMIT 0");
                     ResultSet rs = ps.executeQuery()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    for (int i = 1; i <= meta.getColumnCount(); i++) {
                        cols.add(meta.getColumnName(i).toLowerCase());
                    }
                }
                return cols;
            });
        } catch (Exception e) {
            log.warn("Could not get columns for PG table {}: {}", tableName, e.getMessage());
            return List.of();
        }
    }

    /**
     * Compare record counts between H2 source and PostgreSQL target for all tables.
     * Flags deviations where PG count doesn't match H2.
     */
    public MigrationReport compareSourceAndTarget() {
        MigrationReport report = new MigrationReport();
        String h2Url = "jdbc:h2:file:" + h2DbPath + ";ACCESS_MODE_DATA=r;DB_CLOSE_ON_EXIT=TRUE";

        try (Connection h2Conn = DriverManager.getConnection(h2Url, "sa", "password")) {
            // Get all PG tables (lowercase)
            Set<String> allTables = new TreeSet<>(jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'", String.class));

            // Get all H2 tables (lowercase) so we don't miss tables that exist in H2 but not PG
            try (ResultSet rs = h2Conn.getMetaData().getTables(null, "PUBLIC", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    allTables.add(rs.getString("TABLE_NAME").toLowerCase());
                }
            }

            for (String tableName : allTables) {
                long h2Count = countH2Table(h2Conn, tableName.toUpperCase());
                long pgCount = countPgTable(tableName);
                report.addRow(tableName, h2Count, pgCount);
            }
        } catch (Exception e) {
            log.error("Comparison failed: {}", e.getMessage());
            report.setError(e.getMessage());
        }

        return report;
    }

    private long countH2Table(Connection h2Conn, String tableName) {
        try (Statement stmt = h2Conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
            return rs.next() ? rs.getLong(1) : 0;
        } catch (Exception e) {
            return -1; // table doesn't exist in H2
        }
    }

    private long countPgTable(String tableName) {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
            return count != null ? count : 0;
        } catch (Exception e) {
            return -1; // table doesn't exist in PG
        }
    }

    @Data
    public static class MigrationReport {
        private List<TableComparison> tables = new ArrayList<>();
        private String error;
        private int totalDeviations;
        private long totalH2Records;
        private long totalPgRecords;

        public void addRow(String table, long h2Count, long pgCount) {
            boolean match = h2Count == pgCount;
            tables.add(new TableComparison(table, h2Count, pgCount, match));
            totalH2Records += Math.max(h2Count, 0);
            totalPgRecords += Math.max(pgCount, 0);
            if (!match) totalDeviations++;
        }
    }

    @Data
    @lombok.AllArgsConstructor
    public static class TableComparison {
        private String table;
        private long h2Count;
        private long pgCount;
        private boolean match;
    }

    @Data
    public static class MigrationStatus {
        private boolean h2FileExists;
        private String h2FilePath;
        private double h2FileSizeMb;
        private String currentDatabase;
        private boolean runningOnPostgres;
        private long targetRecordCount;
    }

    @Data
    public static class MigrationResult {
        private boolean success;
        private String error;
        private int totalRecords;
        private Map<String, Integer> tableCounts;
        private Map<String, String> tableErrors = new LinkedHashMap<>();
        private long elapsedMs;
    }
}
