package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import lombok.extern.slf4j.Slf4j;
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
 * Stores files on disk and tracks which clients have downloaded them.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubFileService {

    private final HubSyncedFileRepository syncedFileRepository;
    private final HubSyncConfig hubSyncConfig;

    public HubFileService(HubSyncedFileRepository syncedFileRepository, HubSyncConfig hubSyncConfig) {
        this.syncedFileRepository = syncedFileRepository;
        this.hubSyncConfig = hubSyncConfig;
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

        // Store on disk: {storagePath}/{entityType}/{entityId}/{hash}.{ext}
        Path storageDir = Path.of(hubSyncConfig.getFileStoragePath(), entityType, String.valueOf(entityId));
        Files.createDirectories(storageDir);

        String storedFileName = hash + (extension.isEmpty() ? "" : "." + extension);
        Path filePath = storageDir.resolve(storedFileName);
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

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record FileStoreResult(HubSyncedFile syncedFile, boolean isNewFile) {}

    public record StorageStats(long totalBytesUsed, long totalFiles) {}
}
