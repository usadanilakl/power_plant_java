package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * File storage and tracking service for hub mode.
 * Stores files in the profile-specific uploads directory (files.root.path)
 * and tracks which clients have downloaded them via HubSyncedFile records.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubFileService {

    private final HubSyncedFileRepository syncedFileRepository;

    @Value("${files.root.path}")
    private String filesRootPath;

    public HubFileService(HubSyncedFileRepository syncedFileRepository) {
        this.syncedFileRepository = syncedFileRepository;
    }

    /**
     * Store a file and create a tracking record.
     * Returns a result indicating whether this is a new file or duplicate.
     */
    @Transactional
    public FileStoreResult storeFile(MultipartFile file, String entityType, Long entityId,
                                      String originalPath, String machineId) throws IOException {
        byte[] content = file.getBytes();
        String hash = computeSha256(content);

        // Check for duplicate by hash + entity
        Optional<HubSyncedFile> existing = syncedFileRepository
            .findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(hash, entityType, entityId);

        if (existing.isPresent()) {
            HubSyncedFile existingFile = existing.get();
            existingFile.addSyncedMachine(machineId);
            syncedFileRepository.save(existingFile);
            return new FileStoreResult(existingFile, false);
        }

        // Determine file info
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1);
        }

        // Store in profile-specific uploads directory using original path structure
        String relativePath = extractRelativePath(originalPath, originalFilename, entityType, entityId);
        Path filePath = Path.of(filesRootPath).resolve(relativePath);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, content);

        // Create tracking record
        HubSyncedFile syncedFile = new HubSyncedFile();
        syncedFile.setEntityType(entityType);
        syncedFile.setEntityId(entityId);
        syncedFile.setOriginalPath(originalPath);
        syncedFile.setStoragePath(filePath.toString());
        syncedFile.setFileName(originalFilename);
        syncedFile.setExtension(extension);
        syncedFile.setFileSize(file.getSize());
        syncedFile.setFileHash(hash);
        syncedFile.setContentType(file.getContentType());
        syncedFile.setOriginMachineId(machineId);
        syncedFile.setUploadedAt(Instant.now());
        syncedFile.addSyncedMachine(machineId); // Origin already has the file

        syncedFile = syncedFileRepository.save(syncedFile);

        log.info("Stored file: {} ({} bytes) for {}/{} from {}",
            originalFilename, file.getSize(), entityType, entityId, machineId);

        return new FileStoreResult(syncedFile, true);
    }

    /**
     * Load a file for a client and mark it as synced.
     */
    @Transactional
    public Resource loadFileForClient(Long fileId, String machineId) throws IOException {
        HubSyncedFile syncedFile = syncedFileRepository.findById(fileId)
            .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));

        if (syncedFile.isDeleted()) {
            throw new IllegalArgumentException("File has been deleted: " + fileId);
        }

        Path filePath = Path.of(syncedFile.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new IOException("File not found on disk: " + filePath);
        }

        // Mark as synced to requesting client
        syncedFile.addSyncedMachine(machineId);
        syncedFileRepository.save(syncedFile);

        return new FileSystemResource(filePath);
    }

    public Optional<HubSyncedFile> getFileById(Long fileId) {
        return syncedFileRepository.findById(fileId);
    }

    public List<HubSyncedFile> getFilesNotSyncedTo(String machineId) {
        return syncedFileRepository.findFilesNotSyncedTo(machineId);
    }

    public long countFilesPendingFor(String machineId) {
        return syncedFileRepository.countFilesPendingFor(machineId);
    }

    public List<HubSyncedFile> getFilesForEntity(String entityType, Long entityId) {
        return syncedFileRepository.findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId);
    }

    @Transactional
    public int deleteFilesForEntity(String entityType, Long entityId) {
        List<HubSyncedFile> files = syncedFileRepository
            .findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId);
        int count = 0;
        for (HubSyncedFile file : files) {
            file.setDeleted(true);
            file.setDeletedAt(Instant.now());
            syncedFileRepository.save(file);
            count++;
        }
        return count;
    }

    public StorageStats getStats() {
        Long totalBytes = syncedFileRepository.totalStorageUsed();
        long totalFiles = syncedFileRepository.count();
        return new StorageStats(totalBytes != null ? totalBytes : 0, totalFiles);
    }

    /**
     * Extract the relative path within the uploads directory from an original absolute path.
     * Handles profile-specific prefixes (uploads-prod, uploads-dev, uploads-test, uploads)
     * and both / and \ separators (Windows paths from clients).
     * Falls back to {entityType}/{entityId}/{filename} if no uploads prefix is found.
     */
    String extractRelativePath(String originalPath, String originalFilename,
                                       String entityType, Long entityId) {
        if (originalPath != null && !originalPath.isEmpty()) {
            // Normalize separators to forward slash for matching
            String normalized = originalPath.replace('\\', '/');

            // Check for known uploads prefixes (longer first to avoid partial match)
            String[] prefixes = {"uploads-prod/", "uploads-dev/", "uploads-test/", "uploads/"};
            for (String prefix : prefixes) {
                int idx = normalized.indexOf(prefix);
                if (idx >= 0) {
                    String relative = normalized.substring(idx + prefix.length());
                    if (!relative.isEmpty()) {
                        return relative;
                    }
                }
            }
        }

        // Fallback: use entityType/entityId/filename structure
        String filename = (originalFilename != null && !originalFilename.isEmpty())
            ? originalFilename : "file";
        return entityType + "/" + entityId + "/" + filename;
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Register a local file already on the hub's filesystem into HubSyncedFile.
     * Used when the hub creates FileObjects locally (via web UI) —
     * the file already exists on disk, we just need a tracking record
     * so clients can discover and download it.
     */
    @Transactional
    public HubSyncedFile registerLocalFile(java.io.File file, String entityType, Long entityId,
                                            String originalPath, String machineId) throws IOException {
        byte[] content = Files.readAllBytes(file.toPath());
        String hash = computeSha256(content);

        // Dedup: skip if same hash already tracked for this entity
        Optional<HubSyncedFile> existing = syncedFileRepository
            .findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(hash, entityType, entityId);

        if (existing.isPresent()) {
            HubSyncedFile existingFile = existing.get();
            existingFile.addSyncedMachine(machineId);
            syncedFileRepository.save(existingFile);
            log.debug("[Hub File] Duplicate skipped: {} for {}/{}", file.getName(), entityType, entityId);
            return existingFile;
        }

        String fileName = file.getName();
        String extension = "";
        if (fileName.contains(".")) {
            extension = fileName.substring(fileName.lastIndexOf('.') + 1);
        }

        HubSyncedFile syncedFile = new HubSyncedFile();
        syncedFile.setEntityType(entityType);
        syncedFile.setEntityId(entityId);
        syncedFile.setOriginalPath(originalPath);
        syncedFile.setStoragePath(file.getAbsolutePath());
        syncedFile.setFileName(fileName);
        syncedFile.setExtension(extension);
        syncedFile.setFileSize(file.length());
        syncedFile.setFileHash(hash);
        syncedFile.setContentType(Files.probeContentType(file.toPath()));
        syncedFile.setOriginMachineId(machineId);
        syncedFile.setUploadedAt(Instant.now());
        syncedFile.addSyncedMachine(machineId);

        syncedFile = syncedFileRepository.save(syncedFile);
        log.info("[Hub File] Registered local file: {} ({} bytes) for {}/{}",
            fileName, file.length(), entityType, entityId);

        return syncedFile;
    }

    public record FileStoreResult(HubSyncedFile syncedFile, boolean isNewFile) {}

    public record StorageStats(long totalBytesUsed, long totalFiles) {}
}
