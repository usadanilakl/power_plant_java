package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.locks.ReentrantLock;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Service for full resync operations on the hub.
 * Key difference from sync-server: the hub's H2 database IS the production
 * database and its uploads/ directory IS the permanent storage.
 * No mirror entities needed.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubResyncService {

    private final EntityManager entityManager;
    private final EntityTableRegistry entityTableRegistry;
    private final HubSyncedFileRepository hubSyncedFileRepository;
    private final HubHealthStatsService healthStatsService;
    private final ObjectMapper objectMapper;

    @Value("${spring.datasource.url:jdbc:h2:file:./db/devdb}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:sa}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${files.root.path:${user.dir}/uploads}")
    private String filesRootPath;

    @Value("${sync.backup.storage-path:./backup-storage}")
    private String backupStoragePath;

    @Value("${sync.backup.cache-duration-minutes:5}")
    private int backupCacheDurationMinutes;

    @Value("${sync.backup.max-old-backups:3}")
    private int maxOldBackups;

    private final ReentrantLock backupLock = new ReentrantLock();
    private volatile Path cachedBackupPath = null;
    private volatile Instant cachedBackupTime = null;

    /**
     * Join tables to export for full database resync.
     */
    private static final List<JoinTableDef> JOIN_TABLES = List.of(
        new JoinTableDef("eq_loto_point", "equipmentId", "lotoPointId", "eq_id", "loto_point_id"),
        new JoinTableDef("file_point", "equipmentId", "fileId", "point_id", "file_id"),
        new JoinTableDef("loto_standard_loto_point", "lotoStandardId", "lotoPointId", "loto_standard_id", "loto_point_id"),
        new JoinTableDef("loto_standard_groups", "lotoStandardId", "valueId", "loto_standard_id", "value_id"),
        new JoinTableDef("ht_equipment", "heatTraceId", "equipmentId", "ht_id", "eq_id"),
        new JoinTableDef("ht_pid", "heatTraceId", "fileObjectId", "ht_id", "pid_id"),
        new JoinTableDef("breaker_eq", "breakerId", "equipmentId", "br_id", "eq_id"),
        new JoinTableDef("permit_equipment", "permitId", "equipmentId", "permit_id", "equipment_id"),
        new JoinTableDef("daily_permit_package_lotos", "dailyPermitPackageId", "lotoId", "daily_permit_package_id", "loto_id")
    );

    public HubResyncService(EntityManager entityManager,
                             EntityTableRegistry entityTableRegistry,
                             HubSyncedFileRepository hubSyncedFileRepository,
                             HubHealthStatsService healthStatsService,
                             ObjectMapper objectMapper) {
        this.entityManager = entityManager;
        this.entityTableRegistry = entityTableRegistry;
        this.hubSyncedFileRepository = hubSyncedFileRepository;
        this.healthStatsService = healthStatsService;
        this.objectMapper = objectMapper;
    }

    public ResyncHealth getHealth() {
        try {
            Map<String, Long> entityCounts = healthStatsService.getEntityCounts();
            long totalEntities = entityCounts.values().stream().mapToLong(Long::longValue).sum();
            long fileCount = countUploadFiles();

            return ResyncHealth.builder()
                .healthy(true)
                .entityCounts(entityCounts)
                .totalEntities(totalEntities)
                .totalSyncedFiles(fileCount)
                .lastUpdated(Instant.now())
                .build();
        } catch (Exception e) {
            log.error("Error getting resync health: {}", e.getMessage());
            return ResyncHealth.builder()
                .healthy(false)
                .errorMessage(e.getMessage())
                .build();
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportDatabaseJson() {
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("exportedAt", Instant.now().toString());
        export.put("version", "2.0");
        export.put("source", "hub");

        for (String entityType : entityTableRegistry.getSyncOrder()) {
            String tableName = entityTableRegistry.getTableName(entityType);
            try {
                List<?> rows = entityManager.createNativeQuery("SELECT * FROM " + tableName)
                    .getResultList();
                export.put(entityType, rows);
            } catch (Exception e) {
                log.debug("Could not export {}: {}", entityType, e.getMessage());
                export.put(entityType, List.of());
            }
        }

        // Export join tables
        for (JoinTableDef jt : JOIN_TABLES) {
            export.put(jt.tableName, getJoinData(jt));
        }

        return export;
    }

    @Transactional(readOnly = true)
    public byte[] exportDatabaseZip() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("exportedAt", Instant.now().toString());
            metadata.put("version", "2.0");
            metadata.put("source", "hub");
            addJsonEntry(zos, "metadata.json", metadata);

            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType);
                try {
                    List<?> rows = entityManager.createNativeQuery("SELECT * FROM " + tableName)
                        .getResultList();
                    addJsonEntry(zos, tableName + ".json", rows);
                } catch (Exception e) {
                    log.debug("Could not export {}: {}", entityType, e.getMessage());
                    addJsonEntry(zos, tableName + ".json", List.of());
                }
            }

            for (JoinTableDef jt : JOIN_TABLES) {
                addJsonEntry(zos, jt.tableName + ".json", getJoinData(jt));
            }
        }

        return baos.toByteArray();
    }

    /**
     * Create an H2 database backup of the hub's own production database.
     * Thread-safe with caching. Only works when hub runs on H2.
     */
    public Path createH2Backup() throws Exception {
        if (isPostgres()) {
            throw new UnsupportedOperationException(
                "H2 backup not available — hub is running on PostgreSQL. Use JSON ZIP export instead.");
        }

        backupLock.lock();
        try {
            if (isCachedBackupValid()) {
                log.debug("Using cached H2 backup: {}", cachedBackupPath);
                return cachedBackupPath;
            }

            Path backupDir = Paths.get(backupStoragePath).toAbsolutePath().normalize();
            Files.createDirectories(backupDir);

            String backupFileName = "hub_backup_" + System.currentTimeMillis() + ".zip";
            Path backupPath = backupDir.resolve(backupFileName);

            try (Connection conn = DriverManager.getConnection(datasourceUrl, datasourceUsername, datasourcePassword)) {
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("BACKUP TO '" + backupPath.toString() + "'");
                }
            }

            log.info("H2 backup created at: {}", backupPath);

            cachedBackupPath = backupPath;
            cachedBackupTime = Instant.now();

            cleanupOldBackups(backupDir, backupPath);
            return backupPath;
        } finally {
            backupLock.unlock();
        }
    }

    public byte[] getLatestH2Backup() throws Exception {
        Path backupPath = createH2Backup();
        return Files.readAllBytes(backupPath);
    }

    /**
     * Check if the hub is running on PostgreSQL.
     */
    public boolean isPostgres() {
        return datasourceUrl != null && datasourceUrl.startsWith("jdbc:postgresql:");
    }

    /**
     * Get the appropriate database backup for client cold resync.
     * Always returns an H2 backup ZIP — when running on PG, generates an H2 file from PG data.
     */
    public Path getClientResyncBackup() throws Exception {
        if (isPostgres()) {
            log.info("Hub on PostgreSQL — generating H2 backup from PG data for client cold resync");
            return createH2FromPostgres();
        } else {
            log.info("Hub on H2 — serving direct H2 backup for client cold resync");
            return createH2Backup();
        }
    }

    /**
     * Generate an H2 database file from PostgreSQL data, then BACKUP TO zip.
     * Creates a temporary H2 DB, copies all PG tables into it, and produces a backup ZIP.
     * Thread-safe with caching (same TTL as regular H2 backup).
     */
    private Path createH2FromPostgres() throws Exception {
        backupLock.lock();
        try {
            if (isCachedBackupValid()) {
                log.debug("Using cached PG→H2 backup: {}", cachedBackupPath);
                return cachedBackupPath;
            }

            Path backupDir = Paths.get(backupStoragePath).toAbsolutePath().normalize();
            Files.createDirectories(backupDir);

            // Create temp H2 database
            Path tempDbDir = backupDir.resolve("temp_h2");
            Files.createDirectories(tempDbDir);
            String tempDbPath = tempDbDir.resolve("clientdb").toString();
            String h2Url = "jdbc:h2:file:" + tempDbPath + ";DB_CLOSE_ON_EXIT=TRUE";

            long startTime = System.currentTimeMillis();

            try (Connection h2Conn = DriverManager.getConnection(h2Url, "sa", "password")) {
                // Create the id_seq sequence in H2
                try (Statement stmt = h2Conn.createStatement()) {
                    stmt.execute("CREATE SEQUENCE IF NOT EXISTS id_seq START WITH 1 INCREMENT BY 1 MAXVALUE 999999999 CYCLE");
                }

                // Get all PG tables
                List<String> pgTables;
                try (Connection pgConn = DriverManager.getConnection(datasourceUrl, datasourceUsername, datasourcePassword)) {
                    pgTables = new ArrayList<>();
                    try (ResultSet rs = pgConn.getMetaData().getTables(null, "public", "%", new String[]{"TABLE"})) {
                        while (rs.next()) {
                            pgTables.add(rs.getString("TABLE_NAME"));
                        }
                    }
                }

                log.info("Generating H2 from PG: {} tables to copy", pgTables.size());

                int totalCopied = 0;
                try (Connection pgConn = DriverManager.getConnection(datasourceUrl, datasourceUsername, datasourcePassword)) {
                    for (String tableName : pgTables) {
                        try {
                            int count = copyTablePgToH2(pgConn, h2Conn, tableName);
                            totalCopied += count;
                        } catch (Exception e) {
                            log.debug("Could not copy table {} to H2: {}", tableName, e.getMessage());
                        }
                    }
                }

                long elapsed = System.currentTimeMillis() - startTime;
                log.info("Copied {} records from PG to temp H2 in {}ms", totalCopied, elapsed);

                // Create H2 backup ZIP
                String backupFileName = "hub_backup_" + System.currentTimeMillis() + ".zip";
                Path backupPath = backupDir.resolve(backupFileName);
                try (Statement stmt = h2Conn.createStatement()) {
                    stmt.execute("BACKUP TO '" + backupPath.toString().replace('\\', '/') + "'");
                }

                log.info("H2 backup from PG created at: {} ({}ms total)", backupPath, System.currentTimeMillis() - startTime);

                cachedBackupPath = backupPath;
                cachedBackupTime = Instant.now();
                cleanupOldBackups(backupDir, backupPath);

                // Clean up temp H2 files
                try {
                    Files.deleteIfExists(Path.of(tempDbPath + ".mv.db"));
                    Files.deleteIfExists(Path.of(tempDbPath + ".trace.db"));
                } catch (Exception ignored) {}

                return backupPath;
            }
        } finally {
            backupLock.unlock();
        }
    }

    /**
     * Copy a single table from PG to H2.
     */
    private int copyTablePgToH2(Connection pgConn, Connection h2Conn, String tableName) throws SQLException {
        // Get PG columns
        List<String> columns = new ArrayList<>();
        List<Integer> columnTypes = new ArrayList<>();
        try (PreparedStatement ps = pgConn.prepareStatement("SELECT * FROM " + tableName + " LIMIT 0");
             ResultSet rs = ps.executeQuery()) {
            java.sql.ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                columns.add(meta.getColumnName(i));
                columnTypes.add(meta.getColumnType(i));
            }
        }
        if (columns.isEmpty()) return 0;

        // Create table in H2 (auto-detect types from data)
        // Use SELECT to create — simpler than building CREATE TABLE DDL
        // First try: if table exists in H2 already, skip creation
        boolean tableExists = false;
        try (ResultSet rs = h2Conn.getMetaData().getTables(null, null, tableName.toUpperCase(), null)) {
            tableExists = rs.next();
        }

        if (!tableExists) {
            // Build CREATE TABLE from PG metadata
            StringBuilder createSql = new StringBuilder("CREATE TABLE IF NOT EXISTS ");
            createSql.append(tableName.toUpperCase()).append(" (");
            try (PreparedStatement ps = pgConn.prepareStatement("SELECT * FROM " + tableName + " LIMIT 0");
                 ResultSet rs = ps.executeQuery()) {
                java.sql.ResultSetMetaData meta = rs.getMetaData();
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    if (i > 1) createSql.append(", ");
                    String colName = meta.getColumnName(i).toUpperCase();
                    String h2Type = pgTypeToH2(meta.getColumnTypeName(i), meta.getColumnDisplaySize(i));
                    createSql.append(colName).append(" ").append(h2Type);
                }
            }
            createSql.append(")");
            try (Statement stmt = h2Conn.createStatement()) {
                stmt.execute(createSql.toString());
            }
        }

        // Read all rows from PG
        String colList = String.join(", ", columns);
        String placeholders = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String insertSql = "INSERT INTO " + tableName.toUpperCase() + " (" +
            columns.stream().map(String::toUpperCase).collect(Collectors.joining(", ")) +
            ") VALUES (" + placeholders + ")";

        int count = 0;
        try (PreparedStatement pgPs = pgConn.prepareStatement("SELECT " + colList + " FROM " + tableName);
             ResultSet rs = pgPs.executeQuery()) {

            h2Conn.setAutoCommit(false);
            try (PreparedStatement h2Ps = h2Conn.prepareStatement(insertSql)) {
                while (rs.next()) {
                    for (int i = 0; i < columns.size(); i++) {
                        h2Ps.setObject(i + 1, rs.getObject(i + 1));
                    }
                    h2Ps.addBatch();
                    count++;
                    if (count % 1000 == 0) {
                        h2Ps.executeBatch();
                    }
                }
                h2Ps.executeBatch();
            }
            h2Conn.commit();
            h2Conn.setAutoCommit(true);
        }

        return count;
    }

    /**
     * Map PostgreSQL type names to H2 compatible types.
     */
    private String pgTypeToH2(String pgType, int size) {
        return switch (pgType.toLowerCase()) {
            case "int8", "bigint", "bigserial" -> "BIGINT";
            case "int4", "integer", "serial" -> "INTEGER";
            case "int2", "smallint" -> "SMALLINT";
            case "float8", "double precision" -> "DOUBLE";
            case "float4", "real" -> "REAL";
            case "numeric", "decimal" -> "DECIMAL";
            case "bool", "boolean" -> "BOOLEAN";
            case "text" -> "TEXT";
            case "varchar", "character varying" -> size > 0 && size < 10485760 ? "VARCHAR(" + size + ")" : "TEXT";
            case "timestamp", "timestamptz", "timestamp with time zone", "timestamp without time zone" -> "TIMESTAMP";
            case "date" -> "DATE";
            case "time", "timetz" -> "TIME";
            case "bytea" -> "BLOB";
            case "uuid" -> "VARCHAR(36)";
            case "jsonb", "json" -> "TEXT";
            default -> "TEXT";
        };
    }

    @Transactional(readOnly = true)
    public List<FileManifestEntry> getFileManifest() {
        List<HubSyncedFile> files = hubSyncedFileRepository.findAll().stream()
            .filter(f -> !f.isDeleted())
            .toList();

        return files.stream()
            .map(f -> FileManifestEntry.builder()
                .id(f.getId())
                .entityType(f.getEntityType())
                .entityId(f.getEntityId())
                .fileName(f.getFileName())
                .extension(f.getExtension())
                .fileSize(f.getFileSize())
                .fileHash(f.getFileHash())
                .storagePath(f.getStoragePath())
                .originalPath(f.getOriginalPath())
                .uploadedAt(f.getUploadedAt())
                .build())
            .toList();
    }

    public List<PathBasedManifestEntry> getPathBasedFileManifest() {
        List<PathBasedManifestEntry> manifest = new ArrayList<>();
        Path uploadsDir = Path.of(filesRootPath);

        if (!Files.exists(uploadsDir)) {
            log.warn("Uploads directory does not exist: {}", uploadsDir);
            return manifest;
        }

        try {
            Files.walkFileTree(uploadsDir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    String relativePath = uploadsDir.relativize(file).toString().replace('\\', '/');

                    manifest.add(PathBasedManifestEntry.builder()
                        .relativePath(relativePath)
                        .fileHash(null)
                        .fileSize(attrs.size())
                        .lastModified(attrs.lastModifiedTime().toInstant())
                        .build());

                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) {
                    log.warn("Failed to visit file: {}", file, exc);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            log.error("Error walking uploads directory: {}", e.getMessage());
        }

        log.info("Path-based manifest: {} files", manifest.size());
        return manifest;
    }

    /**
     * Load a file from the uploads directory by relative path.
     */
    public Optional<byte[]> loadFromUploads(String relativePath) {
        Path uploadsDir = Path.of(filesRootPath);
        Path filePath = uploadsDir.resolve(relativePath).normalize();

        // Security: ensure path doesn't escape uploads directory
        if (!filePath.startsWith(uploadsDir)) {
            log.warn("Path traversal attempt: {}", relativePath);
            return Optional.empty();
        }

        if (!Files.isRegularFile(filePath)) {
            return Optional.empty();
        }

        try {
            return Optional.of(Files.readAllBytes(filePath));
        } catch (IOException e) {
            log.error("Failed to read file {}: {}", filePath, e.getMessage());
            return Optional.empty();
        }
    }

    // ============ Private helpers ============

    private boolean isCachedBackupValid() {
        if (cachedBackupPath == null || cachedBackupTime == null) return false;
        Instant expiryTime = cachedBackupTime.plusSeconds(backupCacheDurationMinutes * 60L);
        if (Instant.now().isAfter(expiryTime)) return false;
        if (!Files.exists(cachedBackupPath)) {
            cachedBackupPath = null;
            cachedBackupTime = null;
            return false;
        }
        return true;
    }

    private void cleanupOldBackups(Path backupDir, Path currentBackup) {
        try {
            List<Path> backupFiles = new ArrayList<>();
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(backupDir, "hub_backup_*.zip")) {
                for (Path file : stream) {
                    if (!file.equals(currentBackup)) {
                        backupFiles.add(file);
                    }
                }
            }
            backupFiles.sort((a, b) -> b.getFileName().toString().compareTo(a.getFileName().toString()));
            for (int i = maxOldBackups; i < backupFiles.size(); i++) {
                try {
                    Files.deleteIfExists(backupFiles.get(i));
                    log.debug("Deleted old backup: {}", backupFiles.get(i));
                } catch (IOException e) {
                    log.warn("Failed to delete old backup: {}", backupFiles.get(i));
                }
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup old backups: {}", e.getMessage());
        }
    }

    private long countUploadFiles() {
        try {
            Path uploadsDir = Path.of(filesRootPath);
            if (!Files.isDirectory(uploadsDir)) return 0;
            try (var stream = Files.walk(uploadsDir)) {
                return stream.filter(Files::isRegularFile).count();
            }
        } catch (IOException e) {
            return 0;
        }
    }

    private String computeFileHash(Path file) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] content = Files.readAllBytes(file);
            return HexFormat.of().formatHex(digest.digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("SHA-256 not available", e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Long>> getJoinData(JoinTableDef jt) {
        List<Map<String, Long>> joinData = new ArrayList<>();
        try {
            List<Object[]> results = entityManager.createNativeQuery(
                "SELECT " + jt.col1Db + ", " + jt.col2Db + " FROM " + jt.tableName)
                .getResultList();
            for (Object[] row : results) {
                Map<String, Long> entry = new HashMap<>();
                entry.put(jt.col1Name, ((Number) row[0]).longValue());
                entry.put(jt.col2Name, ((Number) row[1]).longValue());
                joinData.add(entry);
            }
        } catch (Exception e) {
            log.debug("Could not query join table {}: {}", jt.tableName, e.getMessage());
        }
        return joinData;
    }

    private void addJsonEntry(ZipOutputStream zos, String name, Object data) throws IOException {
        zos.putNextEntry(new ZipEntry(name));
        byte[] json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
        zos.write(json);
        zos.closeEntry();
    }

    // ============ DTOs ============

    private record JoinTableDef(String tableName, String col1Name, String col2Name, String col1Db, String col2Db) {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResyncHealth {
        private boolean healthy;
        private Map<String, Long> entityCounts;
        private long totalEntities;
        private long totalSyncedFiles;
        private Instant lastUpdated;
        private String errorMessage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileManifestEntry {
        private Long id;
        private String entityType;
        private Long entityId;
        private String fileName;
        private String extension;
        private Long fileSize;
        private String fileHash;
        private String storagePath;
        private String originalPath;
        private Instant uploadedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PathBasedManifestEntry {
        private String relativePath;
        private String fileHash;
        private Long fileSize;
        private Instant lastModified;
    }
}
