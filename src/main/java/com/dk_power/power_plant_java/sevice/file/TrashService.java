package com.dk_power.power_plant_java.sevice.file;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for staged file deletion (trash system).
 *
 * Instead of immediately deleting files, moves them to a .trash folder
 * with metadata. Files are retained for a configurable period before
 * permanent deletion.
 *
 * Directory structure:
 * uploads/.trash/
 *   manifest.json           - Index of all trashed items
 *   {uuid}/
 *     metadata.json         - Original path, deletion time, source
 *     {original-filename}   - The actual file
 */
@Service
@Slf4j
public class TrashService {

    @Value("${files.root.path:uploads}")
    private String uploadsPath;

    @Value("${files.trash.retention.days:14}")
    private int retentionDays;

    private static final String TRASH_FOLDER = ".trash";
    private static final String MANIFEST_FILE = "manifest.json";
    private static final String METADATA_FILE = "metadata.json";

    private final ObjectMapper objectMapper;

    public TrashService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Move a file to trash instead of deleting it.
     *
     * @param filePath Path to the file to trash
     * @param source Who initiated the deletion: "user", "sync", "cleanup"
     * @return TrashEntry with details about the trashed file, or null if file doesn't exist
     */
    public TrashEntry moveToTrash(Path filePath, String source) throws IOException {
        if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
            return null;
        }

        String id = UUID.randomUUID().toString();
        Path trashDir = getTrashPath().resolve(id);
        Files.createDirectories(trashDir);

        // Get relative path from uploads root
        Path uploadsRoot = Paths.get(uploadsPath);
        String originalRelativePath;
        try {
            originalRelativePath = uploadsRoot.relativize(filePath).toString().replace('\\', '/');
        } catch (IllegalArgumentException e) {
            // File is outside uploads root - use absolute path
            originalRelativePath = filePath.toAbsolutePath().toString();
        }

        long fileSize = Files.size(filePath);

        // Move file to trash folder
        Path trashedFile = trashDir.resolve(filePath.getFileName());
        Files.move(filePath, trashedFile, StandardCopyOption.REPLACE_EXISTING);

        // Create entry
        TrashEntry entry = new TrashEntry();
        entry.setId(id);
        entry.setOriginalPath(originalRelativePath);
        entry.setFileName(filePath.getFileName().toString());
        entry.setDeletedAt(Instant.now());
        entry.setDeletedBy(source);
        entry.setFileSize(fileSize);
        entry.setCanRestore(true);

        // Save metadata
        Path metadataPath = trashDir.resolve(METADATA_FILE);
        objectMapper.writerWithDefaultPrettyPrinter()
            .writeValue(metadataPath.toFile(), entry);

        // Update manifest
        updateManifest(entry, true);

