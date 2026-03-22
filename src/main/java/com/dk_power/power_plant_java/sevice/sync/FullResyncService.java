package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.app_services.H2BackupService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Handles full resync operations for disaster recovery scenarios.
 *
 * Features:
 * 1. Server-based backup (sync server maintains mirror of all entity data)
 * 2. Sync health monitoring and mismatch detection
 * 3. Full resync from server with incremental file restore
 * 4. Protection against accidental large deletions
 *
 * The sync server applies all FieldChanges to its mirror tables, so it always
 * has an up-to-date copy of the database that can be used for restore.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FullResyncService {

    private final H2BackupService h2BackupService;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final SyncHealthChecker syncHealthChecker;
    private final FieldSyncService fieldSyncService;
    private final FileRepo fileRepo;
    private final AttachmentSyncHandler attachmentSyncHandler;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${h2.backup.shared.directory:}")
    private String sharedBackupDirectory;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    @Value("${sync.backup.file.directory:}")
    private String sharedFileBackupDirectory;

    // Safety thresholds for deletion protection
    private static final double MAX_DELETE_PERCENTAGE = 0.25; // Max 25% of files can be deleted in one resync
    private static final int MAX_DELETE_COUNT = 100; // Max 100 files can be deleted without confirmation
    private static final int MIN_FILES_FOR_PERCENTAGE_CHECK = 20; // Only apply percentage check if >= 20 files

    // Phase weights for full resync progress (total = 100%)
    private static final int PHASE_DB_DOWNLOAD = 15;      // 0-15%
    private static final int PHASE_DB_RESTORE = 10;       // 15-25%
    private static final int PHASE_FILE_COMPARE = 5;      // 25-30%
    private static final int PHASE_FILE_DOWNLOAD = 60;    // 30-90%
    private static final int PHASE_FILE_DELETE = 10;      // 90-100%

    // Resync state tracking
    private final AtomicBoolean resyncInProgress = new AtomicBoolean(false);
    private final AtomicBoolean backupInProgress = new AtomicBoolean(false);
    private volatile ResyncStatus currentResyncStatus = new ResyncStatus();
    private volatile BackupStatus currentBackupStatus = new BackupStatus();

    // File manifest cache
    private static final String MANIFEST_FILENAME = "file_manifest.json";
    private static final String BACKUP_METADATA_FILENAME = "backup_metadata.json";


    // ==================== BACKUP CREATION ====================

    /**
     * Create a full backup (DB + file manifest) to the shared drive.
     * This should be run periodically on a machine that is known to be up-to-date.
     */
    public BackupResult createFullBackup() {
        if (!backupInProgress.compareAndSet(false, true)) {
            return new BackupResult(false, "Backup already in progress", null);
        }

        currentBackupStatus = new BackupStatus();
        currentBackupStatus.setStartTime(Instant.now());
        currentBackupStatus.setPhase("Starting backup");

        try {
            // Validate shared directory is accessible
            if (sharedBackupDirectory == null || sharedBackupDirectory.isEmpty()) {
                return new BackupResult(false, "Shared backup directory not configured", null);
            }

            Path sharedDir = Paths.get(sharedBackupDirectory);
            if (!Files.exists(sharedDir) || !Files.isWritable(sharedDir)) {
                return new BackupResult(false, "Shared backup directory not accessible: " + sharedDir, null);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupName = "full_backup_" + timestamp;

            // Phase 1: Create database backup
            currentBackupStatus.setPhase("Creating database backup");
            log.info("Creating database backup: {}", backupName);
            h2BackupService.backupDatabase(backupName);

            // Phase 2: Generate file manifest
            currentBackupStatus.setPhase("Generating file manifest");
            log.info("Generating file manifest");
            FileManifest manifest = generateFileManifest();
            currentBackupStatus.setTotalFiles(manifest.getFiles().size());

            // Phase 3: Save manifest to shared drive
            currentBackupStatus.setPhase("Saving manifest");
            Path manifestPath = sharedDir.resolve(MANIFEST_FILENAME);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(manifestPath.toFile(), manifest);
            log.info("Saved file manifest with {} files to {}", manifest.getFiles().size(), manifestPath);

            // Phase 4: Create backup metadata
            currentBackupStatus.setPhase("Creating metadata");
            BackupMetadata metadata = new BackupMetadata();
            metadata.setTimestamp(Instant.now());
            metadata.setMachineId(syncConfig.getMachineId());
            metadata.setMachineName(syncConfig.getMachineName());
            metadata.setDatabaseBackupFile(backupName + ".zip");
            metadata.setFileCount(manifest.getFiles().size());
            metadata.setTotalFileSize(manifest.getTotalSize());

            Path metadataPath = sharedDir.resolve(BACKUP_METADATA_FILENAME);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(metadataPath.toFile(), metadata);

            // Phase 5: Sync files to backup (incremental)
            if (sharedFileBackupDirectory != null && !sharedFileBackupDirectory.isEmpty()) {
                currentBackupStatus.setPhase("Syncing files to backup");
                syncFilesToBackup(manifest);
            }

            currentBackupStatus.setPhase("Complete");
            currentBackupStatus.setEndTime(Instant.now());
            currentBackupStatus.setSuccess(true);

            log.info("Full backup complete: DB={}, Files={}", backupName, manifest.getFiles().size());
            return new BackupResult(true, "Backup completed successfully", metadata);

        } catch (Exception e) {
            log.error("Backup failed: {}", e.getMessage(), e);
            currentBackupStatus.setPhase("Failed: " + e.getMessage());
            currentBackupStatus.setSuccess(false);
            return new BackupResult(false, "Backup failed: " + e.getMessage(), null);
        } finally {
            backupInProgress.set(false);
        }
    }

    /**
     * Scheduled backup - runs daily at 2 AM if this machine is configured as backup source.
     */
    @Scheduled(cron = "${sync.backup.cron:0 0 2 * * ?}")
    public void scheduledBackup() {
        // Only run scheduled backup if explicitly enabled
        String backupEnabled = System.getProperty("sync.backup.enabled", "false");
        if (!"true".equalsIgnoreCase(backupEnabled)) {
            return;
        }
        log.info("Running scheduled full backup");
        createFullBackup();
    }

    /**
     * Generate a manifest of all files in the uploads directory.
     */
    private FileManifest generateFileManifest() throws IOException {
        FileManifest manifest = new FileManifest();
        manifest.setGeneratedAt(Instant.now());
        manifest.setMachineId(syncConfig.getMachineId());

        Path uploadsPath = getUploadsPath();
        if (!Files.exists(uploadsPath)) {
            log.warn("Uploads directory does not exist: {}", uploadsPath);
            return manifest;
        }

        List<FileManifestEntry> entries = new ArrayList<>();
        AtomicInteger count = new AtomicInteger(0);

        Files.walkFileTree(uploadsPath, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                String relativePath = uploadsPath.relativize(file).toString().replace('\\', '/');
                String checksum = computeChecksum(file);

                FileManifestEntry entry = new FileManifestEntry();
                entry.setRelativePath(relativePath);
                entry.setChecksum(checksum);
                entry.setSize(attrs.size());
                entry.setLastModified(attrs.lastModifiedTime().toInstant());

                entries.add(entry);

                int current = count.incrementAndGet();
                if (current % 100 == 0) {
                    currentBackupStatus.setProcessedFiles(current);
                    log.debug("Processed {} files for manifest", current);
                }

                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) {
                log.warn("Failed to access file {}: {}", file, exc.getMessage());
                return FileVisitResult.CONTINUE;
            }
        });

        manifest.setFiles(entries);
        manifest.setTotalSize(entries.stream().mapToLong(FileManifestEntry::getSize).sum());

        return manifest;
    }

    /**
     * Sync files to backup directory (incremental - only changed files).
     */
    private void syncFilesToBackup(FileManifest manifest) throws IOException {
        Path backupFilesDir = Paths.get(sharedFileBackupDirectory);
        if (!Files.exists(backupFilesDir)) {
            Files.createDirectories(backupFilesDir);
        }

        // Load existing backup manifest if available
        Path backupManifestPath = backupFilesDir.resolve(MANIFEST_FILENAME);
        Map<String, String> existingChecksums = new HashMap<>();

        if (Files.exists(backupManifestPath)) {
            try {
                FileManifest existingManifest = objectMapper.readValue(
                    backupManifestPath.toFile(), FileManifest.class);
                for (FileManifestEntry entry : existingManifest.getFiles()) {
                    existingChecksums.put(entry.getRelativePath(), entry.getChecksum());
                }
            } catch (Exception e) {
                log.warn("Could not read existing backup manifest: {}", e.getMessage());
            }
        }

        Path uploadsPath = getUploadsPath();
        int synced = 0;
        int skipped = 0;

        for (FileManifestEntry entry : manifest.getFiles()) {
            String existingChecksum = existingChecksums.get(entry.getRelativePath());

            if (entry.getChecksum().equals(existingChecksum)) {
                skipped++;
                continue;
            }

            // File is new or changed - copy it
            Path sourcePath = uploadsPath.resolve(entry.getRelativePath());
            Path destPath = backupFilesDir.resolve(entry.getRelativePath());

            if (Files.exists(sourcePath)) {
                Files.createDirectories(destPath.getParent());
                Files.copy(sourcePath, destPath, StandardCopyOption.REPLACE_EXISTING);
                synced++;

                if (synced % 50 == 0) {
                    log.debug("Synced {} files to backup", synced);
                }
            }
        }

        // Save manifest to backup directory
        objectMapper.writeValue(backupManifestPath.toFile(), manifest);

        log.info("File backup sync complete: {} synced, {} unchanged", synced, skipped);
    }

    // ==================== FULL RESYNC ====================

    /**
     * Perform a full resync from the sync server or shared backup.
     * First tries the sync server, falls back to shared drive if unavailable.
     *
     * @param skipDeletionCheck If true, skip the deletion safety check (use with caution)
     * @return ResyncResult with details of the operation
     */
    /**
     * Start full resync asynchronously. Returns immediately so the HTTP response
     * can be sent before the database is shut down. After resync completes,
     * the JVM exits cleanly so the Electron wrapper can restart it.
     * Monitor progress via /api/resync/status.
     */
    @Async
    public void performFullResyncAsync(boolean skipDeletionCheck) {
        ResyncResult result = performFullResync(skipDeletionCheck);
        if (result.isSuccess()) {
            log.info("Full resync completed successfully. Shutting down JVM for restart...");
            try { Thread.sleep(2000); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
            System.exit(0);
        }
    }

    public ResyncResult performFullResync(boolean skipDeletionCheck) {
        if (!resyncInProgress.compareAndSet(false, true)) {
            return new ResyncResult(false, "Resync already in progress", null);
        }

        currentResyncStatus = new ResyncStatus();
        currentResyncStatus.setStartTime(Instant.now());
        currentResyncStatus.setPhase("Starting resync");

        try {
            // Try sync server first
            if (syncConfig.getSyncServerUrl() != null && !syncConfig.getSyncServerUrl().isEmpty()) {
                try {
                    ServerResyncHealth serverHealth = getServerHealth();
                    if (serverHealth != null && serverHealth.isHealthy()) {
                        log.info("Using sync server for full resync");
                        return performServerResync(skipDeletionCheck);
                    }
                } catch (Exception e) {
                    log.warn("Sync server not available, falling back to shared drive: {}", e.getMessage());
                }
            }

            // Fall back to shared drive
            return performSharedDriveResync(skipDeletionCheck);

        } catch (Exception e) {
            log.error("Resync failed: {}", e.getMessage(), e);
            currentResyncStatus.setPhase("Failed: " + e.getMessage());
            currentResyncStatus.setSuccess(false);
            return new ResyncResult(false, "Resync failed: " + e.getMessage(), null);
        } finally {
            resyncInProgress.set(false);
        }
    }

    /**
     * Perform full resync from the sync server.
     * Downloads the H2 backup ZIP and restores it directly.
     * Includes detailed progress tracking at each phase.
     */
    private ResyncResult performServerResync(boolean skipDeletionCheck) {
        try {
            // Phase 1: Download H2 backup from server (0-15%)
            currentResyncStatus.setCurrentPhase("db_download");
            currentResyncStatus.setPhase("Downloading database backup from server");
            currentResyncStatus.setProgressPercent(0);
            currentResyncStatus.setPhaseProgressPercent(0);
            log.info("Downloading H2 backup from sync server");

            String url = syncConfig.getSyncServerUrl() + "/api/resync/database/h2-backup";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

            byte[] backupData = response.getBody();
            if (backupData == null || backupData.length == 0) {
                return new ResyncResult(false, "Failed to download H2 backup from server", null);
            }

            currentResyncStatus.setProgressPercent(PHASE_DB_DOWNLOAD);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage(String.format("Downloaded %s database backup",
                formatBytes(backupData.length)));
            log.info("Downloaded H2 backup: {} bytes", backupData.length);

            // Phase 2: Restore from H2 backup (15-25%)
            currentResyncStatus.setCurrentPhase("db_restore");
            currentResyncStatus.setPhase("Restoring database from backup");
            currentResyncStatus.setProgressPercent(PHASE_DB_DOWNLOAD);
            currentResyncStatus.setPhaseProgressPercent(0);

            h2BackupService.restoreFromBytes(backupData);

            currentResyncStatus.setProgressPercent(PHASE_DB_DOWNLOAD + PHASE_DB_RESTORE);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage("Database restored successfully");

            // Phase 3: Compare and restore files (25-30%)
            currentResyncStatus.setCurrentPhase("file_compare");
            currentResyncStatus.setPhase("Comparing local files with server");
            currentResyncStatus.setProgressPercent(PHASE_DB_DOWNLOAD + PHASE_DB_RESTORE);
            currentResyncStatus.setPhaseProgressPercent(0);

            FileComparisonResult comparison = compareLocalWithServer();
            currentResyncStatus.setTotalFiles(comparison.getFilesToDownload().size());
            currentResyncStatus.setTotalFileBytes(calculateTotalBytes(comparison.getFilesToDownload()));

            currentResyncStatus.setProgressPercent(PHASE_DB_DOWNLOAD + PHASE_DB_RESTORE + PHASE_FILE_COMPARE);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage(String.format("Found %d files to download, %d to delete",
                comparison.getFilesToDownload().size(), comparison.getFilesToDelete().size()));

            // Phase 4: Safety check for deletions
            if (!skipDeletionCheck) {
                DeletionSafetyResult safetyResult = checkDeletionSafety(comparison);
                if (!safetyResult.isSafe()) {
                    currentResyncStatus.setPhase("Blocked by safety check");
                    return new ResyncResult(false, safetyResult.getMessage(), comparison);
                }
            }

            // Phase 5: Download files from server with progress (30-90%)
            currentResyncStatus.setCurrentPhase("file_download");
            int downloadBaseProgress = PHASE_DB_DOWNLOAD + PHASE_DB_RESTORE + PHASE_FILE_COMPARE;
            downloadFilesFromServerWithProgress(comparison, downloadBaseProgress, PHASE_FILE_DOWNLOAD);

            // Phase 6: Delete extra local files with progress (90-100%)
            currentResyncStatus.setCurrentPhase("file_delete");
            int deleteBaseProgress = downloadBaseProgress + PHASE_FILE_DOWNLOAD;
            int deleted = deleteExtraFilesWithProgress(comparison, deleteBaseProgress, PHASE_FILE_DELETE);
            currentResyncStatus.setFilesDeleted(deleted);

            currentResyncStatus.setProgressPercent(100);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setPhase("Complete - Restart Required");
            currentResyncStatus.setEndTime(Instant.now());
            currentResyncStatus.setSuccess(true);
            currentResyncStatus.setRestartRequired(true);
            currentResyncStatus.setStatusMessage(String.format("Resync complete: %d downloaded, %d deleted",
                currentResyncStatus.getFilesDownloaded(), deleted));

            log.info("Server resync complete: {} downloaded, {} deleted, {} unchanged",
                comparison.getFilesToDownload().size(),
                comparison.getFilesToDelete().size(),
                comparison.getUnchangedFiles().size());

            return new ResyncResult(true,
                "Resync completed successfully. Application will restart.", comparison);

        } catch (Exception e) {
            log.error("Server resync failed: {}", e.getMessage(), e);
            currentResyncStatus.setPhase("Failed: " + e.getMessage());
            currentResyncStatus.setSuccess(false);
            return new ResyncResult(false, "Server resync failed: " + e.getMessage(), null);
        }
    }

    /**
     * Schedule an external restart using platform-specific script.
     * The script runs independently and will restart the application.
     */
    private void scheduleExternalRestart() {
        Thread restartThread = new Thread(() -> {
            try {
                // Give time for the response to be sent
                Thread.sleep(2000);

                log.info("Executing restart script...");

                String os = System.getProperty("os.name").toLowerCase();
                ProcessBuilder pb;

                // Determine project root directory
                String projectRoot = projectRootPath;
                if (projectRoot == null || projectRoot.isEmpty()) {
                    projectRoot = System.getProperty("user.dir");
                }

                if (os.contains("win")) {
                    // Windows
                    Path scriptPath = Paths.get(projectRoot, "restart-app.bat");
                    if (Files.exists(scriptPath)) {
                        pb = new ProcessBuilder("cmd", "/c", "start", "/b", scriptPath.toString());
                    } else {
                        log.warn("Restart script not found: {}. Manual restart required.", scriptPath);
                        return;
                    }
                } else {
                    // Linux/Mac
                    Path scriptPath = Paths.get(projectRoot, "restart-app.sh");
                    if (Files.exists(scriptPath)) {
                        pb = new ProcessBuilder("/bin/bash", scriptPath.toString());
                    } else {
                        log.warn("Restart script not found: {}. Manual restart required.", scriptPath);
                        return;
                    }
                }

                pb.inheritIO();
                pb.start();

                log.info("Restart script launched, application will restart shortly...");

            } catch (Exception e) {
                log.error("Failed to execute restart script: {}. Manual restart required.", e.getMessage());
            }
        }, "restart-scheduler");
        restartThread.setDaemon(true); // Daemon so it doesn't block shutdown
        restartThread.start();
    }

    /**
     * Restore entities from server export.
     * This clears existing data and imports from server.
     */
    @SuppressWarnings("unchecked")
    private void restoreEntitiesFromServerExport(Map<String, Object> dbExport) {
        log.info("Restoring entities from server export");

        // The restore is done by directly inserting into the H2 database tables
        // We use native queries to match the mirror table structure

        try {
            // Restore categories
            List<Map<String, Object>> categories = (List<Map<String, Object>>) dbExport.get("categories");
            if (categories != null) {
                restoreEntityTable("category", categories);
            }

            // Restore values
            List<Map<String, Object>> values = (List<Map<String, Object>>) dbExport.get("values");
            if (values != null) {
                restoreEntityTable("value", values);
            }

            // Restore file objects
            List<Map<String, Object>> fileObjects = (List<Map<String, Object>>) dbExport.get("fileObjects");
            if (fileObjects != null) {
                restoreEntityTable("file_object", fileObjects);
            }

            // Restore equipment
            List<Map<String, Object>> equipment = (List<Map<String, Object>>) dbExport.get("equipment");
            if (equipment != null) {
                restoreEntityTable("equipment", equipment);
            }

            // Restore loto points
            List<Map<String, Object>> lotoPoints = (List<Map<String, Object>>) dbExport.get("lotoPoints");
            if (lotoPoints != null) {
                restoreEntityTable("loto_point", lotoPoints);
            }

            // Restore join tables
            List<Map<String, Object>> eqLotoPoints = (List<Map<String, Object>>) dbExport.get("equipmentLotoPoints");
            if (eqLotoPoints != null) {
                restoreJoinTable("eq_loto_point", "eq_id", "loto_point_id", eqLotoPoints);
            }

            List<Map<String, Object>> filePoints = (List<Map<String, Object>>) dbExport.get("filePoints");
            if (filePoints != null) {
                restoreJoinTable("file_point", "point_id", "file_id", filePoints);
            }

            log.info("Entity restore complete");
        } catch (Exception e) {
            log.error("Error restoring entities: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to restore entities: " + e.getMessage(), e);
        }
    }

    /**
     * Restore an entity table from server export data.
     * Uses native SQL to directly insert/update rows.
     */
    @Transactional
    private void restoreEntityTable(String tableName, List<Map<String, Object>> entities) {
        if (entities == null || entities.isEmpty()) {
            log.info("No entities to restore for table {}", tableName);
            return;
        }

        log.info("Restoring {} records to table {}", entities.size(), tableName);

        // Get column names from first entity
        Set<String> columns = entities.get(0).keySet();

        // Build column list (convert camelCase to snake_case for DB)
        List<String> dbColumns = columns.stream()
            .map(this::camelToSnakeCase)
            .toList();

        String columnList = String.join(", ", dbColumns);
        String placeholders = String.join(", ", Collections.nCopies(dbColumns.size(), "?"));

        // Clear existing data
        jdbcTemplate.execute("DELETE FROM " + tableName);

        // Insert each entity
        String insertSql = String.format("INSERT INTO %s (%s) VALUES (%s)", tableName, columnList, placeholders);

        int restored = 0;
        for (Map<String, Object> entity : entities) {
            try {
                Object[] values = columns.stream()
                    .map(col -> convertValue(entity.get(col)))
                    .toArray();

                jdbcTemplate.update(insertSql, values);
                restored++;

                if (restored % 100 == 0) {
                    log.debug("Restored {} records to {}", restored, tableName);
                }
            } catch (Exception e) {
                log.warn("Failed to restore entity to {}: {}", tableName, e.getMessage());
            }
        }

        log.info("Restored {} of {} records to table {}", restored, entities.size(), tableName);
    }

    /**
     * Restore a ManyToMany join table from server export data.
     * This is critical for restoring relationships like Equipment <-> LotoPoint.
     */
    @Transactional
    private void restoreJoinTable(String tableName, String col1, String col2, List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            log.info("No rows to restore for join table {}", tableName);
            return;
        }

        log.info("Restoring {} rows to join table {}", rows.size(), tableName);

        // Clear existing data
        jdbcTemplate.execute("DELETE FROM " + tableName);

        // Insert each row
        String insertSql = String.format("INSERT INTO %s (%s, %s) VALUES (?, ?)", tableName, col1, col2);

        int restored = 0;
        for (Map<String, Object> row : rows) {
            try {
                // Keys in the server export may be camelCase
                Long val1 = extractLongValue(row, col1, "equipmentId", "pointId", "eqId");
                Long val2 = extractLongValue(row, col2, "lotoPointId", "fileId");

                if (val1 != null && val2 != null) {
                    jdbcTemplate.update(insertSql, val1, val2);
                    restored++;
                }
            } catch (Exception e) {
                log.warn("Failed to restore row to {}: {}", tableName, e.getMessage());
            }
        }

        log.info("Restored {} of {} rows to join table {}", restored, rows.size(), tableName);
    }

    /**
     * Extract a Long value from a map, trying multiple possible key names.
     */
    private Long extractLongValue(Map<String, Object> map, String... possibleKeys) {
        for (String key : possibleKeys) {
            Object value = map.get(key);
            if (value != null) {
                if (value instanceof Number) {
                    return ((Number) value).longValue();
                }
                try {
                    return Long.parseLong(value.toString());
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    /**
     * Convert camelCase to snake_case for database column names.
     */
    private String camelToSnakeCase(String camelCase) {
        if (camelCase == null) return null;
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * Convert a value for SQL insertion.
     */
    private Object convertValue(Object value) {
        if (value == null) return null;

        // Handle timestamps that come as strings
        if (value instanceof String str) {
            if (str.contains("T") && (str.contains("Z") || str.contains("+"))) {
                // Looks like ISO timestamp
                try {
                    return Instant.parse(str);
                } catch (Exception ignored) {}
            }
        }

        // Handle nested objects (just return null for now - these are relationship IDs)
        if (value instanceof Map) {
            return null;
        }

        return value;
    }

    /**
     * Download files from sync server.
     * Uses permanent storage endpoint if permanentPath is available, otherwise falls back to serverId.
     */
    private void downloadFilesFromServer(FileComparisonResult comparison) throws IOException {
        Path uploadsPath = getUploadsPath();
        int downloaded = 0;

        for (FileManifestEntry entry : comparison.getFilesToDownload()) {
            try {
                String url;
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Machine-Id", syncConfig.getMachineId());
                headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

                // Prefer permanent storage endpoint if available
                if (entry.getPermanentPath() != null && !entry.getPermanentPath().isEmpty()) {
                    // URL encode the path to handle spaces and special characters
                    String encodedPath = java.net.URLEncoder.encode(entry.getPermanentPath(), "UTF-8")
                        .replace("+", "%20")  // URLEncoder uses + for spaces, we want %20
                        .replace("%2F", "/"); // Keep forward slashes unencoded
                    url = syncConfig.getSyncServerUrl() + "/api/resync/files/permanent/" + encodedPath;
                } else if (entry.getServerId() != null) {
                    // Fall back to hash-based storage (legacy)
                    url = syncConfig.getSyncServerUrl() + "/api/resync/files/" + entry.getServerId();
                } else {
                    log.warn("No download path for file: {}", entry.getRelativePath());
                    continue;
                }

                ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

                byte[] fileContent = response.getBody();
                if (fileContent != null) {
                    Path destPath = uploadsPath.resolve(entry.getRelativePath());
                    Files.createDirectories(destPath.getParent());
                    Files.write(destPath, fileContent);
                    downloaded++;

                    currentResyncStatus.setProcessedFiles(downloaded);
                    if (downloaded % 50 == 0) {
                        log.debug("Downloaded {} files from server", downloaded);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to download file {}: {}", entry.getRelativePath(), e.getMessage());
            }
        }

        log.info("Downloaded {} files from server", downloaded);
    }

    /**
     * Delete extra local files not on server.
     */
    private void deleteExtraFiles(FileComparisonResult comparison) {
        Path uploadsPath = getUploadsPath();
        int deleted = 0;

        for (String relativePath : comparison.getFilesToDelete()) {
            Path filePath = uploadsPath.resolve(relativePath);
            try {
                Files.deleteIfExists(filePath);
                deleted++;

                // Try to delete empty parent directories
                deleteEmptyParentDirectories(filePath.getParent(), uploadsPath);
            } catch (Exception e) {
                log.warn("Failed to delete {}: {}", filePath, e.getMessage());
            }
        }

        log.info("Deleted {} extra local files", deleted);
    }

    /**
     * Download files from sync server with detailed progress tracking.
     * Updates progress from baseProgress to baseProgress + phaseWeight.
     */
    private void downloadFilesFromServerWithProgress(FileComparisonResult comparison,
                                                      int baseProgress, int phaseWeight) throws IOException {
        Path uploadsPath = getUploadsPath();
        List<FileManifestEntry> toDownload = comparison.getFilesToDownload();
        int total = toDownload.size();

        if (total == 0) {
            currentResyncStatus.setProgressPercent(baseProgress + phaseWeight);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage("No files to download");
            return;
        }

        long totalBytes = currentResyncStatus.getTotalFileBytes();
        long downloadedBytes = 0;
        int downloaded = 0;
        int errors = 0;

        for (int i = 0; i < total; i++) {
            FileManifestEntry entry = toDownload.get(i);

            try {
                // Update phase text with current file
                currentResyncStatus.setPhase(String.format("Downloading files: %d / %d (%s)",
                    i + 1, total, entry.getRelativePath()));

                String url;
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Machine-Id", syncConfig.getMachineId());
                headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

                // Prefer permanent storage endpoint if available
                if (entry.getPermanentPath() != null && !entry.getPermanentPath().isEmpty()) {
                    String encodedPath = java.net.URLEncoder.encode(entry.getPermanentPath(), "UTF-8")
                        .replace("+", "%20")
                        .replace("%2F", "/");
                    url = syncConfig.getSyncServerUrl() + "/api/resync/files/permanent/" + encodedPath;
                } else if (entry.getServerId() != null) {
                    url = syncConfig.getSyncServerUrl() + "/api/resync/files/" + entry.getServerId();
                } else {
                    log.warn("No download path for file: {}", entry.getRelativePath());
                    errors++;
                    continue;
                }

                ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

                byte[] fileContent = response.getBody();
                if (fileContent != null) {
                    Path destPath = uploadsPath.resolve(entry.getRelativePath());
                    Files.createDirectories(destPath.getParent());
                    Files.write(destPath, fileContent);

                    downloadedBytes += fileContent.length;
                    downloaded++;
                } else {
                    errors++;
                }

            } catch (Exception e) {
                log.warn("Failed to download {}: {}", entry.getRelativePath(), e.getMessage());
                errors++;
            }

            // Update progress tracking
            currentResyncStatus.setProcessedFiles(i + 1);
            currentResyncStatus.setFilesDownloaded(downloaded);
            currentResyncStatus.setDownloadedBytes(downloadedBytes);
            currentResyncStatus.setDownloadErrors(errors);

            // Calculate progress: baseProgress + (filesCompleted / totalFiles) * phaseWeight
            int phaseProgress = total > 0 ? (int) ((i + 1) * phaseWeight / (double) total) : 0;
            currentResyncStatus.setProgressPercent(baseProgress + phaseProgress);
            currentResyncStatus.setPhaseProgressPercent((i + 1) * 100 / total);

            // Update status message with byte progress
            if (totalBytes > 0) {
                currentResyncStatus.setStatusMessage(String.format(
                    "%s / %s downloaded (%d files)",
                    formatBytes(downloadedBytes), formatBytes(totalBytes), downloaded));
            }

            if (downloaded % 50 == 0 && downloaded > 0) {
                log.debug("Downloaded {} files from server, {} errors", downloaded, errors);
            }
        }

        log.info("Downloaded {} files from server ({} errors)", downloaded, errors);
    }

    /**
     * Delete extra files with detailed progress tracking.
     * Updates progress from baseProgress to baseProgress + phaseWeight.
     * Returns the number of files deleted.
     */
    private int deleteExtraFilesWithProgress(FileComparisonResult comparison,
                                              int baseProgress, int phaseWeight) {
        Path uploadsPath = getUploadsPath();
        List<String> toDelete = comparison.getFilesToDelete();
        int total = toDelete.size();

        if (total == 0) {
            currentResyncStatus.setProgressPercent(baseProgress + phaseWeight);
            currentResyncStatus.setPhaseProgressPercent(100);
            return 0;
        }

        int deleted = 0;

        for (int i = 0; i < total; i++) {
            String relativePath = toDelete.get(i);
            Path filePath = uploadsPath.resolve(relativePath);

            try {
                if (Files.deleteIfExists(filePath)) {
                    deleted++;
                    deleteEmptyParentDirectories(filePath.getParent(), uploadsPath);
                }
            } catch (Exception e) {
                log.warn("Failed to delete {}: {}", relativePath, e.getMessage());
            }

            // Update progress
            int phaseProgress = total > 0 ? (int) ((i + 1) * phaseWeight / (double) total) : 0;
            currentResyncStatus.setProgressPercent(baseProgress + phaseProgress);
            currentResyncStatus.setPhaseProgressPercent((i + 1) * 100 / total);
            currentResyncStatus.setPhase(String.format("Deleting extra files: %d / %d", i + 1, total));
        }

        log.info("Deleted {} extra local files", deleted);
        return deleted;
    }

    /**
     * Perform full resync from the shared backup (original method).
     */
    private ResyncResult performSharedDriveResync(boolean skipDeletionCheck) {
        try {
            // Validate shared directory
            if (sharedBackupDirectory == null || sharedBackupDirectory.isEmpty()) {
                return new ResyncResult(false, "Shared backup directory not configured", null);
            }

            Path sharedDir = Paths.get(sharedBackupDirectory);
            if (!Files.exists(sharedDir)) {
                return new ResyncResult(false, "Shared backup directory not accessible", null);
            }

            // Load backup metadata
            currentResyncStatus.setPhase("Loading backup metadata");
            Path metadataPath = sharedDir.resolve(BACKUP_METADATA_FILENAME);
            if (!Files.exists(metadataPath)) {
                return new ResyncResult(false, "No backup metadata found in shared directory", null);
            }

            BackupMetadata metadata = objectMapper.readValue(metadataPath.toFile(), BackupMetadata.class);
            log.info("Found backup from {} (machine: {})", metadata.getTimestamp(), metadata.getMachineName());

            // Phase 1: Restore database
            currentResyncStatus.setPhase("Restoring database");
            log.info("Restoring database from: {}", metadata.getDatabaseBackupFile());
            h2BackupService.restoreSharedDatabase(metadata.getDatabaseBackupFile());

            // Phase 2: Compare and restore files
            currentResyncStatus.setPhase("Comparing files");
            FileComparisonResult comparison = compareLocalWithBackup();
            currentResyncStatus.setTotalFiles(comparison.getTotalBackupFiles());

            // Phase 3: Safety check for deletions
            if (!skipDeletionCheck) {
                DeletionSafetyResult safetyResult = checkDeletionSafety(comparison);
                if (!safetyResult.isSafe()) {
                    currentResyncStatus.setPhase("Blocked by safety check");
                    return new ResyncResult(false, safetyResult.getMessage(), comparison);
                }
            }

            // Phase 4: Apply file changes
            currentResyncStatus.setPhase("Applying file changes");
            applyFileChanges(comparison);

            currentResyncStatus.setPhase("Complete - Restart Required");
            currentResyncStatus.setEndTime(Instant.now());
            currentResyncStatus.setSuccess(true);
            currentResyncStatus.setRestartRequired(true);

            log.info("Full resync complete: {} downloaded, {} deleted, {} unchanged",
                comparison.getFilesToDownload().size(),
                comparison.getFilesToDelete().size(),
                comparison.getUnchangedFiles().size());

            return new ResyncResult(true,
                "Resync completed successfully. Application will restart.", comparison);

        } catch (Exception e) {
            log.error("Resync failed: {}", e.getMessage(), e);
            currentResyncStatus.setPhase("Failed: " + e.getMessage());
            currentResyncStatus.setSuccess(false);
            return new ResyncResult(false, "Resync failed: " + e.getMessage(), null);
        }
    }

    /**
     * Compare local files with backup manifest.
     */
    private FileComparisonResult compareLocalWithBackup() throws IOException {
        FileComparisonResult result = new FileComparisonResult();

        // Load backup manifest
        Path backupManifestPath;
        if (sharedFileBackupDirectory != null && !sharedFileBackupDirectory.isEmpty()) {
            backupManifestPath = Paths.get(sharedFileBackupDirectory).resolve(MANIFEST_FILENAME);
        } else {
            backupManifestPath = Paths.get(sharedBackupDirectory).resolve(MANIFEST_FILENAME);
        }

        if (!Files.exists(backupManifestPath)) {
            log.warn("No file manifest found at {}", backupManifestPath);
            return result;
        }

        FileManifest backupManifest = objectMapper.readValue(backupManifestPath.toFile(), FileManifest.class);
        result.setTotalBackupFiles(backupManifest.getFiles().size());

        // Build map of backup files
        Map<String, FileManifestEntry> backupFiles = backupManifest.getFiles().stream()
            .collect(Collectors.toMap(FileManifestEntry::getRelativePath, e -> e));

        // Scan local files
        Path uploadsPath = getUploadsPath();
        Set<String> localFiles = new HashSet<>();

        if (Files.exists(uploadsPath)) {
            try (Stream<Path> walk = Files.walk(uploadsPath)) {
                walk.filter(Files::isRegularFile)
                    .forEach(file -> {
                        String relativePath = uploadsPath.relativize(file).toString().replace('\\', '/');
                        localFiles.add(relativePath);
                    });
            }
        }

        result.setTotalLocalFiles(localFiles.size());

        // Compare
        for (Map.Entry<String, FileManifestEntry> entry : backupFiles.entrySet()) {
            String relativePath = entry.getKey();
            FileManifestEntry backupEntry = entry.getValue();

            if (!localFiles.contains(relativePath)) {
                // File missing locally - need to download
                result.getFilesToDownload().add(backupEntry);
            } else {
                // File exists - check checksum
                Path localFile = uploadsPath.resolve(relativePath);
                try {
                    String localChecksum = computeChecksum(localFile);
                    if (!localChecksum.equals(backupEntry.getChecksum())) {
                        // File differs - need to download
                        result.getFilesToDownload().add(backupEntry);
                    } else {
                        result.getUnchangedFiles().add(relativePath);
                    }
                } catch (Exception e) {
                    // Error reading file - download it
                    result.getFilesToDownload().add(backupEntry);
                }
            }
        }

        // Find files to delete (local files not in backup)
        for (String localFile : localFiles) {
            if (!backupFiles.containsKey(localFile)) {
                result.getFilesToDelete().add(localFile);
            }
        }

        log.info("File comparison: {} to download, {} to delete, {} unchanged",
            result.getFilesToDownload().size(),
            result.getFilesToDelete().size(),
            result.getUnchangedFiles().size());

        return result;
    }

    /**
     * Check if the proposed deletions are safe.
     */
    private DeletionSafetyResult checkDeletionSafety(FileComparisonResult comparison) {
        int deleteCount = comparison.getFilesToDelete().size();
        int totalLocalFiles = comparison.getTotalLocalFiles();

        // Check absolute count
        if (deleteCount > MAX_DELETE_COUNT) {
            return new DeletionSafetyResult(false, String.format(
                "Safety check failed: %d files would be deleted (max allowed: %d). " +
                "Use force option to override.", deleteCount, MAX_DELETE_COUNT));
        }

        // Check percentage (only if we have enough files)
        if (totalLocalFiles >= MIN_FILES_FOR_PERCENTAGE_CHECK) {
            double deletePercentage = (double) deleteCount / totalLocalFiles;
            if (deletePercentage > MAX_DELETE_PERCENTAGE) {
                return new DeletionSafetyResult(false, String.format(
                    "Safety check failed: %.1f%% of files would be deleted (max allowed: %.1f%%). " +
                    "Use force option to override.",
                    deletePercentage * 100, MAX_DELETE_PERCENTAGE * 100));
            }
        }

        return new DeletionSafetyResult(true, "Deletion check passed");
    }

    /**
     * Apply file changes (download missing files, delete extra files).
     */
    private void applyFileChanges(FileComparisonResult comparison) throws IOException {
        Path uploadsPath = getUploadsPath();
        Path backupFilesDir = Paths.get(
            sharedFileBackupDirectory != null && !sharedFileBackupDirectory.isEmpty()
                ? sharedFileBackupDirectory : sharedBackupDirectory);

        int downloaded = 0;
        int deleted = 0;

        // Download missing/changed files
        for (FileManifestEntry entry : comparison.getFilesToDownload()) {
            Path sourcePath = backupFilesDir.resolve(entry.getRelativePath());
            Path destPath = uploadsPath.resolve(entry.getRelativePath());

            if (Files.exists(sourcePath)) {
                Files.createDirectories(destPath.getParent());
                Files.copy(sourcePath, destPath, StandardCopyOption.REPLACE_EXISTING);
                downloaded++;

                currentResyncStatus.setProcessedFiles(downloaded + deleted);
                if (downloaded % 50 == 0) {
                    log.debug("Downloaded {} files", downloaded);
                }
            } else {
                log.warn("Backup file not found: {}", sourcePath);
            }
        }

        // Delete extra files
        for (String relativePath : comparison.getFilesToDelete()) {
            Path filePath = uploadsPath.resolve(relativePath);
            try {
                Files.deleteIfExists(filePath);
                deleted++;

                // Try to delete empty parent directories
                deleteEmptyParentDirectories(filePath.getParent(), uploadsPath);
            } catch (Exception e) {
                log.warn("Failed to delete {}: {}", filePath, e.getMessage());
            }
        }

        log.info("Applied file changes: {} downloaded, {} deleted", downloaded, deleted);
    }

    /**
     * Delete empty parent directories up to the root.
     */
    private void deleteEmptyParentDirectories(Path dir, Path root) {
        while (dir != null && !dir.equals(root) && dir.startsWith(root)) {
            try {
                if (Files.isDirectory(dir) && isDirectoryEmpty(dir)) {
                    Files.delete(dir);
                    dir = dir.getParent();
                } else {
                    break;
                }
            } catch (Exception e) {
                break;
            }
        }
    }

    private boolean isDirectoryEmpty(Path dir) throws IOException {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            return !stream.iterator().hasNext();
        }
    }

    // ==================== HEALTH CHECK ====================

    /**
     * Get current sync health status.
     * First tries the sync server, falls back to shared drive if unavailable.
     */
    public SyncHealthStatus getSyncHealth() {
        SyncHealthStatus status = new SyncHealthStatus();
        status.setMachineId(syncConfig.getMachineId());
        status.setMachineName(syncConfig.getMachineName());
        status.setTimestamp(Instant.now());

        try {
            // Try sync server first
            if (syncConfig.getSyncServerUrl() != null && !syncConfig.getSyncServerUrl().isEmpty()) {
                try {
                    ServerResyncHealth serverHealth = getServerHealth();
                    if (serverHealth != null && serverHealth.isHealthy()) {
                        status.setBackupAvailable(true);
                        status.setBackupTimestamp(serverHealth.getLastUpdated());
                        status.setBackupMachineId("SYNC_SERVER");
                        status.setBackupFileCount((int) serverHealth.getTotalSyncedFiles());
                        status.setServerEntityCount(serverHealth.getTotalEntities());
                    }
                } catch (Exception e) {
                    log.warn("Sync server health check failed, falling back to shared drive: {}", e.getMessage());
                }
            }

            // Fall back to shared drive if server not available
            if (!status.isBackupAvailable() && sharedBackupDirectory != null && !sharedBackupDirectory.isEmpty()) {
                Path metadataPath = Paths.get(sharedBackupDirectory).resolve(BACKUP_METADATA_FILENAME);
                if (Files.exists(metadataPath)) {
                    BackupMetadata metadata = objectMapper.readValue(metadataPath.toFile(), BackupMetadata.class);
                    status.setBackupAvailable(true);
                    status.setBackupTimestamp(metadata.getTimestamp());
                    status.setBackupMachineId(metadata.getMachineId());
                    status.setBackupFileCount(metadata.getFileCount());
                }
            }

            // Count local files
            Path uploadsPath = getUploadsPath();
            if (Files.exists(uploadsPath)) {
                try (Stream<Path> walk = Files.walk(uploadsPath)) {
                    status.setLocalFileCount((int) walk.filter(Files::isRegularFile).count());
                }
            }

            // Check for potential mismatch
            if (status.isBackupAvailable() && status.getLocalFileCount() > 0) {
                int diff = Math.abs(status.getLocalFileCount() - status.getBackupFileCount());
                double diffPercentage = (double) diff / Math.max(status.getLocalFileCount(), status.getBackupFileCount());
                status.setPotentialMismatch(diffPercentage > 0.1); // > 10% difference
                status.setFileDifference(diff);
            }

        } catch (Exception e) {
            log.error("Error checking sync health: {}", e.getMessage());
            status.setErrorMessage(e.getMessage());
        }

        return status;
    }

    /**
     * Get health status from sync server.
     */
    private ServerResyncHealth getServerHealth() {
        String url = syncConfig.getSyncServerUrl() + "/api/resync/health";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        ResponseEntity<ServerResyncHealth> response = restTemplate.exchange(
            url, HttpMethod.GET, new HttpEntity<>(headers), ServerResyncHealth.class);

        return response.getBody();
    }

    /**
     * Get preview of what would happen in a resync (without making changes).
     * First tries the sync server, falls back to shared drive if unavailable.
     */
    public FileComparisonResult previewResync() {
        try {
            // Try sync server first
            if (syncConfig.getSyncServerUrl() != null && !syncConfig.getSyncServerUrl().isEmpty()) {
                try {
                    return compareLocalWithServer();
                } catch (Exception e) {
                    log.warn("Server preview failed, falling back to shared drive: {}", e.getMessage());
                }
            }
            return compareLocalWithBackup();
        } catch (Exception e) {
            log.error("Error previewing resync: {}", e.getMessage());
            FileComparisonResult result = new FileComparisonResult();
            result.setErrorMessage(e.getMessage());
            return result;
        }
    }

    /**
     * Compare local files with sync server's path-based file manifest.
     * Uses the permanent storage manifest for accurate path matching.
     */
    private FileComparisonResult compareLocalWithServer() {
        FileComparisonResult result = new FileComparisonResult();

        // Use new path-based manifest endpoint from permanent storage
        String url = syncConfig.getSyncServerUrl() + "/api/resync/files/path-manifest";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        ResponseEntity<List<PathBasedManifestEntry>> response = restTemplate.exchange(
            url, HttpMethod.GET, new HttpEntity<>(headers),
            new ParameterizedTypeReference<List<PathBasedManifestEntry>>() {});

        List<PathBasedManifestEntry> serverFiles = response.getBody();
        if (serverFiles == null) {
            serverFiles = new ArrayList<>();
        }

        result.setTotalBackupFiles(serverFiles.size());

        // Build map of server files by relative path (already normalized in path-based manifest)
        Map<String, PathBasedManifestEntry> serverFileMap = new HashMap<>();
        for (PathBasedManifestEntry entry : serverFiles) {
            if (entry.getRelativePath() != null) {
                // Path from permanent storage is already normalized (e.g., "uploads/pdf/P&ID/ABB/P123.pdf")
                // We need to extract just the part after uploads dir for local comparison
                String serverPath = entry.getRelativePath().replace('\\', '/');
                String localPath = stripUploadsPrefix(serverPath);
                serverFileMap.put(localPath.toLowerCase(), entry);
            }
        }

        // Scan local files
        Path uploadsPath = getUploadsPath();
        Set<String> localFiles = new HashSet<>();
        Map<String, String> localFileOriginalCase = new HashMap<>(); // Track original case

        if (Files.exists(uploadsPath)) {
            try (Stream<Path> walk = Files.walk(uploadsPath)) {
                walk.filter(Files::isRegularFile)
                    .forEach(file -> {
                        String relativePath = uploadsPath.relativize(file).toString().replace('\\', '/');
                        String lowerPath = relativePath.toLowerCase();
                        localFiles.add(lowerPath);
                        localFileOriginalCase.put(lowerPath, relativePath);
                    });
            } catch (IOException e) {
                log.error("Error scanning local files: {}", e.getMessage());
            }
        }

        result.setTotalLocalFiles(localFiles.size());

        // Compare - files on server but not local (need to download)
        for (Map.Entry<String, PathBasedManifestEntry> entry : serverFileMap.entrySet()) {
            String normalizedPath = entry.getKey();
            PathBasedManifestEntry serverEntry = entry.getValue();

            if (!localFiles.contains(normalizedPath)) {
                // File missing locally
                FileManifestEntry downloadEntry = new FileManifestEntry();
                // Extract local relative path from server path (strip uploads dir prefix)
                String relativePath = stripUploadsPrefix(serverEntry.getRelativePath());
                downloadEntry.setRelativePath(relativePath);
                downloadEntry.setChecksum(serverEntry.getFileHash());
                downloadEntry.setSize(serverEntry.getFileSize() != null ? serverEntry.getFileSize() : 0);
                downloadEntry.setPermanentPath(serverEntry.getRelativePath()); // Full path for download
                result.getFilesToDownload().add(downloadEntry);
            } else {
                // File exists - check checksum
                String originalCasePath = localFileOriginalCase.get(normalizedPath);
                Path localFile = uploadsPath.resolve(originalCasePath);
                try {
                    String localChecksum = computeChecksum(localFile);
                    if (!localChecksum.equalsIgnoreCase(serverEntry.getFileHash())) {
                        FileManifestEntry downloadEntry = new FileManifestEntry();
                        String relativePath = stripUploadsPrefix(serverEntry.getRelativePath());
                        downloadEntry.setRelativePath(relativePath);
                        downloadEntry.setChecksum(serverEntry.getFileHash());
                        downloadEntry.setSize(serverEntry.getFileSize() != null ? serverEntry.getFileSize() : 0);
                        downloadEntry.setPermanentPath(serverEntry.getRelativePath());
                        result.getFilesToDownload().add(downloadEntry);
                    } else {
                        result.getUnchangedFiles().add(originalCasePath);
                    }
                } catch (Exception e) {
                    // Error reading file - need to download
                    FileManifestEntry downloadEntry = new FileManifestEntry();
                    String relativePath = stripUploadsPrefix(serverEntry.getRelativePath());
                    downloadEntry.setRelativePath(relativePath);
                    downloadEntry.setChecksum(serverEntry.getFileHash());
                    downloadEntry.setSize(serverEntry.getFileSize() != null ? serverEntry.getFileSize() : 0);
                    downloadEntry.setPermanentPath(serverEntry.getRelativePath());
                    result.getFilesToDownload().add(downloadEntry);
                }
            }
        }

        // Find files to delete (local files not on server)
        // Apply safety check: don't delete if an active FileObject owns the file
        for (String localFileLower : localFiles) {
            if (!serverFileMap.containsKey(localFileLower)) {
                String originalCasePath = localFileOriginalCase.get(localFileLower);
                // Safety check: verify no active FileObject owns this file
                if (!hasActiveFileObject(originalCasePath)) {
                    result.getFilesToDelete().add(originalCasePath);
                } else {
                    log.debug("Skipping deletion of {} - active FileObject exists", originalCasePath);
                }
            }
        }

        log.info("Server file comparison: {} to download, {} to delete, {} unchanged",
            result.getFilesToDownload().size(),
            result.getFilesToDelete().size(),
            result.getUnchangedFiles().size());

        return result;
    }

    /**
     * Check if a file path belongs to an active (non-deleted) FileObject.
     * This is a safety guard before deleting files during resync.
     *
     * @param relativePath The relative path like "pdf/P&ID/ABB/P123.pdf"
     * @return true if an active FileObject owns this file
     */
    private boolean hasActiveFileObject(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return false;
        }

        try {
            // Extract fileNumber from path
            Path path = Paths.get(relativePath);
            String fileName = path.getFileName().toString();
            int lastDot = fileName.lastIndexOf('.');
            String fileNumber = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;

            // Remove revision suffix if present (e.g., "P123-rev1" -> "P123")
            fileNumber = fileNumber.replaceAll("-rev\\d+$", "");

            // Check if there's a non-deleted FileObject with this fileNumber
            FileObject fo = fileRepo.findFirstByFileNumberOrderByIdAsc(fileNumber);
            if (fo != null && !Boolean.TRUE.equals(fo.getDeleted())) {
                // Verify the path actually matches by checking the file's expected location
                String foPath = fo.getFileLink();
                if (foPath != null && relativePath.toLowerCase().contains(fileNumber.toLowerCase())) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("Error checking for active FileObject for {}: {}", relativePath, e.getMessage());
        }

        return false;
    }

    // ==================== FILES-ONLY SYNC ====================

    // Phase weights for files-only sync (total = 100%)
    private static final int FILES_ONLY_PHASE_COMPARE = 10;    // 0-10%
    private static final int FILES_ONLY_PHASE_DOWNLOAD = 80;   // 10-90%
    private static final int FILES_ONLY_PHASE_DELETE = 10;     // 90-100%

    /**
     * Perform a files-only sync from the sync server.
     * This compares local files with the server manifest and downloads/deletes as needed.
     * Does NOT touch the database - only syncs files.
     *
     * Includes retry logic for failed downloads and detailed progress tracking.
     *
     * @param skipDeletionCheck If true, skip the deletion safety check
     * @param maxRetries Maximum number of retries for failed downloads (default 3)
     * @return FileSyncResult with detailed information about the operation
     */
    public FileSyncResult syncFilesOnly(boolean skipDeletionCheck, int maxRetries) {
        if (!resyncInProgress.compareAndSet(false, true)) {
            return new FileSyncResult(false, "Sync already in progress", null);
        }

        currentResyncStatus = new ResyncStatus();
        currentResyncStatus.setStartTime(Instant.now());
        currentResyncStatus.setPhase("Starting files-only sync");
        currentResyncStatus.setProgressPercent(0);

        try {
            if (syncConfig.getSyncServerUrl() == null || syncConfig.getSyncServerUrl().isEmpty()) {
                return new FileSyncResult(false, "Sync server URL not configured", null);
            }

            // Phase 1: Compare files with server (0-10%)
            currentResyncStatus.setCurrentPhase("file_compare");
            currentResyncStatus.setPhase("Comparing files with server");
            currentResyncStatus.setProgressPercent(0);
            currentResyncStatus.setPhaseProgressPercent(0);
            log.info("Starting files-only sync - comparing with server");

            FileComparisonResult comparison = compareLocalWithServer();
            currentResyncStatus.setTotalFiles(comparison.getFilesToDownload().size());
            currentResyncStatus.setTotalFileBytes(calculateTotalBytes(comparison.getFilesToDownload()));

            currentResyncStatus.setProgressPercent(FILES_ONLY_PHASE_COMPARE);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage(String.format("Found %d files to download, %d to delete",
                comparison.getFilesToDownload().size(), comparison.getFilesToDelete().size()));

            log.info("File comparison: {} to download, {} to delete, {} unchanged",
                comparison.getFilesToDownload().size(),
                comparison.getFilesToDelete().size(),
                comparison.getUnchangedFiles().size());

            // Phase 2: Safety check for deletions
            if (!skipDeletionCheck && !comparison.getFilesToDelete().isEmpty()) {
                DeletionSafetyResult safetyResult = checkDeletionSafety(comparison);
                if (!safetyResult.isSafe()) {
                    currentResyncStatus.setPhase("Blocked by safety check");
                    return new FileSyncResult(false, safetyResult.getMessage(), comparison);
                }
            }

            // Phase 3: Download files from server with retry logic (10-90%)
            currentResyncStatus.setCurrentPhase("file_download");
            FileSyncStats stats = downloadFilesWithRetryAndProgress(comparison, maxRetries,
                FILES_ONLY_PHASE_COMPARE, FILES_ONLY_PHASE_DOWNLOAD);

            // Phase 4: Delete extra local files (90-100%)
            currentResyncStatus.setCurrentPhase("file_delete");
            int deleted = 0;
            if (!comparison.getFilesToDelete().isEmpty()) {
                deleted = deleteExtraFilesWithProgress(comparison,
                    FILES_ONLY_PHASE_COMPARE + FILES_ONLY_PHASE_DOWNLOAD, FILES_ONLY_PHASE_DELETE);
            } else {
                currentResyncStatus.setProgressPercent(100);
            }
            stats.setFilesDeleted(deleted);
            currentResyncStatus.setFilesDeleted(deleted);

            currentResyncStatus.setProgressPercent(100);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setPhase("Complete");
            currentResyncStatus.setEndTime(Instant.now());
            currentResyncStatus.setSuccess(true);
            currentResyncStatus.setStatusMessage(String.format("Files sync complete: %d downloaded, %d deleted",
                stats.getFilesDownloaded(), deleted));

            // Record successful sync for health tracking
            syncHealthChecker.recordSuccessfulSync();

            String message = String.format(
                "Files sync complete: %d downloaded, %d failed, %d deleted, %d unchanged",
                stats.getFilesDownloaded(), stats.getFilesFailed(),
                stats.getFilesDeleted(), comparison.getUnchangedFiles().size());

            log.info(message);
            if (!stats.getFailedFiles().isEmpty()) {
                log.warn("Failed to download {} files: {}",
                    stats.getFailedFiles().size(),
                    stats.getFailedFiles().subList(0, Math.min(5, stats.getFailedFiles().size())));
            }

            return new FileSyncResult(stats.getFilesFailed() == 0, message, comparison, stats);

        } catch (Exception e) {
            log.error("Files-only sync failed: {}", e.getMessage(), e);
            currentResyncStatus.setPhase("Failed: " + e.getMessage());
            currentResyncStatus.setSuccess(false);
            return new FileSyncResult(false, "Files sync failed: " + e.getMessage(), null);
        } finally {
            resyncInProgress.set(false);
        }
    }

    /**
     * Download files with retry logic.
     * Attempts to download each file up to maxRetries times before marking as failed.
     */
    private FileSyncStats downloadFilesWithRetry(FileComparisonResult comparison, int maxRetries) {
        FileSyncStats stats = new FileSyncStats();
        Path uploadsPath = getUploadsPath();

        List<FileManifestEntry> toDownload = new ArrayList<>(comparison.getFilesToDownload());
        List<FileManifestEntry> failedFirst = new ArrayList<>();

        int processed = 0;

        // First pass
        for (FileManifestEntry entry : toDownload) {
            boolean success = downloadSingleFile(entry, uploadsPath);
            if (success) {
                stats.incrementDownloaded();
            } else {
                failedFirst.add(entry);
            }
            processed++;
            currentResyncStatus.setProcessedFiles(processed);

            if (processed % 50 == 0) {
                log.info("Downloaded {}/{} files, {} failed so far",
                    stats.getFilesDownloaded(), toDownload.size(), failedFirst.size());
            }
        }

        // Retry failed files
        if (!failedFirst.isEmpty() && maxRetries > 0) {
            log.info("Retrying {} failed downloads (max {} retries)", failedFirst.size(), maxRetries);

            List<FileManifestEntry> stillFailed = new ArrayList<>(failedFirst);

            for (int retry = 1; retry <= maxRetries && !stillFailed.isEmpty(); retry++) {
                log.info("Retry attempt {} for {} files", retry, stillFailed.size());

                // Wait a bit before retry
                try {
                    Thread.sleep(1000L * retry);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }

                List<FileManifestEntry> retryFailed = new ArrayList<>();
                for (FileManifestEntry entry : stillFailed) {
                    boolean success = downloadSingleFile(entry, uploadsPath);
                    if (success) {
                        stats.incrementDownloaded();
                    } else {
                        retryFailed.add(entry);
                    }
                }
                stillFailed = retryFailed;
            }

            // Record final failures
            for (FileManifestEntry failed : stillFailed) {
                stats.addFailedFile(failed.getRelativePath());
            }
        } else {
            // No retries - just record failures
            for (FileManifestEntry failed : failedFirst) {
                stats.addFailedFile(failed.getRelativePath());
            }
        }

        return stats;
    }

    /**
     * Download files with retry logic and detailed progress tracking.
     * Updates progress from baseProgress to baseProgress + phaseWeight.
     */
    private FileSyncStats downloadFilesWithRetryAndProgress(FileComparisonResult comparison, int maxRetries,
                                                             int baseProgress, int phaseWeight) {
        FileSyncStats stats = new FileSyncStats();
        Path uploadsPath = getUploadsPath();

        List<FileManifestEntry> toDownload = new ArrayList<>(comparison.getFilesToDownload());
        List<FileManifestEntry> failedFirst = new ArrayList<>();

        int total = toDownload.size();
        if (total == 0) {
            currentResyncStatus.setProgressPercent(baseProgress + phaseWeight);
            currentResyncStatus.setPhaseProgressPercent(100);
            currentResyncStatus.setStatusMessage("No files to download");
            return stats;
        }

        long totalBytes = currentResyncStatus.getTotalFileBytes();
        long downloadedBytes = 0;

        // First pass
        for (int i = 0; i < total; i++) {
            FileManifestEntry entry = toDownload.get(i);

            currentResyncStatus.setPhase(String.format("Downloading files: %d / %d (%s)",
                i + 1, total, entry.getRelativePath()));

            boolean success = downloadSingleFileWithBytes(entry, uploadsPath, stats);
            if (success) {
                downloadedBytes += entry.getSize();
            } else {
                failedFirst.add(entry);
            }

            // Update progress tracking
            currentResyncStatus.setProcessedFiles(i + 1);
            currentResyncStatus.setFilesDownloaded(stats.getFilesDownloaded());
            currentResyncStatus.setDownloadedBytes(downloadedBytes);
            currentResyncStatus.setDownloadErrors(failedFirst.size());

            int phaseProgress = total > 0 ? (int) ((i + 1) * phaseWeight / (double) total) : 0;
            currentResyncStatus.setProgressPercent(baseProgress + phaseProgress);
            currentResyncStatus.setPhaseProgressPercent((i + 1) * 100 / total);

            if (totalBytes > 0) {
                currentResyncStatus.setStatusMessage(String.format(
                    "%s / %s downloaded (%d files)",
                    formatBytes(downloadedBytes), formatBytes(totalBytes), stats.getFilesDownloaded()));
            }

            if ((i + 1) % 50 == 0) {
                log.info("Downloaded {}/{} files, {} failed so far",
                    stats.getFilesDownloaded(), total, failedFirst.size());
            }
        }

        // Retry failed files
        if (!failedFirst.isEmpty() && maxRetries > 0) {
            log.info("Retrying {} failed downloads (max {} retries)", failedFirst.size(), maxRetries);
            currentResyncStatus.setStatusMessage(String.format("Retrying %d failed downloads...", failedFirst.size()));

            List<FileManifestEntry> stillFailed = new ArrayList<>(failedFirst);

            for (int retry = 1; retry <= maxRetries && !stillFailed.isEmpty(); retry++) {
                log.info("Retry attempt {} for {} files", retry, stillFailed.size());
                currentResyncStatus.setPhase(String.format("Retry %d: %d files remaining", retry, stillFailed.size()));

                try {
                    Thread.sleep(1000L * retry);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }

                List<FileManifestEntry> retryFailed = new ArrayList<>();
                for (FileManifestEntry entry : stillFailed) {
                    boolean success = downloadSingleFileWithBytes(entry, uploadsPath, stats);
                    if (success) {
                        downloadedBytes += entry.getSize();
                        currentResyncStatus.setDownloadedBytes(downloadedBytes);
                        currentResyncStatus.setFilesDownloaded(stats.getFilesDownloaded());
                    } else {
                        retryFailed.add(entry);
                    }
                }
                stillFailed = retryFailed;
                currentResyncStatus.setDownloadErrors(stillFailed.size());
            }

            for (FileManifestEntry failed : stillFailed) {
                stats.addFailedFile(failed.getRelativePath());
            }
        } else {
            for (FileManifestEntry failed : failedFirst) {
                stats.addFailedFile(failed.getRelativePath());
            }
        }

        return stats;
    }

    /**
     * Download a single file and update stats.
     * Returns true if successful, false otherwise.
     */
    private boolean downloadSingleFileWithBytes(FileManifestEntry entry, Path uploadsPath, FileSyncStats stats) {
        boolean success = downloadSingleFile(entry, uploadsPath);
        if (success) {
            stats.incrementDownloaded();
        }
        return success;
    }

    /**
     * Download a single file from the server.
     * Returns true if successful, false otherwise.
     */
    private boolean downloadSingleFile(FileManifestEntry entry, Path uploadsPath) {
        String url = null;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            // Prefer permanent storage endpoint if available
            if (entry.getPermanentPath() != null && !entry.getPermanentPath().isEmpty()) {
                String encodedPath = java.net.URLEncoder.encode(entry.getPermanentPath(), "UTF-8")
                    .replace("+", "%20")
                    .replace("%2F", "/");
                url = syncConfig.getSyncServerUrl() + "/api/resync/files/permanent/" + encodedPath;
            } else if (entry.getServerId() != null) {
                url = syncConfig.getSyncServerUrl() + "/api/resync/files/" + entry.getServerId();
            } else {
                log.warn("No download path for file: {}", entry.getRelativePath());
                return false;
            }

            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Failed to download {}: HTTP {}", entry.getRelativePath(), response.getStatusCode());
                return false;
            }

            byte[] fileContent = response.getBody();
            if (fileContent == null || fileContent.length == 0) {
                log.warn("Empty content received for file: {}", entry.getRelativePath());
                return false;
            }

            Path destPath = uploadsPath.resolve(entry.getRelativePath());
            Files.createDirectories(destPath.getParent());
            Files.write(destPath, fileContent);

            return true;

        } catch (RestClientResponseException e) {
            log.warn("Failed to download file {} from {}: HTTP {} {}",
                entry.getRelativePath(),
                url,
                e.getStatusCode().value(),
                abbreviateResponseBody(e.getResponseBodyAsString()));
            return false;
        } catch (Exception e) {
            log.warn("Failed to download file {} from {}: {}",
                entry.getRelativePath(), url, e.getMessage());
            return false;
        }
    }

    private String abbreviateResponseBody(String body) {
        if (body == null || body.isBlank()) {
            return "(empty body)";
        }
        String normalized = body.replaceAll("\\s+", " ").trim();
        return normalized.length() > 180 ? normalized.substring(0, 180) + "..." : normalized;
    }

    /**
     * Delete extra files and return count of deleted files.
     */
    private int deleteExtraFilesWithTracking(FileComparisonResult comparison) {
        Path uploadsPath = getUploadsPath();
        int deleted = 0;

        for (String relativePath : comparison.getFilesToDelete()) {
            Path filePath = uploadsPath.resolve(relativePath);
            try {
                if (Files.deleteIfExists(filePath)) {
                    deleted++;
                    deleteEmptyParentDirectories(filePath.getParent(), uploadsPath);
                }
            } catch (Exception e) {
                log.warn("Failed to delete {}: {}", filePath, e.getMessage());
            }
        }

        log.info("Deleted {} extra local files", deleted);
        return deleted;
    }

    // ==================== PARTIAL SYNC ====================

    /**
     * Get available dates for partial sync from the sync server.
     * Returns dates where sync history is available.
     */
    public PartialSyncDatesResponse getAvailableSyncDates() {
        if (syncConfig.getSyncServerUrl() == null || syncConfig.getSyncServerUrl().isEmpty()) {
            PartialSyncDatesResponse response = new PartialSyncDatesResponse();
            response.setErrorMessage("Sync server URL not configured");
            return response;
        }

        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/partial-sync/available-dates";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<PartialSyncDatesResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), PartialSyncDatesResponse.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get available sync dates: {}", e.getMessage());
            PartialSyncDatesResponse response = new PartialSyncDatesResponse();
            response.setErrorMessage("Failed to connect to sync server: " + e.getMessage());
            return response;
        }
    }

    /**
     * Preview a partial sync from a specific date.
     * Returns the count of changes that would be applied.
     */
    public PartialSyncPreview previewPartialSync(String date) {
        PartialSyncPreview preview = new PartialSyncPreview();
        preview.setDate(date);

        if (syncConfig.getSyncServerUrl() == null || syncConfig.getSyncServerUrl().isEmpty()) {
            preview.setErrorMessage("Sync server URL not configured");
            return preview;
        }

        try {
            // Get change count from server
            String url = syncConfig.getSyncServerUrl() + "/api/sync/partial-sync/count?date=" + date;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            Map<String, Object> data = response.getBody();
            if (data != null) {
                preview.setChangeCount(((Number) data.get("changeCount")).longValue());
            }

            // Get file comparison preview
            FileComparisonResult fileComparison = compareLocalWithServer();
            preview.setFilesToDownload(fileComparison.getFilesToDownload().size());
            preview.setFilesToDelete(fileComparison.getFilesToDelete().size());
            preview.setFilesUnchanged(fileComparison.getUnchangedFiles().size());

        } catch (Exception e) {
            log.error("Failed to preview partial sync: {}", e.getMessage());
            preview.setErrorMessage("Failed to preview: " + e.getMessage());
        }

        return preview;
    }

    /**
     * Perform partial sync from a specific date.
     * Fetches field changes since the date and applies them locally, then resyncs files.
     *
     * @param date The date to sync from (yyyy-MM-dd format)
     * @param skipDeletionCheck If true, skip the file deletion safety check
     * @return PartialSyncResult with details of the operation
     */
    public PartialSyncResult performPartialSync(String date, boolean skipDeletionCheck) {
        if (!resyncInProgress.compareAndSet(false, true)) {
            return new PartialSyncResult(false, "Resync already in progress", null, 0);
        }

        currentResyncStatus = new ResyncStatus();
        currentResyncStatus.setStartTime(Instant.now());
        currentResyncStatus.setPhase("Starting partial sync from " + date);

        try {
            if (syncConfig.getSyncServerUrl() == null || syncConfig.getSyncServerUrl().isEmpty()) {
                return new PartialSyncResult(false, "Sync server URL not configured", null, 0);
            }

            // Phase 1: Fetch FieldChange records and apply via FieldSyncService
            // This is the SAME code path as real-time sync (CentralSyncService)
            currentResyncStatus.setPhase("Fetching changes since " + date);
            int changesApplied = fetchAndApplyFieldChanges(date);
            log.info("Applied {} field changes from partial sync", changesApplied);

            // Phase 2: Compare and restore files (same as full resync)
            currentResyncStatus.setPhase("Comparing files");
            FileComparisonResult comparison = compareLocalWithServer();
            currentResyncStatus.setTotalFiles(comparison.getTotalBackupFiles());

            // Phase 3: Safety check for deletions
            if (!skipDeletionCheck) {
                DeletionSafetyResult safetyResult = checkDeletionSafety(comparison);
                if (!safetyResult.isSafe()) {
                    currentResyncStatus.setPhase("Blocked by safety check");
                    return new PartialSyncResult(false, safetyResult.getMessage(), comparison, changesApplied);
                }
            }

            // Phase 4: Download files from server
            currentResyncStatus.setPhase("Downloading files");
            downloadFilesFromServer(comparison);

            // Phase 5: Delete extra local files
            currentResyncStatus.setPhase("Deleting extra files");
            deleteExtraFiles(comparison);

            // Phase 6: Download pending attachments from server
            currentResyncStatus.setPhase("Syncing attachments");
            try {
                attachmentSyncHandler.uploadPendingAttachments();
                attachmentSyncHandler.downloadPendingAttachments();
            } catch (Exception e) {
                log.warn("Attachment sync during partial resync had errors: {}", e.getMessage());
            }

            currentResyncStatus.setPhase("Complete");
            currentResyncStatus.setEndTime(Instant.now());
            currentResyncStatus.setSuccess(true);

            // Record successful sync for health tracking
            syncHealthChecker.recordSuccessfulSync();

            log.info("Partial sync complete: {} changes applied, {} files downloaded, {} files deleted",
                changesApplied, comparison.getFilesToDownload().size(), comparison.getFilesToDelete().size());

            return new PartialSyncResult(true,
                String.format("Partial sync completed. %d changes applied, %d files downloaded, %d files deleted",
                    changesApplied, comparison.getFilesToDownload().size(), comparison.getFilesToDelete().size()),
                comparison, changesApplied);

        } catch (Exception e) {
            log.error("Partial sync failed: {}", e.getMessage(), e);
            currentResyncStatus.setPhase("Failed: " + e.getMessage());
            currentResyncStatus.setSuccess(false);
            return new PartialSyncResult(false, "Partial sync failed: " + e.getMessage(), null, 0);
        } finally {
            resyncInProgress.set(false);
        }
    }

    /**
     * Fetch FieldChange records from server and apply via FieldSyncService.
     * This uses the SAME code path as real-time sync (CentralSyncService → FieldSyncService).
     */
    private int fetchAndApplyFieldChanges(String date) {
        int totalApplied = 0;
        int page = 0;
        int pageSize = 500;
        boolean hasMore = true;

        while (hasMore) {
            String url = String.format("%s/api/sync/partial-sync/changes?date=%s&page=%d&size=%d",
                syncConfig.getSyncServerUrl(), date, page, pageSize);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<FieldChange>>() {});

            List<FieldChange> changes = response.getBody();
            if (changes == null || changes.isEmpty()) {
                break;
            }

            // Log entity types received for diagnostics
            Map<String, Long> entityTypeCounts = changes.stream()
                .collect(Collectors.groupingBy(FieldChange::getEntityType, Collectors.counting()));
            log.info("Received {} changes on page {}: {}", changes.size(), page, entityTypeCounts);

            // Apply via FieldSyncService - SAME code path as real-time sync
            int applied = fieldSyncService.applyIncomingChanges(changes);
            totalApplied += applied;

            log.debug("Applied {}/{} changes from page {}", applied, changes.size(), page);

            // Check if there are more pages
            String hasMoreHeader = response.getHeaders().getFirst("X-Has-More");
            hasMore = "true".equalsIgnoreCase(hasMoreHeader);
            page++;
        }

        return totalApplied;
    }

    // ==================== STATUS GETTERS ====================

    public ResyncStatus getResyncStatus() {
        return currentResyncStatus;
    }

    public BackupStatus getBackupStatus() {
        return currentBackupStatus;
    }

    public boolean isResyncInProgress() {
        return resyncInProgress.get();
    }

    public boolean isBackupInProgress() {
        return backupInProgress.get();
    }

    // ==================== UTILITIES ====================

    private Path getUploadsPath() {
        Path filesPath = Paths.get(filesRootPath);
        // If filesRootPath is already absolute, use it directly
        if (filesPath.isAbsolute()) {
            return filesPath;
        }
        // Otherwise, combine with project root
        if (projectRootPath != null && !projectRootPath.isEmpty()) {
            return Paths.get(projectRootPath, filesRootPath);
        }
        return filesPath;
    }

    /**
     * Strip the uploads directory prefix from a server path.
     * Server paths may be like "uploads-prod/pdf/file.pdf" and we need just "pdf/file.pdf".
     * Handles both the configured filesRootPath name and generic "uploads" prefix.
     */
    private String stripUploadsPrefix(String serverPath) {
        if (serverPath == null || serverPath.isEmpty()) {
            return serverPath;
        }

        // Get the uploads directory name from filesRootPath
        String uploadsDirName = Paths.get(filesRootPath).getFileName().toString();

        // Try to strip the configured uploads dir name first (e.g., "uploads-prod/")
        if (serverPath.startsWith(uploadsDirName + "/")) {
            return serverPath.substring(uploadsDirName.length() + 1);
        }

        // Fallback: try generic "uploads/" prefix
        if (serverPath.startsWith("uploads/")) {
            return serverPath.substring(8);
        }

        // No prefix found, return as-is
        return serverPath;
    }

    /**
     * Format bytes to human-readable string (e.g., "1.5 MB").
     */
    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    /**
     * Calculate total bytes for a list of file manifest entries.
     */
    private long calculateTotalBytes(List<FileManifestEntry> files) {
        return files.stream()
            .mapToLong(f -> f.getSize() > 0 ? f.getSize() : 0)
            .sum();
    }

    private String computeChecksum(Path file) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = Files.readAllBytes(file);
            byte[] digest = md.digest(bytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IOException("Failed to compute checksum: " + e.getMessage(), e);
        }
    }

    // ==================== DTOs ====================

    @Data
    public static class FileManifest {
        private Instant generatedAt;
        private String machineId;
        private List<FileManifestEntry> files = new ArrayList<>();
        private long totalSize;
    }

    @Data
    public static class FileManifestEntry {
        private String relativePath;
        private String checksum;
        private long size;
        private Instant lastModified;
        private Long serverId;  // ID on sync server for downloading (hash-based storage)
        private String permanentPath;  // Path in permanent storage for downloading
    }

    @Data
    public static class BackupMetadata {
        private Instant timestamp;
        private String machineId;
        private String machineName;
        private String databaseBackupFile;
        private int fileCount;
        private long totalFileSize;
    }

    @Data
    public static class BackupResult {
        private final boolean success;
        private final String message;
        private final BackupMetadata metadata;
    }

    @Data
    public static class ResyncResult {
        private final boolean success;
        private final String message;
        private final FileComparisonResult comparison;
    }

    @Data
    public static class FileComparisonResult {
        private int totalBackupFiles;
        private int totalLocalFiles;
        private List<FileManifestEntry> filesToDownload = new ArrayList<>();
        private List<String> filesToDelete = new ArrayList<>();
        private List<String> unchangedFiles = new ArrayList<>();
        private String errorMessage;
    }

    @Data
    public static class DeletionSafetyResult {
        private final boolean safe;
        private final String message;
    }

    @Data
    public static class ResyncStatus {
        private Instant startTime;
        private Instant endTime;
        private String phase;
        private int totalFiles;
        private int processedFiles;
        private boolean success;
        private boolean restartRequired;

        // Progress tracking (0-100)
        private int progressPercent;

        // Byte-level file tracking
        private long totalFileBytes;
        private long downloadedBytes;

        // Per-phase tracking
        private String currentPhase;          // "db_download", "db_restore", "file_compare", "file_download", "file_delete"
        private int phaseProgressPercent;     // 0-100 within current phase

        // Detailed status
        private String statusMessage;         // Human-readable status
        private int filesDownloaded;
        private int filesDeleted;
        private int downloadErrors;
    }

    @Data
    public static class BackupStatus {
        private Instant startTime;
        private Instant endTime;
        private String phase;
        private int totalFiles;
        private int processedFiles;
        private boolean success;
    }

    @Data
    public static class SyncHealthStatus {
        private String machineId;
        private String machineName;
        private Instant timestamp;
        private boolean backupAvailable;
        private Instant backupTimestamp;
        private String backupMachineId;
        private int backupFileCount;
        private int localFileCount;
        private int fileDifference;
        private boolean potentialMismatch;
        private String errorMessage;
        private long serverEntityCount;  // Number of entities on sync server
    }

    // Server DTOs for sync server communication

    @Data
    public static class ServerResyncHealth {
        private boolean healthy;
        private Map<String, Long> entityCounts;
        private long totalEntities;
        private long totalSyncedFiles;
        private Instant lastUpdated;
        private String errorMessage;
    }

    @Data
    public static class ServerFileManifestEntry {
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

    /**
     * DTO for path-based manifest entry from permanent storage.
     * Used for file comparison during resync - indexed by client-relative path.
     */
    @Data
    public static class PathBasedManifestEntry {
        private String relativePath;    // e.g., "uploads/pdf/P&ID/ABB/P123.pdf"
        private String fileHash;        // SHA-256 hash
        private Long fileSize;          // bytes
        private Instant lastModified;
    }

    // Partial sync DTOs

    @Data
    public static class PartialSyncDatesResponse {
        private List<String> availableDates;  // List of dates in yyyy-MM-dd format
        private String oldestDate;             // Oldest available date
        private String latestDate;             // Most recent date
        private long totalChangesInHistory;    // Total changes available
        private int retentionDays;             // How long history is kept
        private String errorMessage;
    }

    @Data
    public static class PartialSyncPreview {
        private String date;
        private long changeCount;
        private int filesToDownload;
        private int filesToDelete;
        private int filesUnchanged;
        private String errorMessage;
    }

    @Data
    public static class PartialSyncResult {
        private final boolean success;
        private final String message;
        private final FileComparisonResult fileComparison;
        private final int changesApplied;
    }

    // Files-only sync DTOs

    @Data
    public static class FileSyncResult {
        private final boolean success;
        private final String message;
        private final FileComparisonResult comparison;
        private FileSyncStats stats;

        public FileSyncResult(boolean success, String message, FileComparisonResult comparison) {
            this.success = success;
            this.message = message;
            this.comparison = comparison;
            this.stats = null;
        }

        public FileSyncResult(boolean success, String message, FileComparisonResult comparison, FileSyncStats stats) {
            this.success = success;
            this.message = message;
            this.comparison = comparison;
            this.stats = stats;
        }
    }

    @Data
    public static class FileSyncStats {
        private int filesDownloaded = 0;
        private int filesFailed = 0;
        private int filesDeleted = 0;
        private List<String> failedFiles = new ArrayList<>();

        public void incrementDownloaded() {
            filesDownloaded++;
        }

        public void addFailedFile(String path) {
            filesFailed++;
            failedFiles.add(path);
        }
    }

}
