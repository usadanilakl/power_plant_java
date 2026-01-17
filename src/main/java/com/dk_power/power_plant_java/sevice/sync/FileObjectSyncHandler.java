package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.util.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

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

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    // Retry configuration with exponential backoff
    private static final int MAX_RETRIES = 5;
    private static final long[] RETRY_DELAYS_MS = {1000, 2000, 4000, 8000, 16000};

    // Queue of files waiting to be uploaded to sync server
    private final ConcurrentLinkedQueue<FileUploadTask> uploadQueue = new ConcurrentLinkedQueue<>();

    // Queue of files waiting to be downloaded from sync server
    private final ConcurrentLinkedQueue<FileDownloadTask> downloadQueue = new ConcurrentLinkedQueue<>();

    // Track in-progress operations to avoid duplicates
    private final Set<String> inProgressUploads = ConcurrentHashMap.newKeySet();
    private final Set<String> inProgressDownloads = ConcurrentHashMap.newKeySet();

    // Track old file paths when entity is being modified (for move operations)
    private final Map<Long, FileObjectSnapshot> entitySnapshots = new ConcurrentHashMap<>();

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
     */
    @Async
    @EventListener
    public void onSyncChangesApplied(FileObjectSyncEvent event) {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        log.info("Processing {} FileObject sync changes", event.getChanges().size());

        // Group changes by entity ID to handle all path changes together
        Map<Long, List<FieldChange>> changesByEntity = event.getChanges().stream()
            .filter(c -> "FileObject".equals(c.getEntityType()))
            .collect(java.util.stream.Collectors.groupingBy(FieldChange::getEntityId));

        for (Map.Entry<Long, List<FieldChange>> entry : changesByEntity.entrySet()) {
            Long entityId = entry.getKey();
            List<FieldChange> entityChanges = entry.getValue();

            try {
                processIncomingSyncChanges(entityId, entityChanges);
            } catch (Exception e) {
                log.error("Error processing sync changes for FileObject #{}: {}",
                    entityId, e.getMessage(), e);
            }
        }
    }

    /**
     * Process all incoming sync changes for a single FileObject.
     * Handles multiple path-affecting changes together to correctly reconstruct old paths.
     */
    private void processIncomingSyncChanges(Long entityId, List<FieldChange> changes) {
        // Check for entity-level changes first
        FieldChange entityChange = changes.stream()
            .filter(c -> "_entity_".equals(c.getFieldName()))
            .findFirst().orElse(null);

        if (entityChange != null) {
            if (entityChange.getChangeType() == FieldChange.ChangeType.CREATE) {
                FileObject fileObject = fileRepo.findById(entityId).orElse(null);
                if (fileObject != null) {
                    queueFileDownload(fileObject);
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

        // If there are path-affecting changes, handle them together
        if (!pathChanges.isEmpty()) {
            handleIncomingPathChanges(fileObject, pathChanges);
        }

        // Download files if path changed or content changed
        if (!pathChanges.isEmpty() || hasContentChange) {
            queueFileDownload(fileObject);
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
     * We need to delete the old files before downloading new ones.
     *
     * By handling all changes together, we can correctly reconstruct the OLD path
     * using all the old values, not mixing old and new.
     */
    private void handleIncomingPathChanges(FileObject fileObject, Map<String, FieldChange> pathChanges) {
        log.info("Incoming path changes for FileObject #{}: {}", fileObject.getId(),
            pathChanges.keySet());

        // Delete old files using the combined old values
        deleteOldFilesAfterPathChanges(fileObject, pathChanges);
    }

    /**
     * Delete old files when path-affecting fields change from sync.
     * Reconstructs the complete old path using ALL old field values together.
     * Handles all extensions and revision files.
     */
    private void deleteOldFilesAfterPathChanges(FileObject fileObject, Map<String, FieldChange> pathChanges) {
        if (pathChanges.isEmpty()) {
            return;
        }

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
                oldFileNumber = pathChanges.get("fileNumber").getOldValue();
            }
            if (pathChanges.containsKey("fileType")) {
                oldFileType = pathChanges.get("fileType").getOldValue();
            }
            if (pathChanges.containsKey("vendor")) {
                oldVendor = pathChanges.get("vendor").getOldValue();
            }
            if (pathChanges.containsKey("extension")) {
                // Parse old extensions - could be comma-separated or single value
                String oldExtValue = pathChanges.get("extension").getOldValue();
                if (oldExtValue != null && !oldExtValue.isEmpty()) {
                    oldExtensions = Arrays.asList(oldExtValue.split(","));
                }
            }

            log.debug("Old path components: fileNumber={}, fileType={}, vendor={}, extensions={}",
                oldFileNumber, oldFileType, oldVendor, oldExtensions);

            // Delete old files for EACH OLD extension (not current!)
            for (String extension : oldExtensions) {
                String trimmedExt = extension.trim();
                if (trimmedExt.isEmpty()) continue;

                // Build old folder path: uploads/{extension}/{fileType}/{vendor}
                String oldFolder = String.format("uploads/%s/%s/%s",
                    trimmedExt,
                    oldFileType != null ? oldFileType : "",
                    oldVendor != null ? oldVendor : "");

                Path oldFolderPath = Paths.get(projectRootPath, oldFolder);

                if (Files.exists(oldFolderPath)) {
                    // Find files matching the old file number (including revisions like -rev1, -rev2)
                    List<File> oldFiles = FileUtil.getRevisionsByFileNumber(oldFileNumber, oldFolderPath.toString());

                    log.debug("Found {} old files in {} for fileNumber {}",
                        oldFiles.size(), oldFolderPath, oldFileNumber);

                    for (File oldFile : oldFiles) {
                        try {
                            Files.deleteIfExists(oldFile.toPath());
                            log.info("Deleted old file after path change: {}", oldFile.getAbsolutePath());
                        } catch (IOException e) {
                            log.warn("Failed to delete old file {}: {}", oldFile.getAbsolutePath(), e.getMessage());
                        }
                    }

                    // Try to clean up empty directories
                    cleanupEmptyDirectories(oldFolderPath);
                }
            }
        } catch (Exception e) {
            log.error("Error deleting old files for FileObject #{}: {}", fileObject.getId(), e.getMessage());
        }
    }

    /**
     * Clean up empty directories after file deletion.
     */
    private void cleanupEmptyDirectories(Path directory) {
        try {
            Path uploadsRoot = Paths.get(projectRootPath, "uploads");
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
     * Queue a file for upload to sync server.
     */
    private void queueFileUpload(FileObject fileObject) {
        String taskKey = "upload:" + fileObject.getId();
        if (!inProgressUploads.add(taskKey)) {
            log.debug("Upload already in progress for FileObject #{}", fileObject.getId());
            return;
        }

        FileUploadTask task = new FileUploadTask(
            fileObject.getId(),
            fileObject.getFileNumber(),
            fileObject.getExtensionsArray(),
            getFullPath(fileObject)
        );
        uploadQueue.add(task);
        log.debug("Queued upload for FileObject #{}", fileObject.getId());
    }

    /**
     * Queue a file for download from sync server.
     */
    private void queueFileDownload(FileObject fileObject) {
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

        String taskKey = "download:" + fileObject.getId();
        if (!inProgressDownloads.add(taskKey)) {
            log.debug("Download already in progress for FileObject #{}", fileObject.getId());
            return;
        }

        FileDownloadTask task = new FileDownloadTask(
            fileObject.getId(),
            fileNumber,
            fileObject.getExtensionsArray(),
            fullPath
        );
        downloadQueue.add(task);
        log.debug("Queued download for FileObject #{}", fileObject.getId());
    }

    /**
     * Process pending uploads (runs in background).
     * Uses exponential backoff for retries.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 10000)
    public void processUploadQueue() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        List<FileUploadTask> deferredTasks = new ArrayList<>();
        FileUploadTask task;
        int processed = 0;

        while ((task = uploadQueue.poll()) != null && processed < 10) {
            // Check if task is ready for retry (respects backoff delay)
            if (!task.isReadyForRetry()) {
                deferredTasks.add(task);
                continue;
            }

            try {
                uploadFilesToServer(task);
                processed++;
            } catch (Exception e) {
                log.error("Failed to upload files for FileObject #{}: {}",
                    task.entityId, e.getMessage());
                // Re-queue for retry with exponential backoff
                if (task.retryCount < MAX_RETRIES) {
                    long delay = RETRY_DELAYS_MS[Math.min(task.retryCount, RETRY_DELAYS_MS.length - 1)];
                    task.retryCount++;
                    task.scheduleRetry(delay);
                    deferredTasks.add(task);
                    log.info("Scheduled retry {} for FileObject #{} upload in {}ms",
                        task.retryCount, task.entityId, delay);
                } else {
                    log.error("Giving up on upload for FileObject #{} after {} retries",
                        task.entityId, task.retryCount);
                    inProgressUploads.remove("upload:" + task.entityId);
                }
            }
        }

        // Re-add deferred tasks back to queue
        uploadQueue.addAll(deferredTasks);

        // Clean up completed uploads
        if (processed > 0) {
            // Only remove from inProgress after successful processing
            // Failed tasks remain tracked until max retries exceeded
        }
    }

    /**
     * Process pending downloads (runs in background - eager download).
     * Uses exponential backoff for retries.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 15000)
    public void processDownloadQueue() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        List<FileDownloadTask> deferredTasks = new ArrayList<>();
        FileDownloadTask task;
        int processed = 0;

        while ((task = downloadQueue.poll()) != null && processed < 10) {
            // Check if task is ready for retry (respects backoff delay)
            if (!task.isReadyForRetry()) {
                deferredTasks.add(task);
                continue;
            }

            try {
                downloadFilesFromServer(task);
                processed++;
                inProgressDownloads.remove("download:" + task.entityId);
            } catch (Exception e) {
                log.error("Failed to download files for FileObject #{}: {}",
                    task.entityId, e.getMessage());
                // Re-queue for retry with exponential backoff
                if (task.retryCount < MAX_RETRIES) {
                    long delay = RETRY_DELAYS_MS[Math.min(task.retryCount, RETRY_DELAYS_MS.length - 1)];
                    task.retryCount++;
                    task.scheduleRetry(delay);
                    deferredTasks.add(task);
                    log.info("Scheduled retry {} for FileObject #{} download in {}ms",
                        task.retryCount, task.entityId, delay);
                } else {
                    log.error("Giving up on download for FileObject #{} after {} retries",
                        task.entityId, task.retryCount);
                    inProgressDownloads.remove("download:" + task.entityId);
                }
            }
        }

        // Re-add deferred tasks back to queue
        downloadQueue.addAll(deferredTasks);
    }

    /**
     * Upload files to sync server.
     */
    private void uploadFilesToServer(FileUploadTask task) throws IOException {
        FileObject fileObject = fileRepo.findById(task.entityId).orElse(null);
        if (fileObject == null) {
            log.warn("FileObject #{} not found, skipping upload", task.entityId);
            return;
        }

        List<File> filesToUpload = getAllPhysicalFiles(fileObject);
        if (filesToUpload.isEmpty()) {
            log.debug("No physical files found for FileObject #{}", task.entityId);
            return;
        }

        log.info("Uploading {} files for FileObject #{}", filesToUpload.size(), task.entityId);

        String uploadUrl = syncConfig.getSyncServerUrl() + "/api/files/upload-multiple";

        for (File file : filesToUpload) {
            try {
                uploadSingleFile(file, "FileObject", task.entityId, file.getAbsolutePath());
            } catch (Exception e) {
                log.error("Failed to upload file {}: {}", file.getName(), e.getMessage());
            }
        }
    }

    /**
     * Upload a single file to sync server.
     */
    private void uploadSingleFile(File file, String entityType, Long entityId, String originalPath) {
        String uploadUrl = syncConfig.getSyncServerUrl() + "/api/files/upload";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Machine-Id", syncConfig.getMachineId());

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
    private void downloadFilesFromServer(FileDownloadTask task) {
        FileObject fileObject = fileRepo.findById(task.entityId).orElse(null);
        if (fileObject == null) {
            log.warn("FileObject #{} not found, skipping download", task.entityId);
            return; // Don't retry if entity doesn't exist
        }

        String listUrl = syncConfig.getSyncServerUrl() +
            "/api/files/entity/FileObject/" + task.entityId + "/download-info";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                listUrl, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                // Server error - throw to trigger retry
                throw new RuntimeException("Server returned " + response.getStatusCode() +
                    " when fetching file list for FileObject #" + task.entityId);
            }

            if (response.getBody() == null) {
                log.debug("No files found on server for FileObject #{}", task.entityId);
                return; // Empty response is OK - no files to download
            }

            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> files = (List<Map<String, Object>>) body.get("files");

            if (files == null || files.isEmpty()) {
                log.debug("No files to download for FileObject #{}", task.entityId);
                return; // No files is OK
            }

            log.info("Downloading {} files for FileObject #{}", files.size(), task.entityId);

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
                throw new RuntimeException("All " + failCount + " file downloads failed for FileObject #" + task.entityId);
            }

            // Partial success - log but don't retry
            if (failCount > 0) {
                log.warn("Downloaded {}/{} files for FileObject #{}, {} failed",
                    successCount, files.size(), task.entityId, failCount);
            }

        } catch (Exception e) {
            log.error("Error downloading files for FileObject #{}: {}", task.entityId, e.getMessage());
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

        // Determine target path
        // Use the folder from FileObject but preserve the exact fileName from server
        // This ensures revision files (-rev1, -rev2) are saved with correct names
        String ext = extension != null && !extension.isEmpty() ? extension : "pdf";
        String folder = fileObject.buildFolder(ext);

        Path targetPath;
        if (fileName != null && !fileName.isEmpty()) {
            // Use exact fileName from server (includes revision suffix)
            targetPath = Paths.get(projectRootPath, folder, fileName);
        } else {
            // Fallback to buildFileLink if no fileName provided
            targetPath = Paths.get(projectRootPath, fileObject.buildFileLink(ext));
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
     */
    private List<File> getAllPhysicalFiles(FileObject fileObject) {
        List<File> files = new ArrayList<>();

        for (String extension : fileObject.getExtensionsArray()) {
            Path folder = Paths.get(projectRootPath, fileObject.buildFolder(extension));
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
     */
    private String getFullPath(FileObject fileObject) {
        String fileLink = fileObject.getFileLink();
        if (fileLink == null || fileLink.isEmpty()) {
            return null;
        }
        return Paths.get(projectRootPath, fileLink).toString();
    }

    // Task records with retry support
    private static class FileUploadTask {
        final Long entityId;
        final String fileNumber;
        final List<String> extensions;
        final String basePath;
        int retryCount = 0;
        Instant nextRetryTime = Instant.MIN; // Can be processed immediately

        FileUploadTask(Long entityId, String fileNumber, List<String> extensions, String basePath) {
            this.entityId = entityId;
            this.fileNumber = fileNumber;
            this.extensions = new ArrayList<>(extensions);
            this.basePath = basePath;
        }

        void scheduleRetry(long delayMs) {
            this.nextRetryTime = Instant.now().plusMillis(delayMs);
        }

        boolean isReadyForRetry() {
            return Instant.now().isAfter(nextRetryTime);
        }
    }

    private static class FileDownloadTask {
        final Long entityId;
        final String fileNumber;
        final List<String> extensions;
        final String basePath;
        int retryCount = 0;
        Instant nextRetryTime = Instant.MIN; // Can be processed immediately

        FileDownloadTask(Long entityId, String fileNumber, List<String> extensions, String basePath) {
            this.entityId = entityId;
            this.fileNumber = fileNumber;
            this.extensions = new ArrayList<>(extensions);
            this.basePath = basePath;
        }

        void scheduleRetry(long delayMs) {
            this.nextRetryTime = Instant.now().plusMillis(delayMs);
        }

        boolean isReadyForRetry() {
            return Instant.now().isAfter(nextRetryTime);
        }
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
        return Map.of(
            "pendingUploads", uploadQueue.size(),
            "pendingDownloads", downloadQueue.size(),
            "inProgressUploads", inProgressUploads.size(),
            "inProgressDownloads", inProgressDownloads.size()
        );
    }
}