        log.info("Moved to trash: {} -> {} (source: {})", originalRelativePath, id, source);
        return entry;
    }

    /**
     * Restore a file from trash to its original location.
     *
     * @param trashId The trash entry ID
     * @return true if restored successfully, false if not found or can't restore
     */
    public boolean restore(String trashId) throws IOException {
        TrashEntry entry = getEntry(trashId);
        if (entry == null || !entry.isCanRestore()) {
            return false;
        }

        Path trashDir = getTrashPath().resolve(trashId);
        Path trashedFile = trashDir.resolve(entry.getFileName());

        if (!Files.exists(trashedFile)) {
            log.warn("Trashed file not found: {}", trashedFile);
            // Clean up the entry since the file is gone
            deleteTrashEntry(trashId);
            return false;
        }

        Path originalPath = Paths.get(uploadsPath).resolve(entry.getOriginalPath());

        // Create parent directories if needed
        Files.createDirectories(originalPath.getParent());

        // Move file back
        Files.move(trashedFile, originalPath, StandardCopyOption.REPLACE_EXISTING);

        // Clean up trash entry
        deleteTrashEntry(trashId);

        log.info("Restored from trash: {} -> {}", trashId, entry.getOriginalPath());
        return true;
    }

    /**
     * Permanently delete a trash entry.
     *
     * @param trashId The trash entry ID
     * @return true if deleted, false if not found
     */
    public boolean permanentlyDelete(String trashId) throws IOException {
        Path trashDir = getTrashPath().resolve(trashId);
        if (!Files.exists(trashDir)) {
            // Still try to remove from manifest in case of orphaned entry
            updateManifest(trashId, false);
            return false;
        }

        // Delete recursively
        Files.walkFileTree(trashDir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                Files.delete(dir);
                return FileVisitResult.CONTINUE;
            }
        });

        updateManifest(trashId, false);
        log.info("Permanently deleted from trash: {}", trashId);
        return true;
    }

    /**
     * Get all trash entries.
     */
    public List<TrashEntry> listTrash() throws IOException {
        Path manifestPath = getTrashPath().resolve(MANIFEST_FILE);
        if (!Files.exists(manifestPath)) {
            return new ArrayList<>();
        }

        TrashManifest manifest = objectMapper.readValue(
            manifestPath.toFile(), TrashManifest.class);
        return manifest.getEntries() != null ? manifest.getEntries() : new ArrayList<>();
    }

    /**
     * Get a specific trash entry.
     */
    public TrashEntry getEntry(String trashId) throws IOException {
        Path metadataPath = getTrashPath().resolve(trashId).resolve(METADATA_FILE);
        if (!Files.exists(metadataPath)) {
            return null;
        }
        return objectMapper.readValue(metadataPath.toFile(), TrashEntry.class);
    }

    /**
     * Clean up expired trash entries (older than retention period).
     * Called by scheduled task.
     */
    @Scheduled(cron = "${files.trash.cleanup.cron:0 0 3 * * ?}") // 3 AM daily
    public void cleanupExpiredTrash() {
        try {
            Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
            List<TrashEntry> entries = listTrash();
            int deleted = 0;

            for (TrashEntry entry : entries) {
                if (entry.getDeletedAt() != null && entry.getDeletedAt().isBefore(cutoff)) {
                    try {
                        if (permanentlyDelete(entry.getId())) {
                            deleted++;
                        }
                    } catch (Exception e) {
                        log.warn("Failed to delete expired trash entry {}: {}", entry.getId(), e.getMessage());
                    }
                }
            }

            if (deleted > 0) {
                log.info("Trash cleanup: permanently deleted {} expired entries", deleted);
            }
        } catch (Exception e) {
            log.error("Trash cleanup failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Get trash statistics.
     */
    public TrashStats getStats() throws IOException {
        List<TrashEntry> entries = listTrash();
        long totalSize = entries.stream().mapToLong(TrashEntry::getFileSize).sum();
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        long expiredCount = entries.stream()
            .filter(e -> e.getDeletedAt() != null && e.getDeletedAt().isBefore(cutoff))
            .count();

        return new TrashStats(entries.size(), totalSize, (int) expiredCount, retentionDays);
    }

    /**
     * Empty the entire trash (permanently delete all items).
     *
     * @return Number of items deleted
     */
    public int emptyTrash() throws IOException {
        List<TrashEntry> entries = listTrash();
        int count = 0;

        for (TrashEntry entry : entries) {
            try {
                if (permanentlyDelete(entry.getId())) {
                    count++;
                }
            } catch (Exception e) {
                log.warn("Failed to delete trash entry {}: {}", entry.getId(), e.getMessage());
            }
        }

        log.info("Emptied trash: {} items permanently deleted", count);
        return count;
    }

    // ==================== Private Methods ====================

    private Path getTrashPath() {
        return Paths.get(uploadsPath, TRASH_FOLDER);
    }

    private void deleteTrashEntry(String trashId) throws IOException {
        Path trashDir = getTrashPath().resolve(trashId);
        if (Files.exists(trashDir)) {
            Files.walkFileTree(trashDir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        }
        updateManifest(trashId, false);
    }

    private synchronized void updateManifest(TrashEntry entry, boolean add) throws IOException {
        Path manifestPath = getTrashPath().resolve(MANIFEST_FILE);
        Files.createDirectories(manifestPath.getParent());

        TrashManifest manifest;
        if (Files.exists(manifestPath)) {
            manifest = objectMapper.readValue(manifestPath.toFile(), TrashManifest.class);
            if (manifest.getEntries() == null) {
                manifest.setEntries(new ArrayList<>());
            }
        } else {
            manifest = new TrashManifest();
            manifest.setEntries(new ArrayList<>());
        }

        if (add) {
            // Remove any existing entry with same ID first
            manifest.getEntries().removeIf(e -> e.getId().equals(entry.getId()));
            manifest.getEntries().add(entry);
        } else {
            manifest.getEntries().removeIf(e -> e.getId().equals(entry.getId()));
        }

        objectMapper.writerWithDefaultPrettyPrinter()
            .writeValue(manifestPath.toFile(), manifest);
    }

    private synchronized void updateManifest(String trashId, boolean add) throws IOException {
        Path manifestPath = getTrashPath().resolve(MANIFEST_FILE);
        if (!Files.exists(manifestPath)) {
            return;
        }

        TrashManifest manifest = objectMapper.readValue(manifestPath.toFile(), TrashManifest.class);
        if (manifest.getEntries() == null) {
            return;
        }

        manifest.getEntries().removeIf(e -> e.getId().equals(trashId));

        objectMapper.writerWithDefaultPrettyPrinter()
            .writeValue(manifestPath.toFile(), manifest);
    }

    // ==================== DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrashEntry {
        private String id;
        private String originalPath;
        private String fileName;
        private Instant deletedAt;
        private String deletedBy;  // "user", "sync", "cleanup"
        private long fileSize;
        private boolean canRestore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrashManifest {
        private List<TrashEntry> entries = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrashStats {
        private int totalCount;
        private long totalSize;
        private int expiredCount;
        private int retentionDays;
    }
}
