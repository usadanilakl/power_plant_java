package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;

/**
 * Drift on the FILE-CONTENT channel — the blind spot in entity drift detection.
 *
 * <p>File BYTES travel on a completely separate channel from FieldChange metadata (see
 * {@link FileObjectSyncHandler}: a durable PendingFileSync upload/download queue). So a node can hold a
 * FileObject row that content-hashes IDENTICALLY to the hub — zero entity drift, green badge — while the
 * actual PDF is missing from disk, truncated, or never uploaded. No amount of entity-level scanning can
 * see that, because the bytes aren't part of the row.
 *
 * <p><b>Deliberately modelled on the proven Electron cold-resync flow</b> (electron-manager's
 * {@code cold-resync.manager.ts} / {@code resource-pack.manager.ts}) rather than a new mechanism:
 * <ul>
 *   <li>the hub already publishes its whole file corpus at {@code GET /api/resync/files/path-manifest}
 *       ({relativePath, fileSize, lastModified}) — ONE call, no per-entity fan-out;</li>
 *   <li>reconciliation is by <b>relative path + size</b>. The manifest carries no content hash (the hub
 *       doesn't compute one there), and hashing both corpora on a timer would be minutes of disk I/O on
 *       a desktop. Path+size catches the failures that actually happen: the file never arrived, it was
 *       never pushed up, or it was replaced by a different revision;</li>
 *   <li>repair pulls by path from {@code GET /api/resync/files/permanent/**} — the same endpoint the
 *       Electron resync already uses in production.</li>
 * </ul>
 *
 * <p>This scan is ON-DEMAND, not part of the 15-minute {@link DriftScanScheduler} sweep: it walks the
 * whole uploads tree, which is far heavier than the entity content-hash probe.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileDriftService {

    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final FileRepo fileRepo;
    private final FileObjectSyncHandler fileObjectSyncHandler;
    private final SyncLabelService syncLabelService;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    /** Bound the reported entry list so one badly-out-of-sync node can't produce a 50k-row payload. */
    private static final int MAX_REPORTED = 2000;

    /** How a local file diverges from the hub's copy. */
    public enum FileDriftKind {
        /** The hub has this file, this node doesn't — pull repairs it. */
        MISSING_LOCALLY,
        /** This node has it, the hub doesn't — push repairs it (this is the data-loss-risk direction). */
        MISSING_ON_HUB,
        /** Both have the path but the sizes differ — one side has a different/truncated copy. */
        SIZE_DIFFERS
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FileDriftEntry {
        private String relativePath;
        private FileDriftKind kind;
        private Long localSize;
        private Long hubSize;
        /** The FileObject that owns this path, when it can be resolved from the file name. */
        private Long fileObjectId;
        /** Human label for that FileObject (SyncLabelService) — null when unmapped (an orphan on disk). */
        private String label;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FileDriftReport {
        private int localCount;
        private int hubCount;
        private int missingLocally;
        private int missingOnHub;
        private int sizeDiffers;
        /** Entries actually returned (capped at {@link #MAX_REPORTED}). */
        @Builder.Default private List<FileDriftEntry> entries = new ArrayList<>();
        /** How many drifting files were omitted from {@link #entries} by the cap — never silently dropped. */
        private int truncated;
        private String error;
        public boolean isInSync() {
            return error == null && missingLocally == 0 && missingOnHub == 0 && sizeDiffers == 0;
        }
    }

    // ==================== Detection ====================

    /**
     * Compare this node's uploads tree against the hub's. Read-only; no repair, no persistence.
     *
     * <p>Deliberately NOT {@code @Transactional}: this walks the whole uploads tree and makes an HTTP call
     * to the hub, and holding a pooled DB connection across seconds of filesystem + network I/O is a known
     * problem in this codebase (the content-hash probe does it and it's on the fix list). The only DB work
     * here is the per-path owner lookup in {@link #resolveOwners}, which Spring Data scopes itself.
     */
    public FileDriftReport scan() {
        String url = syncConfig.getSyncServerUrl();
        if (url == null || url.isBlank()) {
            return FileDriftReport.builder().error("no sync server configured").build();
        }

        Map<String, Long> local;
        try {
            local = walkLocalFiles();
        } catch (Exception e) {
            log.warn("file drift: local walk failed: {}", e.getMessage());
            return FileDriftReport.builder().error("local scan failed: " + e.getMessage()).build();
        }

        Map<String, Long> hub;
        try {
            hub = fetchHubManifest(url);
        } catch (Exception e) {
            log.warn("file drift: hub manifest failed: {}", e.getMessage());
            return FileDriftReport.builder().localCount(local.size())
                    .error("hub manifest unavailable: " + e.getMessage()).build();
        }

        List<FileDriftEntry> entries = new ArrayList<>();
        int missingLocally = 0, missingOnHub = 0, sizeDiffers = 0, truncated = 0;

        for (Map.Entry<String, Long> h : hub.entrySet()) {
            Long localSize = local.get(h.getKey());
            if (localSize == null) {
                missingLocally++;
                truncated += addCapped(entries, h.getKey(), FileDriftKind.MISSING_LOCALLY, null, h.getValue());
            } else if (!Objects.equals(localSize, h.getValue())) {
                sizeDiffers++;
                truncated += addCapped(entries, h.getKey(), FileDriftKind.SIZE_DIFFERS, localSize, h.getValue());
            }
        }
        for (Map.Entry<String, Long> l : local.entrySet()) {
            if (!hub.containsKey(l.getKey())) {
                missingOnHub++;
                truncated += addCapped(entries, l.getKey(), FileDriftKind.MISSING_ON_HUB, l.getValue(), null);
            }
        }

        resolveOwners(entries);

        if (truncated > 0) {
            log.info("file drift: reporting {} of {} drifting files (capped)",
                    entries.size(), entries.size() + truncated);
        }
        return FileDriftReport.builder()
                .localCount(local.size()).hubCount(hub.size())
                .missingLocally(missingLocally).missingOnHub(missingOnHub).sizeDiffers(sizeDiffers)
                .entries(entries).truncated(truncated)
                .build();
    }

    /** @return 1 if the entry had to be dropped by the cap, 0 if it was recorded. */
    private int addCapped(List<FileDriftEntry> entries, String path, FileDriftKind kind, Long localSize, Long hubSize) {
        if (entries.size() >= MAX_REPORTED) return 1;
        entries.add(FileDriftEntry.builder()
                .relativePath(path).kind(kind).localSize(localSize).hubSize(hubSize).build());
        return 0;
    }

    /** relativePath -> size for every file under the local uploads root. */
    private Map<String, Long> walkLocalFiles() throws IOException {
        Map<String, Long> out = new LinkedHashMap<>();
        Path root = Paths.get(filesRootPath);
        if (!Files.exists(root)) return out;
        Files.walkFileTree(root, new SimpleFileVisitor<>() {
            @Override public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                out.put(root.relativize(file).toString().replace('\\', '/'), attrs.size());
                return FileVisitResult.CONTINUE;
            }
            @Override public FileVisitResult visitFileFailed(Path file, IOException exc) {
                log.debug("file drift: skipping unreadable {}", file);
                return FileVisitResult.CONTINUE;
            }
        });
        return out;
    }

    /** The hub's whole-corpus manifest, normalised to the same relative-path shape as the local walk. */
    private Map<String, Long> fetchHubManifest(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        ResponseEntity<List<Map<String, Object>>> r = restTemplate.exchange(
                url + "/api/resync/files/path-manifest",
                HttpMethod.GET, new HttpEntity<>(headers), new ParameterizedTypeReference<>() {});

        Map<String, Long> out = new LinkedHashMap<>();
        for (Map<String, Object> e : Optional.ofNullable(r.getBody()).orElse(List.of())) {
            String path = normalise((String) e.get("relativePath"));
            if (path == null) continue;
            Object size = e.get("fileSize");
            out.put(path, size instanceof Number n ? n.longValue() : null);
        }
        return out;
    }

    /**
     * Strip a leading uploads-root segment if the hub's manifest carries one. The hub relativizes against
     * its own files root, but its root is named per-profile ({@code uploads-prod}), and Electron's resync
     * hit manifests that still included that prefix — so it strips it too. Mirroring that here keeps a
     * profile mismatch from reporting the ENTIRE corpus as drifting in both directions.
     */
    private String normalise(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return null;
        String p = relativePath.replace('\\', '/');
        int slash = p.indexOf('/');
        if (slash > 0 && p.substring(0, slash).toLowerCase().startsWith("uploads")) {
            p = p.substring(slash + 1);
        }
        return p;
    }

    /**
     * Attach the owning FileObject (and its human label) to each drifting path. Only the DRIFT set is
     * resolved, never the whole corpus, so this stays cheap. Uses the same convention as
     * {@code FileObjectSyncHandler.findActiveOwner}: the file name minus any {@code -revN} suffix and
     * extension is the fileNumber.
     */
    private void resolveOwners(List<FileDriftEntry> entries) {
        Map<String, Long> byFileNumber = new HashMap<>();
        for (FileDriftEntry e : entries) {
            String fileNumber = fileNumberOf(e.getRelativePath());
            if (fileNumber == null) continue;
            Long id = byFileNumber.computeIfAbsent(fileNumber, fn -> {
                try {
                    FileObject fo = fileRepo.findFirstByFileNumberOrderByIdAsc(fn);
                    return fo != null ? fo.getId() : null;
                } catch (Exception ex) {
                    return null;
                }
            });
            if (id != null) {
                e.setFileObjectId(id);
                e.setLabel(syncLabelService.labelFor("FileObject", id));
            }
        }
    }

    /** "pdf/Manuals/Acme/ABC-123-rev2.pdf" -> "ABC-123". */
    private String fileNumberOf(String relativePath) {
        if (relativePath == null) return null;
        String name = relativePath.substring(relativePath.lastIndexOf('/') + 1);
        String base = name.replaceAll("(-rev\\d+)?\\.[^.]+$", "");
        return base.isBlank() ? null : base;
    }

    // ==================== Repair ====================

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RepairResult {
        private int requested;
        private int succeeded;
        private int failed;
        /** Paths that couldn't be mapped to a FileObject (push only) — nothing to queue an upload for. */
        @Builder.Default private List<String> unmapped = new ArrayList<>();
        @Builder.Default private List<String> errors = new ArrayList<>();
        private String message;
    }

    /**
     * Pull files down from the hub by path — repairs MISSING_LOCALLY and SIZE_DIFFERS. Writes through a
     * temp file + atomic move (a crash mid-write must not leave a truncated file where a good one was),
     * and refuses any path that escapes the files root, since the path comes from a remote manifest.
     */
    public RepairResult pull(List<String> relativePaths) {
        RepairResult res = RepairResult.builder().requested(relativePaths == null ? 0 : relativePaths.size()).build();
        String url = syncConfig.getSyncServerUrl();
        if (relativePaths == null || relativePaths.isEmpty()) return res;
        if (url == null || url.isBlank()) {
            res.setMessage("No sync server configured");
            res.setFailed(res.getRequested());
            return res;
        }

        Path root = Paths.get(filesRootPath).toAbsolutePath().normalize();
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        for (String rel : relativePaths) {
            try {
                Path target = root.resolve(rel).normalize();
                if (!target.startsWith(root)) {
                    throw new IOException("refusing to write outside the files root: " + rel);
                }

                String encoded = encodePath(rel);
                ResponseEntity<byte[]> r = restTemplate.exchange(
                        url + "/api/resync/files/permanent/" + encoded,
                        HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
                if (!r.getStatusCode().is2xxSuccessful() || r.getBody() == null) {
                    throw new IOException("hub returned " + r.getStatusCode());
                }

                Files.createDirectories(target.getParent());
                Path tmp = Files.createTempFile(target.getParent(), ".pull-", ".tmp");
                try {
                    Files.write(tmp, r.getBody());
                    try {
                        Files.move(tmp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
                    } catch (AtomicMoveNotSupportedException | UnsupportedOperationException e) {
                        Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
                    }
                } finally {
                    Files.deleteIfExists(tmp);
                }
                res.setSucceeded(res.getSucceeded() + 1);
            } catch (Exception e) {
                res.setFailed(res.getFailed() + 1);
                if (res.getErrors().size() < 20) res.getErrors().add(rel + ": " + e.getMessage());
                log.warn("file drift pull failed for {}: {}", rel, e.getMessage());
            }
        }
        res.setMessage(res.getSucceeded() + " file(s) pulled from the hub"
                + (res.getFailed() > 0 ? ", " + res.getFailed() + " failed" : ""));
        return res;
    }

    /**
     * Push local-only files up — repairs MISSING_ON_HUB.
     *
     * <p>Goes through the EXISTING {@code PendingFileSync} upload queue rather than POSTing bytes here:
     * that queue is durable across restarts, retries with backoff, and is the same path a normal upload
     * takes. The upload is therefore ASYNCHRONOUS — this returns "queued", not "done", and the next file
     * scan is what confirms the bytes actually landed.
     *
     * <p>A path with no resolvable FileObject is reported as unmapped instead of being silently skipped:
     * the queue is keyed by entity, so there is nothing to enqueue for an orphan file on disk.
     */
    @Transactional
    public RepairResult push(List<String> relativePaths) {
        RepairResult res = RepairResult.builder().requested(relativePaths == null ? 0 : relativePaths.size()).build();
        if (relativePaths == null || relativePaths.isEmpty()) return res;

        Set<Long> queued = new LinkedHashSet<>();
        for (String rel : relativePaths) {
            try {
                String fileNumber = fileNumberOf(rel);
                FileObject fo = fileNumber == null ? null : fileRepo.findFirstByFileNumberOrderByIdAsc(fileNumber);
                if (fo == null) {
                    res.getUnmapped().add(rel);
                    continue;
                }
                if (queued.add(fo.getId())) {
                    // queueFileUpload uploads EVERY physical file of the FileObject, so one enqueue per
                    // entity covers all of its drifting paths.
                    fileObjectSyncHandler.queueFileUpload(fo);
                }
                res.setSucceeded(res.getSucceeded() + 1);
            } catch (Exception e) {
                res.setFailed(res.getFailed() + 1);
                if (res.getErrors().size() < 20) res.getErrors().add(rel + ": " + e.getMessage());
                log.warn("file drift push failed for {}: {}", rel, e.getMessage());
            }
        }
        res.setMessage(queued.size() + " upload(s) queued — files transfer in the background; re-scan to confirm"
                + (res.getUnmapped().isEmpty() ? "" : ", " + res.getUnmapped().size() + " unmapped"));
        return res;
    }

    /** Percent-encode each segment, leaving the separators intact (mirrors the Electron resync client). */
    private String encodePath(String rel) {
        String[] parts = rel.split("/");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append('/');
            sb.append(java.net.URLEncoder.encode(parts[i], java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20"));
        }
        return sb.toString();
    }
}
