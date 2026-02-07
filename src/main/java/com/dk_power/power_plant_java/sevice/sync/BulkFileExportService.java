package com.dk_power.power_plant_java.sevice.sync;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Service for creating bulk file exports for fast sync to server.
 *
 * Creates a ZIP archive containing all files from the uploads directory,
 * preserving the directory structure so the server can extract them
 * directly to its permanent storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkFileExportService {

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    /**
     * Functional interface for reporting archive creation progress.
     */
    @FunctionalInterface
    public interface ArchiveProgressCallback {
        /**
         * Called after each file is added to the archive.
         *
         * @param filesProcessed Number of files added so far
         * @param totalFiles     Total number of files to archive
         * @param bytesProcessed Bytes processed so far
         * @param totalBytes     Total bytes to process
         */
        void onProgress(int filesProcessed, int totalFiles, long bytesProcessed, long totalBytes);
    }

    /**
     * Create a ZIP archive of all files in the uploads directory.
     * Preserves directory structure for server extraction.
     *
     * @return ZIP archive as byte array
     */
    public byte[] createFilesArchive() throws IOException {
        Path uploadsDir = Paths.get(filesRootPath);

        if (!Files.exists(uploadsDir)) {
            log.warn("Uploads directory does not exist: {}", uploadsDir);
            return new byte[0];
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            Files.walkFileTree(uploadsDir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    try {
                        // Get relative path from root
                        Path relativePath = uploadsDir.getParent().relativize(file);
                        String zipEntryName = relativePath.toString().replace('\\', '/');

                        ZipEntry entry = new ZipEntry(zipEntryName);
                        entry.setTime(attrs.lastModifiedTime().toMillis());
                        zos.putNextEntry(entry);

                        Files.copy(file, zos);
                        zos.closeEntry();
                    } catch (NoSuchFileException e) {
                        // File was deleted by concurrent operation - skip it
                        log.warn("File disappeared during archive creation: {} - skipping", file);
                    }

                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                    // Add directory entries (optional but helps preserve structure)
                    if (!dir.equals(uploadsDir.getParent())) {
                        Path relativePath = uploadsDir.getParent().relativize(dir);
                        String dirName = relativePath.toString().replace('\\', '/');
                        if (!dirName.isEmpty() && !dirName.endsWith("/")) {
                            dirName += "/";
                        }
                        if (!dirName.isEmpty()) {
                            zos.putNextEntry(new ZipEntry(dirName));
                            zos.closeEntry();
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) {
                    log.warn("Failed to add file to archive: {} - {}", file, exc.getMessage());
                    return FileVisitResult.CONTINUE;
                }
            });
        }

        byte[] result = baos.toByteArray();
        log.info("Created files archive: {} bytes", result.length);
        return result;
    }

    /**
     * Create a ZIP archive of all files, writing directly to a temp file on disk.
     * Use this for large file systems to avoid OutOfMemoryError.
     *
     * @return Path to the temp ZIP file (caller must delete after use), or null if no files
     */
    public Path createFilesArchiveToFile() throws IOException {
        return createFilesArchiveToFile(null);
    }

    /**
     * Create a ZIP archive of all files with progress reporting.
     * Use this for large file systems to avoid OutOfMemoryError.
     *
     * @param progressCallback Callback for progress updates (can be null)
     * @return Path to the temp ZIP file (caller must delete after use), or null if no files
     */
    public Path createFilesArchiveToFile(ArchiveProgressCallback progressCallback) throws IOException {
        Path uploadsDir = Paths.get(filesRootPath);

        if (!Files.exists(uploadsDir)) {
            log.warn("Uploads directory does not exist: {}", uploadsDir);
            return null;
        }

        // Check if there are any files first
        FileStats stats = getFileStats();
        if (stats.getFileCount() == 0) {
            log.info("No files to archive");
            return null;
        }

        final int totalFiles = stats.getFileCount();
        final long totalBytes = stats.getTotalSize();
        final AtomicInteger filesProcessed = new AtomicInteger(0);
        final AtomicLong bytesProcessed = new AtomicLong(0);

        // Create temp file for the ZIP
        Path tempZip = Files.createTempFile("files-export-", ".zip");
        log.info("Creating files archive to temp file: {} ({} files, {} bytes estimated)",
            tempZip, totalFiles, totalBytes);

        try (OutputStream fos = Files.newOutputStream(tempZip);
             ZipOutputStream zos = new ZipOutputStream(fos)) {

            Files.walkFileTree(uploadsDir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    try {
                        // Get relative path from root
                        Path relativePath = uploadsDir.getParent().relativize(file);
                        String zipEntryName = relativePath.toString().replace('\\', '/');

                        ZipEntry entry = new ZipEntry(zipEntryName);
                        entry.setTime(attrs.lastModifiedTime().toMillis());
                        zos.putNextEntry(entry);

                        // Stream the file directly without loading into memory
                        Files.copy(file, zos);
                        zos.closeEntry();

                        // Report progress after each file
                        int processed = filesProcessed.incrementAndGet();
                        long bytes = bytesProcessed.addAndGet(attrs.size());
                        if (progressCallback != null) {
                            progressCallback.onProgress(processed, totalFiles, bytes, totalBytes);
                        }
                    } catch (NoSuchFileException e) {
                        // File was deleted by concurrent operation (e.g., sync cleanup) - skip it
                        log.warn("File disappeared during archive creation: {} - skipping", file);
                        // Still count progress to avoid stalling
                        int processed = filesProcessed.incrementAndGet();
                        if (progressCallback != null) {
                            progressCallback.onProgress(processed, totalFiles, bytesProcessed.get(), totalBytes);
                        }
                    }

                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                    // Add directory entries (optional but helps preserve structure)
                    if (!dir.equals(uploadsDir.getParent())) {
                        Path relativePath = uploadsDir.getParent().relativize(dir);
                        String dirName = relativePath.toString().replace('\\', '/');
                        if (!dirName.isEmpty() && !dirName.endsWith("/")) {
                            dirName += "/";
                        }
                        if (!dirName.isEmpty()) {
                            zos.putNextEntry(new ZipEntry(dirName));
                            zos.closeEntry();
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) {
                    log.warn("Failed to add file to archive: {} - {}", file, exc.getMessage());
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            // Clean up temp file on error
            try {
                Files.deleteIfExists(tempZip);
            } catch (IOException ignored) {}
            throw e;
        }

        long zipSize = Files.size(tempZip);
        log.info("Files archive created: {} bytes at {}", zipSize, tempZip);
        return tempZip;
    }

    /**
     * Create a manifest listing all files with their checksums.
     * Used for verification after server import.
     */
    public FileManifest createManifest() throws IOException {
        Path uploadsDir = Paths.get(filesRootPath);
        FileManifest manifest = new FileManifest();
        manifest.setCreatedAt(Instant.now());

        if (!Files.exists(uploadsDir)) {
            return manifest;
        }

        List<FileManifestEntry> entries = new ArrayList<>();

        Files.walkFileTree(uploadsDir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                try {
                    Path relativePath = uploadsDir.getParent().relativize(file);
                    String pathStr = relativePath.toString().replace('\\', '/');

                    FileManifestEntry entry = new FileManifestEntry();
                    entry.setRelativePath(pathStr);
                    entry.setFileSize(attrs.size());
                    entry.setLastModified(attrs.lastModifiedTime().toInstant());
                    entry.setChecksum(computeSha256(file));

                    entries.add(entry);
                } catch (Exception e) {
                    log.warn("Failed to add file to manifest: {} - {}", file, e.getMessage());
                }
                return FileVisitResult.CONTINUE;
            }
        });

        manifest.setEntries(entries);
        manifest.setTotalFiles(entries.size());
        manifest.setTotalSize(entries.stream().mapToLong(FileManifestEntry::getFileSize).sum());

        log.info("Created manifest with {} files, {} bytes total",
            manifest.getTotalFiles(), manifest.getTotalSize());
        return manifest;
    }

    /**
     * Get file count and total size without creating archive.
     */
    public FileStats getFileStats() throws IOException {
        Path uploadsDir = Paths.get(filesRootPath);
        FileStats stats = new FileStats();

        if (!Files.exists(uploadsDir)) {
            return stats;
        }

        Files.walkFileTree(uploadsDir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                stats.fileCount++;
                stats.totalSize += attrs.size();
                return FileVisitResult.CONTINUE;
            }
        });

        return stats;
    }

    private String computeSha256(Path file) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(file);
            byte[] hash = digest.digest(fileBytes);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("SHA-256 algorithm not available", e);
        }
    }

    // ==================== DTOs ====================

    @Data
    public static class FileManifest {
        private Instant createdAt;
        private int totalFiles;
        private long totalSize;
        private List<FileManifestEntry> entries = new ArrayList<>();
    }

    @Data
    public static class FileManifestEntry {
        private String relativePath;
        private long fileSize;
        private Instant lastModified;
        private String checksum;
    }

    @Data
    public static class FileStats {
        private int fileCount = 0;
        private long totalSize = 0;
    }
}
