package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
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
    private final FileRepo fileRepo;

    @Value("${files.root.path}")
    private String filesRootPath;

    public HubFileService(HubSyncedFileRepository syncedFileRepository, FileRepo fileRepo) {
        this.syncedFileRepository = syncedFileRepository;
        this.fileRepo = fileRepo;
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
            // Heal legacy mis-filing: the dedup check matches on hash+entity, not path, so a re-push of a
            // file the hub stored at a non-canonical FALLBACK path would otherwise no-op and leave it drifting
            // forever. If it's not already at the canonical path, relocate it now.
            relocateToCanonicalIfNeeded(existingFile, entityType, entityId, file.getOriginalFilename());
            syncedFileRepository.save(existingFile);
            return new FileStoreResult(existingFile, false);
        }

        // Determine file info
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1);
        }

        // Canonical hub storage path: mirror EXACTLY where the desktop stores the same file — under the
        // FileObject's own {ext}/{fileType}/{vendor} folder (buildRelativeFolder) with the original filename
        // (see FileObjectSyncHandler.downloadSingleFile). Deriving it from the hub's OWN replicated FileObject
        // metadata (not the client's absolute path) keeps both sides' drift walks in agreement. The old
        // client-path substring match filed non-standard layouts at a fallback path (FileObject/{id}/{name})
        // that read as "missing on hub" even though the bytes were present. Falls back to the legacy
        // client-path derivation for non-FileObject entities or when the FileObject lacks fileType/vendor.
        // The relative path is still contained inside the files root (resolveWithinRoot) so a crafted client
        // path can never write outside it.
        String relativePath = null;
        if ("FileObject".equals(entityType)) {
            relativePath = canonicalFileObjectRelativePath(entityId, extension, originalFilename);
        }
        if (relativePath == null) {
            relativePath = extractRelativePath(originalPath, originalFilename, entityType, entityId);
        }
        Path filePath = resolveWithinRoot(relativePath, entityType, entityId, originalFilename);
        Files.createDirectories(filePath.getParent());
        // Collision-safety: the canonical path {ext}/{fileType}/{vendor}/{filename} is entity-id-agnostic, so a
        // DIFFERENT FileObject sharing fileNumber+fileType+vendor+ext maps to the SAME path. A plain
        // Files.write would TRUNCATE that other entity's bytes (silent data loss). Write collision-safely: if
        // the canonical path is already held by different content, store this entity's copy under an
        // entity-scoped path instead — both files preserved (worst case = recoverable file drift, never loss).
        if ("FileObject".equals(entityType)) {
            filePath = writeWithoutClobbering(filePath, content, hash, entityId, originalFilename);
        } else {
            Files.write(filePath, content);
        }

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

        String storagePath = syncedFile.getStoragePath();
        if (storagePath == null || storagePath.isBlank()) {
            throw new NoSuchFileException("No storage path for hub file " + fileId);
        }

        Path filePath = Path.of(storagePath);
        if (Files.notExists(filePath)) {
            throw new NoSuchFileException(filePath.toString());
        }
        if (!Files.isRegularFile(filePath)) {
            throw new IOException("Hub storage path is not a regular file: " + filePath);
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
     * The canonical hub storage path for a FileObject's file — identical to where the desktop stores it:
     * {ext}/{fileType}/{vendor}/{filename} (FileObject.buildRelativeFolder + the actual filename, preserving
     * revision suffixes). Derived from the hub's own replicated FileObject metadata so both sides' drift
     * walks agree. Returns null (→ caller uses the legacy fallback) when the FileObject isn't present yet or
     * lacks fileType/vendor. Mirrors the client's ext default in FileObjectSyncHandler.downloadSingleFile.
     */
    private String canonicalFileObjectRelativePath(Long entityId, String extension, String originalFilename) {
        if (originalFilename == null || originalFilename.isEmpty()) return null;
        FileObject fo = fileRepo.findById(entityId).orElse(null);
        if (fo == null) return null;
        String ext = (extension != null && !extension.isEmpty()) ? extension : "pdf";
        String relFolder = fo.buildRelativeFolder(ext); // {ext}/{fileType}/{vendor}, or null if type/vendor missing
        if (relFolder == null || relFolder.isBlank()) return null;
        return relFolder + "/" + originalFilename;
    }

    /**
     * Heal a legacy mis-filing: if an already-stored FileObject file sits at a non-canonical fallback path
     * (from the old client-abs-path derivation), move its bytes to the canonical
     * {ext}/{fileType}/{vendor}/{filename} path and update the tracking row, so the drift walk stops
     * reporting it as "missing on hub". No-op for non-FileObject entities, when already canonical, when the
     * canonical path can't be computed (FileObject not present / lacks fileType-vendor), or when the source
     * file is gone. Failure is logged and swallowed — the bytes stay where they are (no data loss).
     */
    private void relocateToCanonicalIfNeeded(HubSyncedFile existingFile, String entityType, Long entityId,
                                             String uploadFilename) {
        if (!"FileObject".equals(entityType)) return;
        String filename = (uploadFilename != null && !uploadFilename.isEmpty())
            ? uploadFilename : existingFile.getFileName();
        String canonicalRel = canonicalFileObjectRelativePath(entityId, existingFile.getExtension(), filename);
        if (canonicalRel == null) return;
        String current = existingFile.getStoragePath();
        if (current == null || current.isBlank()) return;
        try {
            Path target = resolveWithinRoot(canonicalRel, entityType, entityId, filename);
            Path source = Path.of(current).toAbsolutePath().normalize();
            if (source.equals(target)) return;      // already canonical
            if (Files.notExists(source)) return;     // nothing to move
            if (Files.exists(target)) {
                // The canonical path {ext}/{fileType}/{vendor}/{filename} is deliberately entity-id-agnostic
                // (it must match the desktop's buildRelativeFolder). So two DISTINCT FileObjects that share
                // fileNumber+fileType+vendor+ext resolve to the SAME path — a known data-quality condition in
                // this codebase. Overwriting would destroy the OTHER file's bytes and break its hash-checked
                // downloads. Only "relocate" when the target already holds byte-identical content (harmless —
                // just retire the legacy copy); otherwise SKIP and leave this copy where it is (drifting-but-safe
                // beats destructive).
                if (sameContent(target, existingFile.getFileHash())) {
                    existingFile.setStoragePath(target.toString());
                    try { Files.deleteIfExists(source); } catch (IOException ignore) { /* best effort */ }
                    log.info("file_sync.rehome_dedup entityId={} canonical={} removedLegacy={}", entityId, target, source);
                } else {
                    log.warn("file_sync.rehome_skipped_collision entityId={} target={} holds different content — left at {}",
                        entityId, target, source);
                }
                return;
            }
            Files.createDirectories(target.getParent());
            // No REPLACE_EXISTING: target was just confirmed absent, so a concurrent create between the check
            // and the move makes this THROW (caught below) rather than silently overwrite another file.
            Files.move(source, target);
            existingFile.setStoragePath(target.toString());
            log.info("file_sync.rehomed_to_canonical entityId={} from={} to={}", entityId, source, target);
        } catch (IOException e) {
            log.warn("file_sync.rehome_failed entityId={}: {}", entityId, e.getMessage());
        }
    }

    /**
     * Write {@code content} to {@code canonical} WITHOUT ever truncating a DIFFERENT file already there.
     * The canonical path is entity-id-agnostic, so two FileObjects sharing fileNumber+fileType+vendor+ext
     * collide. Atomic create-if-absent (Files.move without REPLACE_EXISTING never clobbers); on an existing
     * target holding the SAME bytes, share it; on an existing target with DIFFERENT bytes, store under an
     * entity-scoped path instead. Returns the path actually written so the caller records the right storagePath.
     */
    private Path writeWithoutClobbering(Path canonical, byte[] content, String hash, Long entityId, String filename)
            throws IOException {
        Path tmp = Files.createTempFile(canonical.getParent(), ".up-", ".tmp");
        try {
            Files.write(tmp, content);
            try {
                Files.move(tmp, canonical); // no REPLACE_EXISTING → throws if occupied, never overwrites
                return canonical;
            } catch (FileAlreadyExistsException e) {
                if (sameContent(canonical, hash)) {
                    return canonical; // identical bytes already present — share the physical file
                }
                String name = (filename != null && !filename.isEmpty()) ? filename : "file";
                Path scoped = resolveWithinRoot("FileObject/" + entityId + "/" + name, "FileObject", entityId, filename);
                Files.createDirectories(scoped.getParent());
                Files.move(tmp, scoped, StandardCopyOption.REPLACE_EXISTING); // this entity's OWN scoped path
                log.warn("file_sync.canonical_collision entityId={} canonical={} held different content — stored at {}",
                    entityId, canonical, scoped);
                return scoped;
            }
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    /** True if the file at {@code path} hashes to {@code expectedSha256} (byte-identical). Unknown/blank
     *  expected hash or any read error → false, so the caller treats it as a collision and does NOT overwrite. */
    private boolean sameContent(Path path, String expectedSha256) {
        if (expectedSha256 == null || expectedSha256.isBlank()) return false;
        try {
            return expectedSha256.equals(computeSha256(Files.readAllBytes(path)));
        } catch (IOException e) {
            return false;
        }
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

    /**
     * Resolve a client-derived relative path under the files root, guaranteeing the result stays
     * inside the root. If the requested path escapes (via {@code ..} or an absolute segment), fall
     * back to the server-controlled {@code entityType/entityId/<sanitized-filename>} structure,
     * which is always safe. Never returns a path outside the root.
     */
    private Path resolveWithinRoot(String relativePath, String entityType, Long entityId, String originalFilename) {
        Path root = Path.of(filesRootPath).toAbsolutePath().normalize();
        Path candidate = root.resolve(relativePath).normalize();
        if (candidate.startsWith(root)) {
            return candidate;
        }
        log.warn("Rejected path-escaping upload target '{}' for {}/{} — using safe fallback path",
            relativePath, entityType, entityId);
        Path safe = root.resolve(sanitizePathSegment(entityType))
                        .resolve(String.valueOf(entityId))
                        .resolve(sanitizeFilename(originalFilename))
                        .normalize();
        if (!safe.startsWith(root)) {
            // Should be impossible (all segments sanitized) — fail loudly rather than escape.
            throw new IllegalArgumentException("Refusing to write file outside files root: " + safe);
        }
        return safe;
    }

    /** Strip any path separators / traversal from a single path segment. */
    private static String sanitizePathSegment(String seg) {
        if (seg == null || seg.isBlank()) return "_";
        String cleaned = seg.replaceAll("[^A-Za-z0-9._-]", "_");
        return (cleaned.isBlank() || cleaned.equals(".") || cleaned.equals("..")) ? "_" : cleaned;
    }

    /** Reduce a filename to its base name and strip anything that could alter the target directory. */
    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = name.replace('\\', '/');
        int slash = base.lastIndexOf('/');
        if (slash >= 0) base = base.substring(slash + 1);
        base = base.replaceAll("[^A-Za-z0-9._-]", "_");
        return (base.isBlank() || base.equals(".") || base.equals("..")) ? "file" : base;
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

    /**
     * Best-effort, per-file-isolated variant of {@link #registerLocalFile}, for the FileObject
     * afterCommit hook ({@code FileObjectSyncHandler.registerFilesOnHub}). Runs in its OWN
     * transaction (REQUIRES_NEW) so it (a) durably commits even though the caller sits inside a
     * completed transaction's afterCommit callback, and (b) one file's failure can't roll back the
     * others in the loop. The delete-and-replace atomicity path ({@code replaceTrackedFiles}) keeps
     * using {@link #registerLocalFile} (REQUIRED) so its delete + register stay in one transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public HubSyncedFile registerLocalFileIsolated(java.io.File file, String entityType, Long entityId,
                                                   String originalPath, String machineId) throws IOException {
        return registerLocalFile(file, entityType, entityId, originalPath, machineId);
    }

    public record FileStoreResult(HubSyncedFile syncedFile, boolean isNewFile) {}

    public record StorageStats(long totalBytesUsed, long totalFiles) {}
}
