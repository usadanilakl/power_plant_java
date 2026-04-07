package com.dk_power.power_plant_java.sevice.hub;

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
        if (status.getTargetRecordCount() > 0) {
            log.info("PostgreSQL has {} existing records — clearing before migration", status.getTargetRecordCount());
            clearAllTables();
        }

        String h2Url = "jdbc:h2:file:" + h2DbPath + ";ACCESS_MODE_DATA=r;DB_CLOSE_ON_EXIT=TRUE";

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

            long elapsed = System.currentTimeMillis() - startTime;
            result.setSuccess(true);
            result.setTotalRecords(totalMigrated);
            result.setTableCounts(tableCounts);
            result.setTableErrors(tableErrors);
            result.setElapsedMs(elapsed);
            log.info("Migration complete: {} total records in {}ms", totalMigrated, elapsed);

        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            result.setSuccess(false);
            result.setError(e.getMessage());
        } finally {
            enableForeignKeys();
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

    private int migrateJoinTable(Connection h2Conn, String tableName, String col1, String col2) throws SQLException {
        String h2TableName = tableName.toUpperCase();
        String h2Col1 = col1.toUpperCase();
        String h2Col2 = col2.toUpperCase();

        List<long[]> rows = new ArrayList<>();
        try (Statement stmt = h2Conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT " + h2Col1 + ", " + h2Col2 + " FROM " + h2TableName)) {
            while (rs.next()) {
                rows.add(new long[]{rs.getLong(1), rs.getLong(2)});
            }
        } catch (SQLException e) {
            log.debug("Join table {} not found in H2: {}", h2TableName, e.getMessage());
            return 0;
        }

        if (rows.isEmpty()) return 0;

        String insertSql = "INSERT INTO " + tableName + " (" + col1 + ", " + col2 + ") VALUES (?, ?)";
        int inserted = 0;
        for (long[] row : rows) {
            try {
                jdbcTemplate.update(insertSql, row[0], row[1]);
                inserted++;
            } catch (Exception e) {
                log.trace("Failed to insert into {}: {}", tableName, e.getMessage());
            }
        }
        return inserted;
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
            // Get all PG tables
            List<String> pgTables = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename", String.class);

            for (String tableName : pgTables) {
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
