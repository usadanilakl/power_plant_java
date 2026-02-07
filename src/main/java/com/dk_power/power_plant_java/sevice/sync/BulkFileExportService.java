package com.dk_power.power_plant_java.sevice.sync;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
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
                    // Get relative path from root
                    Path relativePath = uploadsDir.getParent().relativize(file);
                    String zipEntryName = relativePath.toString().replace('\\', '/');

                    ZipEntry entry = new ZipEntry(zipEntryName);
                    entry.setTime(attrs.lastModifiedTime().toMillis());
                    zos.putNextEntry(entry);

                    Files.copy(file, zos);
                    zos.closeEntry();

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
