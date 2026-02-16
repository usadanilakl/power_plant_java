package com.dk_power.power_plant_java.sevice.sync;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Service for exporting client database to a portable format for fast server import.
 *
 * Creates a temporary H2 database containing all entity data (without EntityListeners),
 * then exports it as a ZIP archive that the server can import directly into its
 * mirror tables.
 *
 * This approach is dramatically faster than generating ~1.6M FieldChanges:
 * - Current: ~3,200 HTTP requests, 30-60 minutes
 * - New: 1 HTTP request, 2-5 minutes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientDataExportService {

    private final DataSource dataSource;

    @Value("${sync.export.temp-dir:${java.io.tmpdir}/sync-export}")
    private String tempDir;

    /**
     * Entity types to export, matching server's SUPPORTED_TYPES.
     * Order matters for foreign key dependencies.
     */
    private static final List<String> ENTITY_TYPES = List.of(
        "Category", "Value", "Comment", "User", "FileObject",
        "Equipment", "LotoPoint", "Loto", "LotoStandard", "LotoSnapshot",
        "LotoBox", "Lock", "ZeroEnergy", "HeatTrace", "Highlight",
        "ElectricalPanel", "EqBreaker", "HtPanel", "HtBreaker",
        "EspDevice", "LedStrip",
        "SafeWork", "HotWork", "ConfinedSpace", "WorkRequest", "Jha",
        "DailyPermitPackage", "JobLog", "FireImpairment",
        "PrintableForm", "FormContainer", "Flow", "Task"
    );

    /**
     * ManyToMany join tables to export.
     * Format: [join_table_name, owner_column, related_column]
     */
    private static final List<String[]> JOIN_TABLES = List.of(
        new String[]{"eq_loto_point", "eq_id", "loto_point_id"},
        new String[]{"file_point", "point_id", "file_id"},
        new String[]{"loto_standard_loto_point", "loto_standard_id", "loto_point_id"},
        new String[]{"loto_standard_groups", "loto_standard_id", "value_id"},
        new String[]{"ht_equipment", "ht_id", "eq_id"},
        new String[]{"ht_pid", "ht_id", "pid_id"},
        new String[]{"breaker_eq", "br_id", "eq_id"},
        new String[]{"daily_permit_package_lotos", "daily_permit_package_id", "loto_id"},
        new String[]{"permit_equipment", "permit_id", "equipment_id"},
        new String[]{"task_dependencies", "dependent_task_id", "prerequisite_task_id"}
    );

    /**
     * Create a ZIP archive containing an H2 database backup with all entity data.
     * This backup can be imported directly by the server.
     *
     * @return ZIP archive as byte array, or empty array if no data
     */
    @Transactional(readOnly = true)
    public byte[] createExportBackup() throws IOException, SQLException {
        Path tempPath = Paths.get(tempDir);
        Files.createDirectories(tempPath);

        Path tempDbFile = tempPath.resolve("export-" + System.currentTimeMillis());
        String tempDbUrl = "jdbc:h2:" + tempDbFile.toString() + ";MODE=LEGACY";

        ExportStats stats = new ExportStats();
        stats.setStartedAt(Instant.now());

        try {
            // Step 1: Create temp H2 database and copy data
            try (Connection sourceConn = dataSource.getConnection();
                 Connection tempConn = DriverManager.getConnection(tempDbUrl, "sa", "")) {

                // Step 1a: Validate data quality before export
                validateJoinTableData(sourceConn, stats);

                // Create schema in temp database
                createTempSchema(sourceConn, tempConn);

                // Copy all entity tables
                for (String entityType : ENTITY_TYPES) {
                    String tableName = getTableName(entityType);
                    long copied = copyTableData(sourceConn, tempConn, tableName, entityType);
                    stats.addEntityCount(entityType, copied);
                    log.debug("Copied {} {} records", copied, entityType);
                }

                // Copy ManyToMany join tables
                for (String[] joinTable : JOIN_TABLES) {
                    long copied = copyJoinTable(sourceConn, tempConn, joinTable[0]);
                    stats.addJoinTableCount(joinTable[0], copied);
                    log.debug("Copied {} {} join records", copied, joinTable[0]);
                }

                // Compact the temp database
                tempConn.createStatement().execute("SHUTDOWN COMPACT");
            }

            // Step 2: Create ZIP archive from H2 files
            byte[] zipData = createZipFromH2Files(tempDbFile, stats);

            stats.setCompletedAt(Instant.now());
            log.info("Export complete: {} entities, {} join records, {} bytes compressed",
                stats.getTotalEntities(), stats.getTotalJoinRecords(), zipData.length);

            return zipData;

        } finally {
            // Clean up temp files
            cleanupTempFiles(tempDbFile);
        }
    }

    /**
     * Get export statistics without creating the backup.
     * Useful for UI display before starting export.
     */
    @Transactional(readOnly = true)
    public ExportStats getExportStats() throws SQLException {
        ExportStats stats = new ExportStats();

        try (Connection conn = dataSource.getConnection()) {
            for (String entityType : ENTITY_TYPES) {
                String tableName = getTableName(entityType);
                long count = getTableCount(conn, tableName);
                stats.addEntityCount(entityType, count);
            }

            for (String[] joinTable : JOIN_TABLES) {
                long count = getJoinTableCount(conn, joinTable[0]);
                stats.addJoinTableCount(joinTable[0], count);
            }
        }

        return stats;
    }

    /**
     * Create the schema in the temporary database.
     * We use a flexible schema that can hold any entity data.
     */
    private void createTempSchema(Connection sourceConn, Connection tempConn) throws SQLException {
        try (Statement stmt = tempConn.createStatement()) {
            // Create tables for each entity type
            for (String entityType : ENTITY_TYPES) {
                String tableName = getTableName(entityType);
                createEntityTable(sourceConn, stmt, tableName, entityType);
            }

            // Create join tables
            for (String[] joinTable : JOIN_TABLES) {
                stmt.execute(String.format(
                    "CREATE TABLE IF NOT EXISTS %s (%s BIGINT, %s BIGINT, PRIMARY KEY (%s, %s))",
                    joinTable[0], joinTable[1], joinTable[2], joinTable[1], joinTable[2]
                ));
            }
        }
    }

    /**
     * Create a table in temp DB matching the source table structure.
     */
    private void createEntityTable(Connection sourceConn, Statement stmt, String tableName, String entityType) throws SQLException {
        DatabaseMetaData meta = sourceConn.getMetaData();
        try (ResultSet columns = meta.getColumns(null, null, tableName.toUpperCase(), null)) {
            StringBuilder createSql = new StringBuilder("CREATE TABLE IF NOT EXISTS ");
            createSql.append(tableName).append(" (");

            List<String> columnDefs = new ArrayList<>();
            boolean hasColumns = false;

            while (columns.next()) {
                hasColumns = true;
                String columnName = columns.getString("COLUMN_NAME");
                String typeName = columns.getString("TYPE_NAME");
                int columnSize = columns.getInt("COLUMN_SIZE");
                boolean nullable = columns.getInt("NULLABLE") == DatabaseMetaData.columnNullable;

                String columnDef = columnName + " " + mapColumnType(typeName, columnSize);
                if (!nullable && "ID".equalsIgnoreCase(columnName)) {
                    columnDef += " PRIMARY KEY";
                }
                columnDefs.add(columnDef);
            }

            if (!hasColumns) {
                // Try lowercase table name
                try (ResultSet columnsLower = meta.getColumns(null, null, tableName.toLowerCase(), null)) {
                    while (columnsLower.next()) {
                        hasColumns = true;
                        String columnName = columnsLower.getString("COLUMN_NAME");
                        String typeName = columnsLower.getString("TYPE_NAME");
                        int columnSize = columnsLower.getInt("COLUMN_SIZE");
                        boolean nullable = columnsLower.getInt("NULLABLE") == DatabaseMetaData.columnNullable;

                        String columnDef = columnName + " " + mapColumnType(typeName, columnSize);
                        if (!nullable && "ID".equalsIgnoreCase(columnName)) {
                            columnDef += " PRIMARY KEY";
                        }
                        columnDefs.add(columnDef);
                    }
                }
            }

            if (!hasColumns) {
                log.warn("No columns found for table {}, skipping", tableName);
                return;
            }

            createSql.append(String.join(", ", columnDefs));
            createSql.append(")");

            stmt.execute(createSql.toString());
        }
    }

    /**
     * Map source column types to H2 compatible types.
     */
    private String mapColumnType(String typeName, int size) {
        if (typeName == null) return "VARCHAR(255)";

        return switch (typeName.toUpperCase()) {
            case "BIGINT", "INT8" -> "BIGINT";
            case "INTEGER", "INT", "INT4" -> "INTEGER";
            case "SMALLINT", "INT2" -> "SMALLINT";
            case "BOOLEAN", "BOOL", "BIT" -> "BOOLEAN";
            case "DOUBLE", "FLOAT8", "DOUBLE PRECISION" -> "DOUBLE";
            case "REAL", "FLOAT4" -> "REAL";
            case "DECIMAL", "NUMERIC" -> "DECIMAL";
            case "DATE" -> "DATE";
            case "TIME" -> "TIME";
            case "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIMESTAMPTZ" -> "TIMESTAMP";
            case "UUID" -> "UUID";
            case "TEXT", "CLOB" -> "CLOB";
            case "BLOB", "BYTEA" -> "BLOB";
            default -> size > 0 ? "VARCHAR(" + Math.min(size, 10000) + ")" : "VARCHAR(255)";
        };
    }

    /**
     * Copy data from source table to temp table.
     */
    private long copyTableData(Connection sourceConn, Connection tempConn, String tableName, String entityType)
            throws SQLException {

        String selectSql = "SELECT * FROM " + tableName + " WHERE deleted IS NOT TRUE";
        String countSql = "SELECT COUNT(*) FROM " + tableName + " WHERE deleted IS NOT TRUE";

        // First, check if the table exists and get count
        long totalRows;
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            rs.next();
            totalRows = rs.getLong(1);
        } catch (SQLException e) {
            // Table might not exist or not have deleted column
            log.debug("Could not count table {}: {}", tableName, e.getMessage());
            return 0;
        }

        if (totalRows == 0) {
            return 0;
        }

        // Get column information
        List<String> columns = new ArrayList<>();
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName + " WHERE 1=0")) {
            ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                columns.add(meta.getColumnName(i));
            }
        }

        if (columns.isEmpty()) {
            return 0;
        }

        // Build insert SQL
        String columnList = String.join(", ", columns);
        String placeholders = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String insertSql = "INSERT INTO " + tableName + " (" + columnList + ") VALUES (" + placeholders + ")";

        // Copy data in batches
        long copiedRows = 0;
        try (Statement selectStmt = sourceConn.createStatement();
             PreparedStatement insertStmt = tempConn.prepareStatement(insertSql)) {

            selectStmt.setFetchSize(1000);
            try (ResultSet rs = selectStmt.executeQuery(selectSql)) {
                while (rs.next()) {
                    for (int i = 1; i <= columns.size(); i++) {
                        Object value = rs.getObject(i);
                        insertStmt.setObject(i, value);
                    }
                    insertStmt.addBatch();
                    copiedRows++;

                    if (copiedRows % 1000 == 0) {
                        insertStmt.executeBatch();
                    }
                }
                insertStmt.executeBatch();
            }
        }

        return copiedRows;
    }

    /**
     * Copy a ManyToMany join table.
     */
    private long copyJoinTable(Connection sourceConn, Connection tempConn, String tableName)
            throws SQLException {

        // Use DISTINCT to avoid duplicate key violations from dirty join table data
        String selectSql = "SELECT DISTINCT * FROM " + tableName;
        String countSql = "SELECT COUNT(*) FROM " + tableName;

        long totalRows;
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            rs.next();
            totalRows = rs.getLong(1);
        } catch (SQLException e) {
            log.debug("Could not count join table {}: {}", tableName, e.getMessage());
            return 0;
        }

        if (totalRows == 0) {
            return 0;
        }

        // Get column information
        List<String> columns = new ArrayList<>();
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName + " WHERE 1=0")) {
            ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                columns.add(meta.getColumnName(i));
            }
        }

        String columnList = String.join(", ", columns);
        String placeholders = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String insertSql = "INSERT INTO " + tableName + " (" + columnList + ") VALUES (" + placeholders + ")";

        long copiedRows = 0;
        try (Statement selectStmt = sourceConn.createStatement();
             PreparedStatement insertStmt = tempConn.prepareStatement(insertSql)) {

            try (ResultSet rs = selectStmt.executeQuery(selectSql)) {
                while (rs.next()) {
                    for (int i = 1; i <= columns.size(); i++) {
                        insertStmt.setObject(i, rs.getObject(i));
                    }
                    insertStmt.addBatch();
                    copiedRows++;

                    if (copiedRows % 1000 == 0) {
                        insertStmt.executeBatch();
                    }
                }
                insertStmt.executeBatch();
            }
        }

        return copiedRows;
    }

    /**
     * Get count of records in a table.
     */
    private long getTableCount(Connection conn, String tableName) {
        String sql = "SELECT COUNT(*) FROM " + tableName + " WHERE deleted IS NOT TRUE";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        } catch (SQLException e) {
            return 0;
        }
    }

    /**
     * Get count of records in a join table.
     */
    private long getJoinTableCount(Connection conn, String tableName) {
        String sql = "SELECT COUNT(*) FROM " + tableName;
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        } catch (SQLException e) {
            return 0;
        }
    }

    /**
     * Validate join table data quality before export.
     * Logs warnings for duplicate entries that will be deduplicated during export.
     */
    private void validateJoinTableData(Connection conn, ExportStats stats) {
        log.info("Validating join table data quality...");
        long totalDuplicates = 0;

        for (String[] joinTable : JOIN_TABLES) {
            String tableName = joinTable[0];
            String col1 = joinTable[1];
            String col2 = joinTable[2];

            try {
                // Count total rows vs distinct rows
                String countSql = "SELECT COUNT(*) as total, COUNT(DISTINCT " + col1 + " || '-' || " + col2 + ") as distinct_count FROM " + tableName;
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(countSql)) {
                    if (rs.next()) {
                        long total = rs.getLong("total");
                        long distinct = rs.getLong("distinct_count");
                        long duplicates = total - distinct;

                        if (duplicates > 0) {
                            log.warn("Join table {} has {} duplicate entries (total: {}, unique: {})",
                                tableName, duplicates, total, distinct);
                            stats.addDuplicateCount(tableName, duplicates);
                            totalDuplicates += duplicates;
                        }
                    }
                }
            } catch (SQLException e) {
                log.debug("Could not validate join table {}: {}", tableName, e.getMessage());
            }
        }

        if (totalDuplicates > 0) {
            log.warn("Total duplicate join table entries found: {} (will be deduplicated during export)", totalDuplicates);
        } else {
            log.info("No duplicate join table entries found - data quality is good");
        }
    }

    /**
     * Create a ZIP archive from the H2 database files.
     */
    private byte[] createZipFromH2Files(Path tempDbPath, ExportStats stats) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            // Find all H2 database files (*.mv.db, *.trace.db, etc.)
            String baseName = tempDbPath.getFileName().toString();
            Path parentDir = tempDbPath.getParent();

            try (DirectoryStream<Path> stream = Files.newDirectoryStream(parentDir, baseName + ".*")) {
                for (Path file : stream) {
                    String fileName = file.getFileName().toString();
                    // Only include .mv.db file (main data file)
                    if (fileName.endsWith(".mv.db")) {
                        ZipEntry entry = new ZipEntry("database.mv.db");
                        zos.putNextEntry(entry);
                        Files.copy(file, zos);
                        zos.closeEntry();
                        stats.setDatabaseFileSize(Files.size(file));
                    }
                }
            }

            // Add manifest with entity counts
            ZipEntry manifestEntry = new ZipEntry("manifest.json");
            zos.putNextEntry(manifestEntry);
            String manifest = createManifestJson(stats);
            zos.write(manifest.getBytes());
            zos.closeEntry();
        }

        return baos.toByteArray();
    }

    /**
     * Create manifest JSON with export metadata.
     */
    private String createManifestJson(ExportStats stats) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"exportedAt\": \"").append(Instant.now()).append("\",\n");
        sb.append("  \"totalEntities\": ").append(stats.getTotalEntities()).append(",\n");
        sb.append("  \"totalJoinRecords\": ").append(stats.getTotalJoinRecords()).append(",\n");
        sb.append("  \"entityCounts\": {\n");

        int i = 0;
        for (Map.Entry<String, Long> entry : stats.getEntityCounts().entrySet()) {
            sb.append("    \"").append(entry.getKey()).append("\": ").append(entry.getValue());
            if (i < stats.getEntityCounts().size() - 1) {
                sb.append(",");
            }
            sb.append("\n");
            i++;
        }

        sb.append("  },\n");
        sb.append("  \"joinTableCounts\": {\n");

        i = 0;
        for (Map.Entry<String, Long> entry : stats.getJoinTableCounts().entrySet()) {
            sb.append("    \"").append(entry.getKey()).append("\": ").append(entry.getValue());
            if (i < stats.getJoinTableCounts().size() - 1) {
                sb.append(",");
            }
            sb.append("\n");
            i++;
        }

        sb.append("  }");

        // Include duplicate counts if any were found
        if (!stats.getDuplicateCounts().isEmpty()) {
            sb.append(",\n");
            sb.append("  \"duplicatesRemoved\": {\n");
            i = 0;
            for (Map.Entry<String, Long> entry : stats.getDuplicateCounts().entrySet()) {
                sb.append("    \"").append(entry.getKey()).append("\": ").append(entry.getValue());
                if (i < stats.getDuplicateCounts().size() - 1) {
                    sb.append(",");
                }
                sb.append("\n");
                i++;
            }
            sb.append("  }");
        }

        sb.append("\n}");

        return sb.toString();
    }

    /**
     * Clean up temporary database files.
     */
    private void cleanupTempFiles(Path tempDbPath) {
        try {
            String baseName = tempDbPath.getFileName().toString();
            Path parentDir = tempDbPath.getParent();

            try (DirectoryStream<Path> stream = Files.newDirectoryStream(parentDir, baseName + ".*")) {
                for (Path file : stream) {
                    Files.deleteIfExists(file);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to clean up temp files: {}", e.getMessage());
        }
    }

    /**
     * Map entity type to database table name.
     * Must match server's getTableName() in ServerEntitySyncService.
     */
    private String getTableName(String entityType) {
        return switch (entityType) {
            case "Category" -> "category";
            case "Value" -> "val_table";
            case "FileObject" -> "file_object";
            case "Equipment" -> "equipment";
            case "LotoPoint" -> "loto_point";
            case "Loto" -> "loto";
            case "LotoStandard" -> "loto_standard";
            case "LotoSnapshot" -> "loto_snapshot";
            case "LotoBox" -> "loto_boxes";
            case "Lock" -> "lock";
            case "ZeroEnergy" -> "zero_energy";
            case "HeatTrace" -> "heat_trace";
            case "Highlight" -> "highlight";
            case "ElectricalPanel" -> "electrical_panel";
            case "EqBreaker" -> "eq_breaker";
            case "HtPanel" -> "ht_panel";
            case "HtBreaker" -> "ht_breaker";
            case "User" -> "users";
            case "EspDevice" -> "esp_devices";
            case "LedStrip" -> "led_strips";
            case "SafeWork" -> "safe_work";
            case "HotWork" -> "hot_work";
            case "ConfinedSpace" -> "confined_space";
            case "WorkRequest" -> "work_request";
            case "DailyPermitPackage" -> "daily_permit_package";
            case "Comment" -> "comment";
            case "FireImpairment" -> "fire_impairment";
            case "Jha" -> "jha";
            case "JobLog" -> "job_log";
            case "PrintableForm" -> "printable_form";
            case "FormContainer" -> "form_container";
            case "Flow" -> "flow";
            case "Task" -> "task";
            case "Role" -> "roles";
            default -> entityType.toLowerCase();
        };
    }

    // ==================== DTOs ====================

    @Data
    public static class ExportStats {
        private Instant startedAt;
        private Instant completedAt;
        private Map<String, Long> entityCounts = new LinkedHashMap<>();
        private Map<String, Long> joinTableCounts = new LinkedHashMap<>();
        private Map<String, Long> duplicateCounts = new LinkedHashMap<>();
        private long databaseFileSize;

        public void addEntityCount(String entityType, long count) {
            entityCounts.put(entityType, count);
        }

        public void addJoinTableCount(String tableName, long count) {
            joinTableCounts.put(tableName, count);
        }

        public void addDuplicateCount(String tableName, long count) {
            duplicateCounts.put(tableName, count);
        }

        public long getTotalEntities() {
            return entityCounts.values().stream().mapToLong(Long::longValue).sum();
        }

        public long getTotalJoinRecords() {
            return joinTableCounts.values().stream().mapToLong(Long::longValue).sum();
        }

        public long getTotalDuplicates() {
            return duplicateCounts.values().stream().mapToLong(Long::longValue).sum();
        }

        public long getDurationMs() {
            if (startedAt == null || completedAt == null) {
                return 0;
            }
            return completedAt.toEpochMilli() - startedAt.toEpochMilli();
        }
    }
}
