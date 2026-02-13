package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubStoredBackup;
import com.dk_power.power_plant_java.repository.hub.HubStoredBackupRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Service for storing and retrieving client-uploaded H2 database backups.
 * Clients upload their backups to the hub; other clients download them for full resync.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubBackupStorageService {

    private final HubStoredBackupRepository backupRepository;

    @Value("${sync.backup.storage-path:./backup-storage}")
    private String backupStoragePath;

    @Value("${sync.backup.max-backups:5}")
    private int maxBackups;

    private Path rootPath;

    public HubBackupStorageService(HubStoredBackupRepository backupRepository) {
        this.backupRepository = backupRepository;
    }

    @PostConstruct
    public void init() throws IOException {
        rootPath = Paths.get(backupStoragePath).toAbsolutePath().normalize();
        Files.createDirectories(rootPath);
        log.info("Hub backup storage initialized at: {}", rootPath);
    }

    @Transactional
    public HubStoredBackup storeBackup(MultipartFile backupFile, String machineId, String machineName)
            throws IOException {
        if (backupFile.isEmpty()) {
            throw new IllegalArgumentException("Backup file is empty");
        }
        return storeBackup(backupFile.getBytes(), machineId, machineName);
    }

    @Transactional
    public HubStoredBackup storeBackup(byte[] content, String machineId, String machineName)
            throws IOException {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Backup content is empty");
        }

        String checksum = calculateChecksum(content);

        Optional<HubStoredBackup> existing = backupRepository.findByChecksum(checksum);
        if (existing.isPresent()) {
            HubStoredBackup backup = existing.get();
            backup.setUploadedAt(Instant.now());
            backup.setOriginMachineId(machineId);
            backup.setOriginMachineName(machineName);
            return backupRepository.save(backup);
        }

        String filename = "backup_" + System.currentTimeMillis() + ".zip";
        Path targetPath = rootPath.resolve(filename);
        Files.write(targetPath, content);

        HubStoredBackup backup = HubStoredBackup.builder()
            .filename(filename)
            .storagePath(targetPath.toString())
            .fileSize((long) content.length)
            .checksum(checksum)
            .originMachineId(machineId)
            .originMachineName(machineName)
            .uploadedAt(Instant.now())
            .build();

        backup = backupRepository.save(backup);
        log.info("Stored client backup from {} ({}): {} bytes", machineName, machineId, content.length);

        cleanupOldBackups();
        return backup;
    }

    public Optional<HubStoredBackup> getLatestBackup() {
        return backupRepository.findTopByOrderByUploadedAtDesc();
    }

    public Resource loadBackupAsResource(Long backupId) throws IOException {
        HubStoredBackup backup = backupRepository.findById(backupId)
            .orElseThrow(() -> new IllegalArgumentException("Backup not found: " + backupId));
        return loadBackupAsResource(backup);
    }

    public Resource loadLatestBackupAsResource() throws IOException {
        HubStoredBackup backup = getLatestBackup()
            .orElseThrow(() -> new IllegalArgumentException("No backups available"));
        return loadBackupAsResource(backup);
    }

    public Resource loadBackupAsResource(HubStoredBackup backup) throws IOException {
        Path filePath = Paths.get(backup.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new IOException("Backup file not found on disk: " + backup.getStoragePath());
        }
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IOException("Could not read backup file: " + backup.getStoragePath());
        } catch (MalformedURLException e) {
            throw new IOException("Invalid backup file path: " + backup.getStoragePath(), e);
        }
    }

    public BackupHealth getHealth() {
        Optional<HubStoredBackup> latest = getLatestBackup();
        long totalBackups = backupRepository.count();

        if (latest.isEmpty()) {
            return new BackupHealth(false, 0, null, null, null, 0L, "No backups available");
        }

        HubStoredBackup backup = latest.get();
        return new BackupHealth(
            true, totalBackups,
            backup.getUploadedAt(),
            backup.getOriginMachineId(),
            backup.getOriginMachineName(),
            backup.getFileSize(),
            null
        );
    }

    @Transactional
    public void cleanupOldBackups() {
        long count = backupRepository.count();
        if (count <= maxBackups) return;

        var oldBackups = backupRepository.findOldBackups(maxBackups);
        for (HubStoredBackup backup : oldBackups) {
            try {
                Path filePath = Paths.get(backup.getStoragePath());
                Files.deleteIfExists(filePath);
                backupRepository.delete(backup);
                log.info("Deleted old backup: {}", backup.getFilename());
            } catch (IOException e) {
                log.warn("Failed to delete old backup file: {}", backup.getStoragePath());
            }
        }
    }

    private String calculateChecksum(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content));
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record BackupHealth(
        boolean available, long totalBackups,
        Instant lastBackupTime, String lastBackupMachineId,
        String lastBackupMachineName, Long lastBackupSize,
        String errorMessage
    ) {}
}
