package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncDirection;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncStatus;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.sync.PendingFileSyncRepository;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.util.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles file synchronization for FileObject entities.
 *
 * When a FileObject is created/modified locally:
 * - Uploads the physical file(s) to the sync server
 *
 * When a FileObject change is received from sync:
 * - Downloads the physical file(s) from the sync server
 * - Handles file moves/renames when path-affecting fields change
 *
 * This service bridges the gap between metadata sync (handled by FieldChangeEntityListener)
 * and physical file sync (which needs to transfer binary data).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileObjectSyncHandler {

    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final FileRepo fileRepo;
    private final SyncContext syncContext;
    private final PendingFileSyncRepository pendingFileSyncRepository;
    private final ValueRepo valueRepo;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    /**
     * Resolve a path that includes a baseLink prefix to the actual filesystem path.
     * Strips the first path component (baseLink) and resolves against profile-specific filesRootPath.
     */
    private Path resolveToFileSystem(String pathWithBaseLink) {
        String normalized = pathWithBaseLink.replace("\\", "/");
        int firstSlash = normalized.indexOf('/');
        if (firstSlash >= 0) {
            String relativePart = normalized.substring(firstSlash + 1);
            return Paths.get(filesRootPath).resolve(relativePart);
        }
        return Paths.get(filesRootPath).resolve(pathWithBaseLink);
    }

    // Retry configuration with exponential backoff
    private static final int MAX_RETRIES = 10;  // Increased for better offline handling
    private static final long[] RETRY_DELAYS_MS = {1000, 2000, 4000, 8000, 16000, 32000, 60000, 120000, 300000, 600000};

    // Track in-progress operations to avoid concurrent processing of same entity
    private final Set<String> inProgressUploads = ConcurrentHashMap.newKeySet();
    private final Set<String> inProgressDownloads = ConcurrentHashMap.newKeySet();

    // Track old file paths when entity is being modified (for move operations)
    private final Map<Long, FileObjectSnapshot> entitySnapshots = new ConcurrentHashMap<>();

    /**
     * Initialize on application startup - reset any stuck tasks and log pending work.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        // Reset any tasks that were IN_PROGRESS when the app shut down
        int resetCount = pendingFileSyncRepository.resetStuckTasks(Instant.now());
        if (resetCount > 0) {
            log.info("Reset {} stuck file sync tasks to PENDING status", resetCount);
        }

        // Reset FAILED upload tasks on startup (server may now be reachable)
        int resetFailed = pendingFileSyncRepository.resetFailedUploads(Instant.now());
        if (resetFailed > 0) {
            log.info("Reset {} failed file upload tasks to PENDING status (will retry)", resetFailed);
        }

        // Clean up old completed tasks (older than 24 hours)
        int cleanedCount = pendingFileSyncRepository.deleteCompletedBefore(
            Instant.now().minus(24, ChronoUnit.HOURS));
        if (cleanedCount > 0) {
            log.debug("Cleaned up {} completed file sync tasks", cleanedCount);
        }

        // Log pending work
        long pendingUploads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.UPLOAD, List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS));
        long pendingDownloads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.DOWNLOAD, List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS));

        if (pendingUploads > 0 || pendingDownloads > 0) {
            log.info("File sync queue: {} pending uploads, {} pending downloads", pendingUploads, pendingDownloads);
        }
    }

    /**
     * Called when a FileObject is about to be updated.
     * Captures the old file paths so we can move files if paths change.
     */
    public void captureBeforeUpdate(FileObject fileObject) {
        if (fileObject == null || fileObject.getId() == null) return;

        FileObjectSnapshot snapshot = new FileObjectSnapshot(
            fileObject.getId(),
            fileObject.getFileNumber(),
            fileObject.getFileType() != null ? fileObject.getFileType().getName() : null,
            fileObject.getVendor() != null ? fileObject.getVendor().getName() : null,
            fileObject.getExtensionsArray(),
            fileObject.getStoredFileLink()
        );
        entitySnapshots.put(fileObject.getId(), snapshot);
        log.debug("Captured snapshot for FileObject #{}: {}", fileObject.getId(), snapshot);
    }

    /**
     * Called when a local FileObject is created or updated.
     * Queues the file for upload to sync server.
     */
    public void onLocalFileObjectChanged(FileObject fileObject, boolean isCreate) {
        if (!syncConfig.isServerSyncEnabled()) {
            log.debug("Server sync disabled, skipping file upload");
            return;
        }

        if (syncContext.isSyncing()) {
            // This change came from an incoming sync, don't re-upload
            log.debug("Skipping upload for FileObject #{} - change came from sync", fileObject.getId());
            return;
        }

        log.info("Local FileObject {} #{} - queueing file upload",
            isCreate ? "created" : "modified", fileObject.getId());

        // Queue upload for all file versions
        queueFileUpload(fileObject);

        // Check if we need to notify sync server about file path changes
        FileObjectSnapshot oldSnapshot = entitySnapshots.remove(fileObject.getId());
        if (oldSnapshot != null && !isCreate) {
            handlePathChange(fileObject, oldSnapshot);
        }
    }

    /**
     * Event listener for sync changes - handles incoming FileObject updates.
     * Groups changes by entity to handle multiple path-affecting changes together.
     *
     * This always processes path changes to delete old files locally,
     * regardless of server sync mode. File downloads are only queued
     * when server sync is enabled.
     */
    @Async
    @EventListener
    public void onSyncChangesApplied(FileObjectSyncEvent event) {
        boolean serverSyncEnabled = syncConfig.isServerSyncEnabled();
        log.info("Processing {} FileObject sync changes (serverSync={})",
            event.getChanges().size(), serverSyncEnabled);

        // Group changes by entity ID to handle all path changes together
        Map<Long, List<FieldChange>> changesByEntity = event.getChanges().stream()
            .filter(c -> "FileObject".equals(c.getEntityType()))
            .collect(java.util.stream.Collectors.groupingBy(FieldChange::getEntityId));

        for (Map.Entry<Long, List<FieldChange>> entry : changesByEntity.entrySet()) {
            Long entityId = entry.getKey();
            List<FieldChange> entityChanges = entry.getValue();

            try {
                processIncomingSyncChanges(entityId, entityChanges, serverSyncEnabled);
            } catch (Exception e) {
                log.error("Error processing sync changes for FileObject #{}: {}",
                    entityId, e.getMessage(), e);
            }
        }
    }

    /**
     * Process all incoming sync changes for a single FileObject.
     * Handles multiple path-affecting changes together to correctly reconstruct old paths.
     *
     * @param entityId the FileObject ID
     * @param changes the list of field changes
     * @param serverSyncEnabled whether to queue file downloads (requires server sync)
     */
    private void processIncomingSyncChanges(Long entityId, List<FieldChange> changes, boolean serverSyncEnabled) {
        // Check for entity-level changes first
        FieldChange entityChange = changes.stream()
            .filter(c -> "_entity_".equals(c.getFieldName()))
            .findFirst().orElse(null);

        if (entityChange != null) {
            if (entityChange.getChangeType() == FieldChange.ChangeType.CREATE) {
                if (serverSyncEnabled) {
                    FileObject fileObject = fileRepo.findById(entityId).orElse(null);
                    if (fileObject != null) {
                        queueFileDownload(fileObject);
                    }
                }
            } else if (entityChange.getChangeType() == FieldChange.ChangeType.DELETE) {
                log.info("FileObject #{} was deleted, local files retained", entityId);
            }
            return;
        }

        // Collect all path-affecting changes
        Map<String, FieldChange> pathChanges = changes.stream()
            .filter(c -> isPathAffectingField(c.getFieldName()))
            .collect(java.util.stream.Collectors.toMap(
                FieldChange::getFieldName,
                c -> c,
                (a, b) -> a.getTimestamp().isAfter(b.getTimestamp()) ? a : b
            ));

        // Check for extension/content changes
        boolean hasContentChange = changes.stream()
            .anyMatch(c -> "fileHash".equals(c.getFieldName()) || "extensions".equals(c.getFieldName()));

        FileObject fileObject = fileRepo.findById(entityId).orElse(null);
        if (fileObject == null) {
            log.warn("FileObject #{} not found", entityId);
            return;
        }

        // Move files from old path to new path if path-affecting fields changed
        boolean filesMoved = false;
        if (!pathChanges.isEmpty()) {
            filesMoved = handleIncomingPathChanges(fileObject, pathChanges);
        }

        // Queue file downloads from server only when needed:
        // - Content changed (hash/extensions) -> always download latest version
        // - Path changed but files not found locally -> download from server
        if (serverSyncEnabled) {
            if (hasContentChange) {
                queueFileDownload(fileObject);
            } else if (!pathChanges.isEmpty() && !filesMoved) {
                queueFileDownload(fileObject);
            }
        }
    }

    /**
     * Check if a field affects the file path.
     */
    private boolean isPathAffectingField(String fieldName) {
        return "fileNumber".equals(fieldName) ||
               "fileType".equals(fieldName) ||
               "vendor".equals(fieldName) ||
               "extension".equals(fieldName);
    }

    /**
     * Handle path change from local update.
     */
    private void handlePathChange(FileObject newEntity, FileObjectSnapshot oldSnapshot) {
        boolean pathChanged =
            !Objects.equals(oldSnapshot.fileNumber, newEntity.getFileNumber()) ||
            !Objects.equals(oldSnapshot.fileTypeName,
                newEntity.getFileType() != null ? newEntity.getFileType().getName() : null) ||
            !Objects.equals(oldSnapshot.vendorName,
                newEntity.getVendor() != null ? newEntity.getVendor().getName() : null);

        if (pathChanged) {
            log.info("FileObject #{} path changed from {} to {}",
                newEntity.getId(), oldSnapshot.oldFileLink, newEntity.getFileLink());
            // File move is already handled by NgFileService.updateFileObject()
            // Here we just need to ensure the new files are uploaded to sync server
        }
    }

    /**
     * Handle multiple path changes from incoming sync together.
     * The entity already has new values, but local files are at old paths.
     * Moves files from old location to new location instead of deleting them.
     *
     * @return true if files were successfully moved locally
     */
    private boolean handleIncomingPathChanges(FileObject fileObject, Map<String, FieldChange> pathChanges) {
        log.info("Path change for FileObject #{}: fields={}", fileObject.getId(), pathChanges.keySet());

        // Move files from old path to new path
        return moveFilesAfterPathChanges(fileObject, pathChanges);
    }

    /**
     * Move files from old path to new path when path-affecting fields change from sync.
     * Reconstructs the complete old path using ALL old field values together.
     * Handles all extensions and revision files.
     *
     * @return true if any files were moved successfully
     */
    private boolean moveFilesAfterPathChanges(FileObject fileObject, Map<String, FieldChange> pathChanges) {
        if (pathChanges.isEmpty()) {
            return false;
        }

        boolean anyMoved = false;

        try {
            // Get current values from entity (these are the NEW values)
            String currentFileNumber = fileObject.getFileNumber();
            String currentFileType = fileObject.getFileType() != null ? fileObject.getFileType().getName() : null;
            String currentVendor = fileObject.getVendor() != null ? fileObject.getVendor().getName() : null;
            List<String> currentExtensions = fileObject.getExtensionsArray();

            // Reconstruct old values from ALL path changes
            String oldFileNumber = currentFileNumber;
            String oldFileType = currentFileType;
            String oldVendor = currentVendor;
            List<String> oldExtensions = currentExtensions;

            if (pathChanges.containsKey("fileNumber")) {
                oldFileNumber = stripJsonQuotes(pathChanges.get("fileNumber").getOldValue());
            }
            if (pathChanges.containsKey("fileType")) {
                String oldFileTypeId = pathChanges.get("fileType").getOldValue();
                oldFileType = resolveValueNameById(oldFileTypeId);
                log.info("FileType change: oldId={} resolved to '{}'", oldFileTypeId, oldFileType);
            }
            if (pathChanges.containsKey("vendor")) {
                String oldVendorId = pathChanges.get("vendor").getOldValue();
                oldVendor = resolveValueNameById(oldVendorId);
                log.info("Vendor change: oldId={} resolved to '{}'", oldVendorId, oldVendor);
            }
            if (pathChanges.containsKey("extension")) {
                String oldExtValue = stripJsonQuotes(pathChanges.get("extension").getOldValue());
                if (oldExtValue != null && !oldExtValue.isEmpty()) {
                    oldExtensions = Arrays.asList(oldExtValue.split(","));
                }
            }

            log.info("Moving files: old=[number={}, type={}, vendor={}, ext={}] -> new=[number={}, type={}, vendor={}]",
                oldFileNumber, oldFileType, oldVendor, oldExtensions,
                currentFileNumber, currentFileType, currentVendor);

            // Move files for EACH extension
            for (String extension : oldExtensions) {
                String trimmedExt = extension.trim();
                if (trimmedExt.isEmpty()) continue;

                // Build relative folder paths (without baseLink — resolve against filesRootPath)
                String oldRelativeFolder = String.format("%s/%s/%s",
                    trimmedExt,
                    oldFileType != null ? oldFileType : "",
                    oldVendor != null ? oldVendor : "");

                String newRelativeFolder = String.format("%s/%s/%s",
                    trimmedExt,
                    currentFileType != null ? currentFileType : "",
                    currentVendor != null ? currentVendor : "");

                // Skip if paths haven't actually changed (e.g., Value FK changed but names identical)
                if (oldRelativeFolder.equals(newRelativeFolder) && Objects.equals(oldFileNumber, currentFileNumber)) {
                    log.debug("Path unchanged for extension {} (same name, different ID), skipping", trimmedExt);
                    continue;
                }

                Path oldFolderPath = Paths.get(filesRootPath).resolve(oldRelativeFolder);
                Path newFolderPath = Paths.get(filesRootPath).resolve(newRelativeFolder);

                if (Files.exists(oldFolderPath)) {
                    List<File> oldFiles = FileUtil.getRevisionsByFileNumber(oldFileNumber, oldFolderPath.toString());

                    log.info("Found {} files to move in {} for fileNumber {}",
                        oldFiles.size(), oldFolderPath, oldFileNumber);

                    if (oldFiles.isEmpty()) continue;

                    // Safety guard: check if files belong to a different active FileObject
                    FileObject owner = findActiveOwnerByRelativeFolder(oldFileNumber, oldRelativeFolder);
                    if (owner != null && !owner.getId().equals(fileObject.getId())) {
                        log.warn("Files at {} belong to active FileObject #{}, skipping move",
                            oldFolderPath, owner.getId());
                        continue;
                    }

                    // Create target directory
                    Files.createDirectories(newFolderPath);

                    for (File oldFile : oldFiles) {
                        try {
                            String oldFileName = oldFile.getName();
                            String newFileName = oldFileName;
                            // Rename file if fileNumber changed
                            if (!Objects.equals(oldFileNumber, currentFileNumber) && oldFileNumber != null) {
                                newFileName = oldFileName.replaceFirst(
                                    java.util.regex.Pattern.quote(oldFileNumber), currentFileNumber);
                            }
                            Path targetPath = newFolderPath.resolve(newFileName);
                            Files.move(oldFile.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                            log.info("Moved file: {} -> {}", oldFile.toPath(), targetPath);
                            anyMoved = true;
                        } catch (IOException e) {
                            log.warn("Failed to move file {}: {}", oldFile.getAbsolutePath(), e.getMessage());
                        }
                    }

                    // Clean up empty old directories
                    cleanupEmptyDirectories(oldFolderPath);
                }
            }
        } catch (Exception e) {
            log.error("Error moving files for FileObject #{}: {}", fileObject.getId(), e.getMessage());
        }

        return anyMoved;
    }

    /**
     * Check if a file belongs to an active FileObject using relative folder paths.
     */
    private FileObject findActiveOwnerByRelativeFolder(String fileNumber, String relativeFolder) {
        if (fileNumber == null || relativeFolder == null) return null;
        FileObject fo = fileRepo.findByFileNumber(fileNumber);
        if (fo == null) return null;
        for (String ext : fo.getExtensionsArray()) {
            try {
                String currentRelFolder = fo.buildRelativeFolder(ext.trim());
                if (currentRelFolder != null && currentRelFolder.equals(relativeFolder)) {
                    return fo;
                }
            } catch (Exception e) {
                // buildRelativeFolder can return null if fileType/vendor is null
            }
        }
        return null;
    }

    /**
     * Clean up empty directories after file deletion.
     */
    private void cleanupEmptyDirectories(Path directory) {
        try {
            Path uploadsRoot = Paths.get(filesRootPath);
            Path current = directory;

            while (current != null && !current.equals(uploadsRoot) && Files.exists(current)) {
                try (var stream = Files.list(current)) {
                    if (stream.findAny().isEmpty()) {
                        Files.delete(current);
                        log.debug("Deleted empty directory: {}", current);
                        current = current.getParent();
                    } else {
                        break; // Directory not empty
                    }
                }
            }
        } catch (IOException e) {
            log.debug("Could not clean up empty directories: {}", e.getMessage());
        }
    }

    /**
     * Delete old folders after successful download.
     * This is called when a Vendor or FileType name changes - the task stores the old folder paths
     * that should be deleted only after new files are successfully downloaded to the new location.
     */
    private void deleteOldFoldersAfterDownload(PendingFileSync task) {
        String oldFolders = task.getOldFolderToDelete();
        if (oldFolders == null || oldFolders.isEmpty()) {
            return;
        }

        log.info("Deleting old folders after successful download for FileObject #{}: {}",
            task.getEntityId(), oldFolders);

        // Folders can be semicolon-separated if multiple renames happened
        for (String folderPath : oldFolders.split(";")) {
            String trimmedPath = folderPath.trim();
            if (trimmedPath.isEmpty()) {
                continue;
            }

            try {
                Path path = Paths.get(trimmedPath);
                if (!Files.exists(path)) {
                    log.debug("Old folder no longer exists (already deleted?): {}", path);
                    continue;
                }

                // Selective deletion: check each file before deleting to protect
                // files that belong to active FileObjects
                boolean skippedAny = false;
                try (var stream = Files.walk(path)) {
                    List<Path> files = stream
                        .filter(Files::isRegularFile)
                        .collect(java.util.stream.Collectors.toList());

                    for (Path file : files) {
                        String fileName = file.getFileName().toString();
                        // Extract fileNumber: strip extension and revision suffix
                        String baseName = fileName.replaceAll("(-rev\\d+)?\\.[^.]+$", "");

                        FileObject owner = findActiveOwner(baseName, trimmedPath);
                        if (owner != null) {
                            log.warn("File {} in old folder belongs to active FileObject #{}, skipping and queueing upload",
                                fileName, owner.getId());
                            queueFileUpload(owner);
                            skippedAny = true;
                        } else {
                            Files.deleteIfExists(file);
                            log.info("Deleted old file after download: {}", file);
                        }
                    }
                }

                // Only clean up directories if all files were deleted
                if (!skippedAny) {
                    cleanupEmptyDirectories(path);
                } else {
                    // Still try to clean up empty subdirectories
                    cleanupEmptyDirectories(path);
                }
            } catch (Exception e) {
                log.warn("Failed to process old folder {}: {}", trimmedPath, e.getMessage());
            }
        }
    }

    /**
     * Resolve a Value entity name by its ID.
     * Used to get the name of vendor/fileType from the ID stored in FieldChange.oldValue.
     *
     * @param valueIdStr the string representation of the Value ID
     * @return the name of the Value entity, or null if not found
     */
    private String resolveValueNameById(String valueIdStr) {
        if (valueIdStr == null || valueIdStr.isEmpty()) {
            return null;
        }

        try {
            // Remove quotes if present (JSON serialization may add them)
            String cleanId = valueIdStr.replace("\"", "").trim();
            Long valueId = Long.parseLong(cleanId);

            // Look up the Value entity including deleted ones
            // (the vendor may have been deleted, but we still need its name for path cleanup)
            com.dk_power.power_plant_java.entities.categories.Value value =
                valueRepo.findByIdIncludingDeleted(valueId);
            return value != null ? value.getName() : null;
        } catch (NumberFormatException e) {
            // If it's not a number, it might already be the name (legacy format)
            log.debug("Could not parse Value ID '{}', using as-is", valueIdStr);
            return valueIdStr;
        }
    }

    /**
     * Check if a file belongs to an active (non-deleted) FileObject at its current path.
     * Used as a safety guard before deleting files during sync operations.
     *
     * @param fileNumber the file number extracted from the file being deleted
     * @param folderPath the relative folder path (e.g., "uploads/pdf/Manuals/Acme")
     * @return the FileObject if active and path matches, null otherwise
     */
    private FileObject findActiveOwner(String fileNumber, String folderPath) {
        if (fileNumber == null || folderPath == null) return null;

        FileObject fo = fileRepo.findByFileNumber(fileNumber);
        if (fo == null) return null; // @Where filters deleted=false

        // Check if any of the FileObject's current extension folders match
        for (String ext : fo.getExtensionsArray()) {
            try {
                String currentFolder = fo.buildFolder(ext.trim());
                if (currentFolder != null && currentFolder.equals(folderPath)) {
                    return fo;
                }
            } catch (Exception e) {
                // buildFolder can NPE if fileType/vendor is null
            }
        }
        return null;
    }

    /**
     * Strip JSON quotes from a serialized string value.
     * FieldChange stores string values with JSON serialization which wraps strings in quotes.
     * E.g., "hello" becomes "\"hello\"" when serialized.
     */
    private String stripJsonQuotes(String value) {
        if (value == null) {
            return null;
        }
        // Remove leading and trailing quotes if present
        String result = value.trim();
        if (result.startsWith("\"") && result.endsWith("\"") && result.length() >= 2) {
            result = result.substring(1, result.length() - 1);
        }
        return result;
    }

    /**
     * Queue a file for upload to sync server.
     * Uses database-backed queue for persistence across restarts.
     */
    @Transactional
    public void queueFileUpload(FileObject fileObject) {
        // Check if there's already a pending upload for this entity
        boolean exists = pendingFileSyncRepository.existsByEntityIdAndDirectionAndStatusIn(
            fileObject.getId(),
            SyncDirection.UPLOAD,
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS)
        );

        if (exists) {
            log.debug("Upload already queued for FileObject #{}", fileObject.getId());
            return;
        }

        // Create persistent task
        String extensions = fileObject.getExtensionsArray() != null
            ? String.join(",", fileObject.getExtensionsArray())
            : "";

        PendingFileSync task = new PendingFileSync(
            fileObject.getId(),
            SyncDirection.UPLOAD,
            fileObject.getFileNumber(),
            extensions
        );
        task.setTargetPath(getFullPath(fileObject));

        pendingFileSyncRepository.save(task);
        log.info("Queued upload for FileObject #{} (persisted to database)", fileObject.getId());
    }

    /**
     * Queue a file for download from sync server.
     * Uses database-backed queue for persistence across restarts.
     */
    @Transactional
    public void queueFileDownload(FileObject fileObject) {
        // Validate required fields before queueing
        String fullPath = getFullPath(fileObject);
        if (fullPath == null) {
            log.debug("Cannot queue download for FileObject #{} - fileLink is not set yet", fileObject.getId());
            return;
        }

        String fileNumber = fileObject.getFileNumber();
        if (fileNumber == null || fileNumber.isEmpty()) {
            log.debug("Cannot queue download for FileObject #{} - fileNumber is not set", fileObject.getId());
            return;
        }

        // Check if there's already a pending download for this entity
        boolean exists = pendingFileSyncRepository.existsByEntityIdAndDirectionAndStatusIn(
            fileObject.getId(),
            SyncDirection.DOWNLOAD,
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS)
        );

        if (exists) {
            log.debug("Download already queued for FileObject #{}", fileObject.getId());
            return;
        }

        // Create persistent task
        String extensions = fileObject.getExtensionsArray() != null
            ? String.join(",", fileObject.getExtensionsArray())
            : "";

        PendingFileSync task = new PendingFileSync(
            fileObject.getId(),
            SyncDirection.DOWNLOAD,
            fileNumber,
            extensions,
            fullPath
        );

        pendingFileSyncRepository.save(task);
        log.info("Queued download for FileObject #{} (persisted to database)", fileObject.getId());
    }

    /**
     * Queue a file for download from sync server, with old folder to delete after download completes.
     * This is used when a Vendor or FileType name changes - the old folder contains files at the old path
     * that should only be deleted AFTER new files are successfully downloaded.
     *
     * @param fileObject the FileObject to download
     * @param oldFolderToDelete the old folder path to delete after download succeeds (can be semicolon-separated for multiple folders)
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void queueFileDownloadWithCleanup(FileObject fileObject, String oldFolderToDelete) {
        // Validate required fields before queueing
        String fullPath = getFullPath(fileObject);
        if (fullPath == null) {
            log.debug("Cannot queue download for FileObject #{} - fileLink is not set yet", fileObject.getId());
            return;
        }

        String fileNumber = fileObject.getFileNumber();
        if (fileNumber == null || fileNumber.isEmpty()) {
            log.debug("Cannot queue download for FileObject #{} - fileNumber is not set", fileObject.getId());
            return;
        }

        // Check if there's already a pending download for this entity
        Optional<PendingFileSync> existingTask = pendingFileSyncRepository.findByEntityIdAndDirectionAndStatusIn(
            fileObject.getId(),
            SyncDirection.DOWNLOAD,
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS)
        );

        if (existingTask.isPresent()) {
            // Update existing task to include the old folder to delete
            PendingFileSync task = existingTask.get();
            if (oldFolderToDelete != null && !oldFolderToDelete.isEmpty()) {
                String existing = task.getOldFolderToDelete();
                if (existing != null && !existing.isEmpty()) {
                    // Append to existing list (semicolon-separated)
                    task.setOldFolderToDelete(existing + ";" + oldFolderToDelete);
                } else {
                    task.setOldFolderToDelete(oldFolderToDelete);
                }
                pendingFileSyncRepository.save(task);
                log.debug("Updated existing download task for FileObject #{} with old folder to delete: {}",
                    fileObject.getId(), oldFolderToDelete);
            }
            return;
        }

        // Create persistent task
        String extensions = fileObject.getExtensionsArray() != null
            ? String.join(",", fileObject.getExtensionsArray())
            : "";

        PendingFileSync task = new PendingFileSync(
            fileObject.getId(),
            SyncDirection.DOWNLOAD,
            fileNumber,
            extensions,
            fullPath
        );
        task.setOldFolderToDelete(oldFolderToDelete);

        PendingFileSync savedTask = pendingFileSyncRepository.save(task);
        log.info("Queued download for FileObject #{} with cleanup of old folder: {} (persisted to database, taskId={})",
            fileObject.getId(), oldFolderToDelete, savedTask.getId());
    }

    /**
     * Process pending uploads (runs in background).
     * Uses database-backed queue with exponential backoff for retries.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 10000)
    @Transactional
    public void processUploadQueue() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        // Get pending uploads that are ready to process
        List<PendingFileSync> pendingTasks = pendingFileSyncRepository.findPendingUploads();
        if (pendingTasks.isEmpty()) {
            return;
        }

        int processed = 0;
        int maxPerBatch = 10;

        for (PendingFileSync task : pendingTasks) {
            if (processed >= maxPerBatch) {
                break;
            }

            // Skip if already being processed in-memory (prevents concurrent processing)
            String taskKey = "upload:" + task.getEntityId();
            if (!inProgressUploads.add(taskKey)) {
                continue;
            }

            try {
                // Mark as in progress
                task.markInProgress();
                pendingFileSyncRepository.save(task);

                // Perform upload
                uploadFilesToServer(task);

                // Mark as completed
                task.markCompleted();
                pendingFileSyncRepository.save(task);
                processed++;
                log.info("Successfully uploaded files for FileObject #{}", task.getEntityId());

            } catch (Exception e) {
                log.error("Failed to upload files for FileObject #{}: {}",
                    task.getEntityId(), e.getMessage());

                // Re-queue for retry with exponential backoff
                task.incrementRetry();
                if (task.getRetryCount() < MAX_RETRIES) {
                    long delay = RETRY_DELAYS_MS[Math.min(task.getRetryCount() - 1, RETRY_DELAYS_MS.length - 1)];
                    task.setStatus(SyncStatus.PENDING);
                    task.scheduleRetry(delay);
                    task.setLastError(e.getMessage());
                    pendingFileSyncRepository.save(task);
                    log.info("Scheduled retry {} for FileObject #{} upload in {}ms",
                        task.getRetryCount(), task.getEntityId(), delay);
                } else {
                    task.markFailed("Max retries exceeded: " + e.getMessage());
                    pendingFileSyncRepository.save(task);
                    log.error("Giving up on upload for FileObject #{} after {} retries",
                        task.getEntityId(), task.getRetryCount());
                }
            } finally {
                inProgressUploads.remove(taskKey);
            }
        }
    }

    /**
     * Process pending downloads (runs in background - eager download).
     * Uses database-backed queue with exponential backoff for retries.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 15000)
    @Transactional
    public void processDownloadQueue() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        // Get pending downloads that are ready to process
        List<PendingFileSync> pendingTasks = pendingFileSyncRepository.findPendingDownloads();
        if (pendingTasks.isEmpty()) {
            return;
        }

        int processed = 0;
        int maxPerBatch = 10;

        for (PendingFileSync task : pendingTasks) {
            if (processed >= maxPerBatch) {
                break;
            }

            // Skip if already being processed in-memory (prevents concurrent processing)
            String taskKey = "download:" + task.getEntityId();
            if (!inProgressDownloads.add(taskKey)) {
                continue;
            }

            try {
                // Mark as in progress
                task.markInProgress();
                pendingFileSyncRepository.save(task);

                // Perform download
                downloadFilesFromServer(task);

                // Delete old folders AFTER successful download (for vendor/fileType rename scenarios)
                deleteOldFoldersAfterDownload(task);

                // Mark as completed
                task.markCompleted();
                pendingFileSyncRepository.save(task);
                processed++;
                log.info("Successfully downloaded files for FileObject #{}", task.getEntityId());

            } catch (Exception e) {
                log.error("Failed to download files for FileObject #{}: {}",
                    task.getEntityId(), e.getMessage());

                // Re-queue for retry with exponential backoff
                task.incrementRetry();
                if (task.getRetryCount() < MAX_RETRIES) {
                    long delay = RETRY_DELAYS_MS[Math.min(task.getRetryCount() - 1, RETRY_DELAYS_MS.length - 1)];
                    task.setStatus(SyncStatus.PENDING);
                    task.scheduleRetry(delay);
                    task.setLastError(e.getMessage());
                    pendingFileSyncRepository.save(task);
                    log.info("Scheduled retry {} for FileObject #{} download in {}ms",
                        task.getRetryCount(), task.getEntityId(), delay);
                } else {
                    task.markFailed("Max retries exceeded: " + e.getMessage());
                    pendingFileSyncRepository.save(task);
                    log.error("Giving up on download for FileObject #{} after {} retries",
                        task.getEntityId(), task.getRetryCount());
                }
            } finally {
                inProgressDownloads.remove(taskKey);
            }
        }
    }

    /**
     * Periodically recover FAILED upload tasks.
     * If the file still exists on disk and the FileObject is active, reset to PENDING for retry.
     * This handles the case where uploads exhausted retries while the server was offline.
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000) // every 5 minutes, start after 1 minute
    @Transactional
    public void recoverFailedUploads() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        List<PendingFileSync> failedUploads = pendingFileSyncRepository
            .findByDirectionAndStatusIn(SyncDirection.UPLOAD, List.of(SyncStatus.FAILED));

        if (failedUploads.isEmpty()) {
            return;
        }

        int recovered = 0;
        for (PendingFileSync task : failedUploads) {
            FileObject fo = fileRepo.findById(task.getEntityId()).orElse(null);
            if (fo != null && !Boolean.TRUE.equals(fo.getDeleted()) && !getAllPhysicalFiles(fo).isEmpty()) {
                task.setStatus(SyncStatus.PENDING);
                task.setRetryCount(0);
                task.setNextRetryTime(Instant.now());
                pendingFileSyncRepository.save(task);
                recovered++;
            } else {
                // FileObject or physical files no longer exist — clean up
                task.markCompleted();
                pendingFileSyncRepository.save(task);
            }
        }

        if (recovered > 0) {
            log.info("Recovered {} failed file upload tasks for retry", recovered);
        }
    }

    /**
     * Upload files to sync server.
     */
    private void uploadFilesToServer(PendingFileSync task) throws IOException {
        FileObject fileObject = fileRepo.findById(task.getEntityId()).orElse(null);
        if (fileObject == null) {
            log.warn("FileObject #{} not found, skipping upload", task.getEntityId());
            return;
        }

        List<File> filesToUpload = getAllPhysicalFiles(fileObject);
        if (filesToUpload.isEmpty()) {
            log.debug("No physical files found for FileObject #{}", task.getEntityId());
            return;
        }

        log.info("Uploading {} files for FileObject #{}", filesToUpload.size(), task.getEntityId());

        for (File file : filesToUpload) {
            try {
                uploadSingleFile(file, "FileObject", task.getEntityId(), file.getAbsolutePath());
            } catch (Exception e) {
                log.error("Failed to upload file {}: {}", file.getName(), e.getMessage());
                throw e;  // Re-throw to trigger retry
            }
        }
    }

    /**
     * Upload a single file to sync server.
     * Package-accessible so FullSyncToServerService can use it for direct bulk uploads.
     */
    void uploadSingleFile(File file, String entityType, Long entityId, String originalPath) {
        String uploadUrl = syncConfig.getSyncServerUrl() + "/api/files/upload";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(file));
        body.add("entityType", entityType);
        body.add("entityId", entityId.toString());
        body.add("originalPath", originalPath);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                uploadUrl, HttpMethod.POST, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("Uploaded file {} for {}/{}", file.getName(), entityType, entityId);
            } else {
                log.warn("Failed to upload file {}: {}", file.getName(), response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error uploading file {}: {}", file.getName(), e.getMessage());
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Download files from sync server.
     * Throws exception on failure to trigger retry with exponential backoff.
     */
    private void downloadFilesFromServer(PendingFileSync task) {
        FileObject fileObject = fileRepo.findById(task.getEntityId()).orElse(null);
        if (fileObject == null) {
            log.warn("FileObject #{} not found, skipping download", task.getEntityId());
            return; // Don't retry if entity doesn't exist
        }

        String listUrl = syncConfig.getSyncServerUrl() +
            "/api/files/entity/FileObject/" + task.getEntityId() + "/download-info";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                listUrl, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                // Server error - throw to trigger retry
                throw new RuntimeException("Server returned " + response.getStatusCode() +
                    " when fetching file list for FileObject #" + task.getEntityId());
            }

            if (response.getBody() == null) {
                log.debug("No files found on server for FileObject #{}", task.getEntityId());
                return; // Empty response is OK - no files to download
            }

            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> files = (List<Map<String, Object>>) body.get("files");

            if (files == null || files.isEmpty()) {
                log.debug("No files to download for FileObject #{}", task.getEntityId());
                return; // No files is OK
            }

            log.info("Downloading {} files for FileObject #{}", files.size(), task.getEntityId());

            int successCount = 0;
            int failCount = 0;
            for (Map<String, Object> fileInfo : files) {
                try {
                    downloadSingleFile(fileInfo, fileObject);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    log.error("Failed to download file {}: {}", fileInfo.get("fileName"), e.getMessage());
                }
            }

            // If all downloads failed, throw to trigger retry
            if (successCount == 0 && failCount > 0) {
                throw new RuntimeException("All " + failCount + " file downloads failed for FileObject #" + task.getEntityId());
            }

            // Partial success - log but don't retry
            if (failCount > 0) {
                log.warn("Downloaded {}/{} files for FileObject #{}, {} failed",
                    successCount, files.size(), task.getEntityId(), failCount);
            }

        } catch (Exception e) {
            log.error("Error downloading files for FileObject #{}: {}", task.getEntityId(), e.getMessage());
            throw new RuntimeException("Download failed: " + e.getMessage(), e);
        }
    }

    /**
     * Download a single file from sync server.
     * Preserves the original file name including revision suffixes (e.g., -rev1, -rev2).
     * Verifies file integrity using SHA-256 hash.
     */
    private void downloadSingleFile(Map<String, Object> fileInfo, FileObject fileObject) throws IOException {
        Long fileId = ((Number) fileInfo.get("id")).longValue();
        String fileName = (String) fileInfo.get("fileName");
        String extension = (String) fileInfo.get("extension");
        String expectedHash = (String) fileInfo.get("fileHash");

        String downloadUrl = syncConfig.getSyncServerUrl() + "/api/files/download/" + fileId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        ResponseEntity<byte[]> response = restTemplate.exchange(
            downloadUrl, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IOException("Failed to download file " + fileName + ": server returned " + response.getStatusCode());
        }

        byte[] content = response.getBody();

        // Verify file integrity using SHA-256 hash
        if (expectedHash != null && !expectedHash.isEmpty()) {
            String actualHash = computeSha256Hash(content);
            if (!expectedHash.equals(actualHash)) {
                throw new IOException("File integrity check failed for " + fileName +
                    ": expected hash " + expectedHash + ", got " + actualHash);
            }
            log.debug("File integrity verified for {}", fileName);
        }

        // Determine target path using profile-specific filesRootPath
        String ext = extension != null && !extension.isEmpty() ? extension : "pdf";
        String relFolder = fileObject.buildRelativeFolder(ext);

        Path targetPath;
        if (fileName != null && !fileName.isEmpty() && relFolder != null) {
            targetPath = Paths.get(filesRootPath).resolve(relFolder).resolve(fileName);
        } else {
            // Fallback to buildFileLink with path resolution
            String fileLink = fileObject.buildFileLink(ext);
            targetPath = fileLink != null ? resolveToFileSystem(fileLink) : null;
        }

        if (targetPath == null) {
            throw new IOException("Cannot determine target path for file " + fileName);
        }

        // Create parent directories
        Files.createDirectories(targetPath.getParent());

        // Write file
        Files.write(targetPath, content);
        log.info("Downloaded file {} to {} ({} bytes)", fileName, targetPath, content.length);
    }

    /**
     * Compute SHA-256 hash of byte array.
     */
    private String computeSha256Hash(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            return null;
        }
    }

    /**
     * Get all physical files for a FileObject (all extensions and revisions).
     * Package-accessible so FullSyncToServerService can use it for direct bulk uploads.
     */
    List<File> getAllPhysicalFiles(FileObject fileObject) {
        List<File> files = new ArrayList<>();

        for (String extension : fileObject.getExtensionsArray()) {
            String relFolder = fileObject.buildRelativeFolder(extension);
            if (relFolder == null) continue;
            Path folder = Paths.get(filesRootPath).resolve(relFolder);
            if (Files.exists(folder)) {
                List<File> extensionFiles = FileUtil.getRevisionsByFileNumber(
                    fileObject.getFileNumber(), folder.toString());
                files.addAll(extensionFiles);
            }
        }

        return files;
    }

    /**
     * Get full path for a FileObject.
     * Returns null if fileLink is not set.
     * Uses getStoredFileLink() to get the actual persisted path, not the dynamically-rebuilt one.
     * This is important for sync scenarios where the stored path is the correct destination.
     */
    private String getFullPath(FileObject fileObject) {
        // Use stored fileLink, not the dynamically-rebuilt one from getFileLink()
        // The stored value is set during sync and represents the correct path
        String fileLink = fileObject.getStoredFileLink();
        if (fileLink == null || fileLink.isEmpty()) {
            // Fallback to dynamic link if stored is empty
            fileLink = fileObject.getFileLink();
        }
        if (fileLink == null || fileLink.isEmpty()) {
            return null;
        }
        // Resolve against profile-specific filesRootPath (strip baseLink prefix)
        return resolveToFileSystem(fileLink).toString();
    }

    private record FileObjectSnapshot(
        Long id,
        String fileNumber,
        String fileTypeName,
        String vendorName,
        List<String> extensions,
        String oldFileLink
    ) {}

    /**
     * Event for FileObject sync changes.
     * Published when sync applies changes to FileObject entities.
     */
    public static class FileObjectSyncEvent {
        private final List<FieldChange> changes;
        private final String source; // "local" or "sync"

        public FileObjectSyncEvent(List<FieldChange> changes, String source) {
            this.changes = changes;
            this.source = source;
        }

        public List<FieldChange> getChanges() {
            return changes;
        }

        public String getSource() {
            return source;
        }
    }

    /**
     * Get queue statistics.
     */
    public Map<String, Object> getQueueStats() {
        long pendingUploads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.UPLOAD, List.of(SyncStatus.PENDING));
        long pendingDownloads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.DOWNLOAD, List.of(SyncStatus.PENDING));
        long failedUploads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.UPLOAD, List.of(SyncStatus.FAILED));
        long failedDownloads = pendingFileSyncRepository.countByDirectionAndStatusIn(
            SyncDirection.DOWNLOAD, List.of(SyncStatus.FAILED));

        return Map.of(
            "pendingUploads", pendingUploads,
            "pendingDownloads", pendingDownloads,
            "failedUploads", failedUploads,
            "failedDownloads", failedDownloads,
            "inProgressUploads", inProgressUploads.size(),
            "inProgressDownloads", inProgressDownloads.size()
        );
    }
}
