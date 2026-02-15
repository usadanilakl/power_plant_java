package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import jakarta.persistence.EntityManager;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Service for importing bulk data from client exports into the hub's production database.
 * WARNING: This operates on the hub's REAL tables, not mirror tables.
 * Safety checks require force=true since the hub always has data.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubBulkImportService {

    private final EntityManager entityManager;
    private final DataSource dataSource;
    private final EntityTableRegistry entityTableRegistry;

    @Value("${sync.import.temp-dir:${java.io.tmpdir}/sync-import}")
    private String tempDir;

    @Value("${sync.import.max-file-size:524288000}")
    private long maxImportSize;

    @Value("${files.root.path:${user.dir}/uploads}")
    private String filesRootPath;

    private static final List<String> JOIN_TABLES = List.of(
        "eq_loto_point", "file_point", "loto_standard_loto_point", "loto_standard_groups",
        "ht_equipment", "ht_pid", "breaker_eq", "daily_permit_package_lotos", "permit_equipment"
    );

    private final Map<String, ChunkedUploadSession> activeUploads = new ConcurrentHashMap<>();
    private static final long CHUNK_SIZE = 100 * 1024 * 1024;

    public HubBulkImportService(EntityManager entityManager,
                                 DataSource dataSource,
                                 EntityTableRegistry entityTableRegistry) {
        this.entityManager = entityManager;
        this.dataSource = dataSource;
        this.entityTableRegistry = entityTableRegistry;
    }

    public SafetyCheckResult checkImportSafety(boolean force) {
        Map<String, Long> entityCounts = getEntityCounts();
        long totalEntities = entityCounts.values().stream().mapToLong(Long::longValue).sum();

        boolean isEmpty = totalEntities == 0;
        boolean safe = isEmpty || force;

        String message;
        if (isEmpty) {
            message = "Hub tables are empty - safe to import";
        } else if (force) {
            message = "WARNING: Force flag enabled - will overwrite " + totalEntities +
                " entities in hub's PRODUCTION database";
        } else {
            message = "Hub contains " + totalEntities +
                " entities in production. Use force=true to overwrite (DANGEROUS)";
        }

        return SafetyCheckResult.builder()
            .safe(safe)
            .isEmpty(isEmpty)
            .entityCounts(entityCounts)
            .totalEntities(totalEntities)
            .message(message)
            .build();
    }

    /**
     * Import a database backup into the hub's production tables.
     * Uses a single raw JDBC connection throughout to ensure SET REFERENTIAL_INTEGRITY FALSE
     * applies to all DELETE and INSERT operations (Spring's DataSourceUtils returns different
     * pool connections without transaction binding, which breaks this).
     */
    public ImportResult importDatabaseBackup(byte[] backupData, String machineId, boolean force)
            throws IOException {
        if (backupData == null || backupData.length == 0) {
            return ImportResult.builder().success(false).message("Empty backup data").build();
        }
        if (backupData.length > maxImportSize) {
            return ImportResult.builder().success(false)
                .message("Backup size exceeds maximum: " + maxImportSize + " bytes").build();
        }

        SafetyCheckResult safety = checkImportSafety(force);
        if (!safety.isSafe()) {
            return ImportResult.builder().success(false).message(safety.getMessage()).build();
        }

        long startTime = System.currentTimeMillis();
        Path tempPath = Paths.get(tempDir);
        Files.createDirectories(tempPath);
        Path extractDir = tempPath.resolve("import-" + System.currentTimeMillis());
        Files.createDirectories(extractDir);

        long entitiesImported = 0;
        long joinRecordsImported = 0;

        try {
            log.info("Extracting backup ({} bytes) to {}", backupData.length, extractDir);
            extractZip(backupData, extractDir);

            Path h2DbFile = extractDir.resolve("database.mv.db");
            if (!Files.exists(h2DbFile)) {
                try (var files = Files.list(extractDir)) {
                    String extracted = files.map(p -> p.getFileName().toString()).reduce("", (a, b) -> a + ", " + b);
                    log.error("database.mv.db not found. Extracted files: [{}]", extracted);
                }
                return ImportResult.builder().success(false)
                    .message("Database file not found in backup").build();
            }
            log.info("Found database file: {} ({} bytes)", h2DbFile, Files.size(h2DbFile));

            String h2Url = "jdbc:h2:" + extractDir.resolve("database") +
                ";MODE=LEGACY;ACCESS_MODE_DATA=r";

            // Use a single raw JDBC connection for ALL target operations.
            // This ensures SET REFERENTIAL_INTEGRITY FALSE applies to all DELETEs and INSERTs.
            try (Connection targetConn = dataSource.getConnection()) {
                targetConn.setAutoCommit(false);

                try {
                    try (Statement stmt = targetConn.createStatement()) {
                        stmt.execute("SET REFERENTIAL_INTEGRITY FALSE");
                        log.info("Disabled referential integrity for bulk import");
                    }

                    try (Connection sourceConn = DriverManager.getConnection(h2Url, "sa", "")) {
                        if (!safety.isEmpty()) {
                            log.info("Clearing existing hub table data (force import)");
                            clearTables(targetConn);
                        }

                        for (String entityType : entityTableRegistry.getSyncOrder()) {
                            String tableName = entityTableRegistry.getTableName(entityType);
                            long copied = copyTable(sourceConn, targetConn, tableName);
                            entitiesImported += copied;
                            if (copied > 0) {
                                log.info("Imported {} {} entities", copied, entityType);
                            }
                        }

                        for (String joinTable : JOIN_TABLES) {
                            long copied = copyTable(sourceConn, targetConn, joinTable);
                            joinRecordsImported += copied;
                            if (copied > 0) {
                                log.debug("Imported {} {} join records", copied, joinTable);
                            }
                        }
                    }

                    targetConn.commit();
                    log.info("Import transaction committed successfully");
                } catch (SQLException e) {
                    try { targetConn.rollback(); } catch (SQLException re) {
                        log.error("Rollback failed: {}", re.getMessage());
                    }
                    throw e;
                } finally {
                    try (Statement stmt = targetConn.createStatement()) {
                        stmt.execute("SET REFERENTIAL_INTEGRITY TRUE");
                        log.info("Re-enabled referential integrity");
                    } catch (SQLException e) {
                        log.error("Failed to re-enable referential integrity: {}", e.getMessage());
                    }
                    targetConn.setAutoCommit(true);
                }

                long durationMs = System.currentTimeMillis() - startTime;
                log.info("Database import complete: {} entities, {} join records in {}ms",
                    entitiesImported, joinRecordsImported, durationMs);

                return ImportResult.builder()
                    .success(true).message("Import successful")
                    .entitiesImported(entitiesImported)
                    .joinRecordsImported(joinRecordsImported)
                    .durationMs(durationMs).machineId(machineId)
                    .build();
            }
        } catch (SQLException e) {
            log.error("Database import failed: {}", e.getMessage(), e);
            return ImportResult.builder().success(false)
                .message("Database error: " + e.getMessage()).build();
        } finally {
            cleanupDirectory(extractDir);
        }
    }

    public ImportResult importFilesArchive(byte[] filesData, String machineId) throws IOException {
        if (filesData == null || filesData.length == 0) {
            return ImportResult.builder().success(false).message("Empty files data").build();
        }
        if (filesData.length > maxImportSize) {
            return ImportResult.builder().success(false)
                .message("Files archive exceeds maximum: " + maxImportSize + " bytes").build();
        }

        long startTime = System.currentTimeMillis();
        Path uploadsDir = Path.of(filesRootPath);
        Files.createDirectories(uploadsDir);

        long filesImported = 0;
        long bytesImported = 0;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(filesData))) {
            ZipEntry entry;
            byte[] buffer = new byte[8192];

            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    Files.createDirectories(uploadsDir.resolve(entry.getName()));
                    continue;
                }

                Path targetPath = uploadsDir.resolve(entry.getName());
                if (!targetPath.normalize().startsWith(uploadsDir)) {
                    log.warn("Skipping path traversal attempt: {}", entry.getName());
                    continue;
                }

                Files.createDirectories(targetPath.getParent());

                try (OutputStream os = Files.newOutputStream(targetPath)) {
                    int len;
                    long fileSize = 0;
                    while ((len = zis.read(buffer)) > 0) {
                        os.write(buffer, 0, len);
                        fileSize += len;
                    }
                    bytesImported += fileSize;
                    filesImported++;
                }
                zis.closeEntry();
            }
        }

        long durationMs = System.currentTimeMillis() - startTime;
        log.info("Files import complete: {} files, {} bytes in {}ms",
            filesImported, bytesImported, durationMs);

        return ImportResult.builder()
            .success(true).message("Files import successful")
            .filesImported(filesImported).bytesImported(bytesImported)
            .durationMs(durationMs).machineId(machineId)
            .build();
    }

    public ImportResult importFull(byte[] databaseData, byte[] filesData, String machineId, boolean force)
            throws IOException {
        long startTime = System.currentTimeMillis();

        ImportResult dbResult = importDatabaseBackup(databaseData, machineId, force);
        if (!dbResult.isSuccess()) return dbResult;

        ImportResult filesResult = importFilesArchive(filesData, machineId);
        if (!filesResult.isSuccess()) {
            return ImportResult.builder().success(false)
                .message("Database imported but files failed: " + filesResult.getMessage())
                .entitiesImported(dbResult.getEntitiesImported())
                .build();
        }

        return ImportResult.builder()
            .success(true).message("Full import successful")
            .entitiesImported(dbResult.getEntitiesImported())
            .joinRecordsImported(dbResult.getJoinRecordsImported())
            .filesImported(filesResult.getFilesImported())
            .bytesImported(filesResult.getBytesImported())
            .durationMs(System.currentTimeMillis() - startTime)
            .machineId(machineId)
            .build();
    }

    // ==================== Chunked Upload ====================

    public ChunkedUploadInit initChunkedUpload(String machineId, long totalSize, int totalChunks) {
        String uploadId = UUID.randomUUID().toString();
        Path uploadDir = Paths.get(tempDir, "chunked-" + uploadId);

        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            return ChunkedUploadInit.builder().success(false)
                .message("Failed to create upload directory").build();
        }

        activeUploads.put(uploadId, ChunkedUploadSession.builder()
            .uploadId(uploadId).machineId(machineId).totalSize(totalSize)
            .totalChunks(totalChunks).uploadDir(uploadDir)
            .receivedChunks(new ConcurrentHashMap<>()).startedAt(Instant.now())
            .build());

        log.info("Initialized chunked upload {} for {} ({} bytes, {} chunks)",
            uploadId, machineId, totalSize, totalChunks);

        return ChunkedUploadInit.builder()
            .success(true).uploadId(uploadId).chunkSize(CHUNK_SIZE)
            .message("Upload initialized").build();
    }

    public ChunkedUploadChunkResult uploadChunk(String uploadId, int chunkIndex, byte[] chunkData) {
        ChunkedUploadSession session = activeUploads.get(uploadId);
        if (session == null) {
            return ChunkedUploadChunkResult.builder().success(false)
                .message("Upload session not found: " + uploadId).build();
        }

        try {
            Path chunkFile = session.getUploadDir().resolve("chunk-" + chunkIndex);
            Files.write(chunkFile, chunkData);
            session.getReceivedChunks().put(chunkIndex, chunkFile);

            return ChunkedUploadChunkResult.builder()
                .success(true).chunkIndex(chunkIndex)
                .chunksReceived(session.getReceivedChunks().size())
                .totalChunks(session.getTotalChunks())
                .message("Chunk received").build();
        } catch (IOException e) {
            return ChunkedUploadChunkResult.builder().success(false)
                .message("Failed to write chunk: " + e.getMessage()).build();
        }
    }

    public ImportResult completeChunkedUpload(String uploadId) throws IOException {
        ChunkedUploadSession session = activeUploads.get(uploadId);
        if (session == null) {
            return ImportResult.builder().success(false)
                .message("Upload session not found: " + uploadId).build();
        }

        try {
            if (session.getReceivedChunks().size() != session.getTotalChunks()) {
                return ImportResult.builder().success(false)
                    .message("Missing chunks: received " + session.getReceivedChunks().size() +
                        " of " + session.getTotalChunks()).build();
            }

            long startTime = System.currentTimeMillis();
            Path uploadsDir = Path.of(filesRootPath);
            Files.createDirectories(uploadsDir);

            long filesImported = 0;
            long bytesImported = 0;

            try (SequenceInputStream sis = createChunkSequence(session);
                 ZipInputStream zis = new ZipInputStream(sis)) {

                ZipEntry entry;
                byte[] buffer = new byte[8192];

                while ((entry = zis.getNextEntry()) != null) {
                    if (entry.isDirectory()) {
                        Files.createDirectories(uploadsDir.resolve(entry.getName()));
                        continue;
                    }

                    Path targetPath = uploadsDir.resolve(entry.getName());
                    if (!targetPath.normalize().startsWith(uploadsDir)) {
                        log.warn("Skipping path traversal attempt: {}", entry.getName());
                        continue;
                    }

                    Files.createDirectories(targetPath.getParent());

                    try (OutputStream os = Files.newOutputStream(targetPath)) {
                        int len;
                        long fileSize = 0;
                        while ((len = zis.read(buffer)) > 0) {
                            os.write(buffer, 0, len);
                            fileSize += len;
                        }
                        bytesImported += fileSize;
                        filesImported++;
                    }
                    zis.closeEntry();
                }
            }

            long durationMs = System.currentTimeMillis() - startTime;
            log.info("Chunked files import complete: {} files, {} bytes in {}ms",
                filesImported, bytesImported, durationMs);

            return ImportResult.builder()
                .success(true).message("Chunked files import successful")
                .filesImported(filesImported).bytesImported(bytesImported)
                .durationMs(durationMs).machineId(session.getMachineId())
                .build();
        } finally {
            cleanupChunkedUpload(uploadId);
        }
    }

    public void cleanupChunkedUpload(String uploadId) {
        ChunkedUploadSession session = activeUploads.remove(uploadId);
        if (session != null) {
            cleanupDirectory(session.getUploadDir());
        }
    }

    public ChunkedUploadStatus getChunkedUploadStatus(String uploadId) {
        ChunkedUploadSession session = activeUploads.get(uploadId);
        if (session == null) {
            return ChunkedUploadStatus.builder().found(false)
                .message("Upload session not found").build();
        }
        return ChunkedUploadStatus.builder()
            .found(true).uploadId(uploadId)
            .totalChunks(session.getTotalChunks())
            .chunksReceived(session.getReceivedChunks().size())
            .totalSize(session.getTotalSize())
            .startedAt(session.getStartedAt())
            .build();
    }

    // ==================== Private helpers ====================

    private Map<String, Long> getEntityCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            String tableName = entityTableRegistry.getTableName(entityType);
            try {
                Long count = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM " + tableName).getSingleResult()).longValue();
                counts.put(entityType, count);
            } catch (Exception e) {
                counts.put(entityType, 0L);
            }
        }
        return counts;
    }

    private void clearTables(Connection conn) throws SQLException {
        for (String joinTable : JOIN_TABLES) {
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("DELETE FROM " + joinTable);
            } catch (Exception e) {
                log.debug("Could not clear join table {}: {}", joinTable, e.getMessage());
            }
        }
        // Reverse order to handle dependencies
        List<String> reversed = new ArrayList<>(entityTableRegistry.getSyncOrder());
        Collections.reverse(reversed);
        for (String entityType : reversed) {
            String tableName = entityTableRegistry.getTableName(entityType);
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("DELETE FROM " + tableName);
            } catch (Exception e) {
                log.debug("Could not clear table {}: {}", tableName, e.getMessage());
            }
        }
    }

    private long copyTable(Connection sourceConn, Connection targetConn, String tableName) throws SQLException {
        long sourceCount;
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
            rs.next();
            sourceCount = rs.getLong(1);
        } catch (SQLException e) {
            return 0;
        }
        if (sourceCount == 0) return 0;

        Set<String> sourceColumns = new LinkedHashSet<>();
        try (Statement stmt = sourceConn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName + " WHERE 1=0")) {
            ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                sourceColumns.add(meta.getColumnName(i).toUpperCase());
            }
        }
        if (sourceColumns.isEmpty()) return 0;

        Set<String> targetColumns = new LinkedHashSet<>();
        try (Statement stmt = targetConn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName + " WHERE 1=0")) {
            ResultSetMetaData meta = rs.getMetaData();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                targetColumns.add(meta.getColumnName(i).toUpperCase());
            }
        } catch (SQLException e) {
            return 0;
        }

        List<String> columns = sourceColumns.stream()
            .filter(targetColumns::contains).toList();
        if (columns.isEmpty()) return 0;

        String columnList = String.join(", ", columns);
        String valuePlaceholders = String.join(", ", columns.stream().map(c -> "?").toList());
        String insertSql = "INSERT INTO " + tableName + " (" + columnList + ") VALUES (" + valuePlaceholders + ")";
        String selectSql = "SELECT " + columnList + " FROM " + tableName;

        long copied = 0;
        try (Statement selectStmt = sourceConn.createStatement();
             PreparedStatement insertStmt = targetConn.prepareStatement(insertSql)) {
            selectStmt.setFetchSize(1000);
            try (ResultSet rs = selectStmt.executeQuery(selectSql)) {
                while (rs.next()) {
                    for (int i = 1; i <= columns.size(); i++) {
                        insertStmt.setObject(i, rs.getObject(i));
                    }
                    insertStmt.addBatch();
                    copied++;
                    if (copied % 1000 == 0) {
                        insertStmt.executeBatch();
                    }
                }
                insertStmt.executeBatch();
            }
        }
        return copied;
    }

    private SequenceInputStream createChunkSequence(ChunkedUploadSession session) throws IOException {
        List<InputStream> streams = new ArrayList<>();
        for (int i = 0; i < session.getTotalChunks(); i++) {
            Path chunkFile = session.getReceivedChunks().get(i);
            if (chunkFile == null) throw new IOException("Missing chunk " + i);
            streams.add(Files.newInputStream(chunkFile));
        }
        return new SequenceInputStream(Collections.enumeration(streams));
    }

    private void extractZip(byte[] zipData, Path extractDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipData))) {
            ZipEntry entry;
            byte[] buffer = new byte[8192];
            while ((entry = zis.getNextEntry()) != null) {
                Path targetPath = extractDir.resolve(entry.getName());
                if (!targetPath.normalize().startsWith(extractDir)) {
                    throw new IOException("Zip entry outside target directory: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(targetPath.getParent());
                    try (OutputStream os = Files.newOutputStream(targetPath)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            os.write(buffer, 0, len);
                        }
                    }
                }
                zis.closeEntry();
            }
        }
    }

    private void cleanupDirectory(Path dir) {
        try {
            if (Files.exists(dir)) {
                Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try { Files.deleteIfExists(path); } catch (IOException ignored) {}
                    });
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup directory: {}", dir);
        }
    }

    // ==================== DTOs ====================

    @Data @Builder
    public static class ChunkedUploadSession {
        private String uploadId;
        private String machineId;
        private long totalSize;
        private int totalChunks;
        private Path uploadDir;
        private Map<Integer, Path> receivedChunks;
        private Instant startedAt;
    }

    @Data @Builder
    public static class ChunkedUploadInit {
        private boolean success;
        private String uploadId;
        private long chunkSize;
        private String message;
    }

    @Data @Builder
    public static class ChunkedUploadChunkResult {
        private boolean success;
        private int chunkIndex;
        private int chunksReceived;
        private int totalChunks;
        private String message;
    }

    @Data @Builder
    public static class ChunkedUploadStatus {
        private boolean found;
        private String uploadId;
        private int totalChunks;
        private int chunksReceived;
        private long totalSize;
        private Instant startedAt;
        private String message;
    }

    @Data @Builder
    public static class SafetyCheckResult {
        private boolean safe;
        private boolean isEmpty;
        private Map<String, Long> entityCounts;
        private long totalEntities;
        private String message;
    }

    @Data @Builder
    public static class ImportResult {
        private boolean success;
        private String message;
        private long entitiesImported;
        private long joinRecordsImported;
        private long filesImported;
        private long bytesImported;
        private long durationMs;
        private String machineId;
        @Builder.Default
        private Instant importedAt = Instant.now();
    }
}
