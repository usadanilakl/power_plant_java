package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.sevice.sync.ManagedEntityFileSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

/**
 * The 2D plant map's reference/underlay image, stored as a FILE ON DISK (NOT base64 in the DB — the H2
 * write-amplification lesson: a background row is re-saved on every canvas edit) and synced to other devices via
 * {@link ManagedEntityFileSyncService} under the synthetic entity type {@code PlantMapBg}, keyed by the diagram id
 * (device-prefixed, globally unique). Metadata (opacity/offset/scale) lives in the diagram's {@code __bg__}
 * placement row; only the bytes live here. Modeled on {@code NgEngraverTemplateService}'s file-sync shape.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NgPlantMapBackgroundService {

    public static final String ENTITY_TYPE = "PlantMapBg";
    private static final Set<String> ALLOWED_EXT = Set.of("png", "jpg", "jpeg", "gif", "webp", "bmp");
    private static final long MAX_BYTES = 10L * 1024 * 1024; // 10 MB

    private final ManagedEntityFileSyncService fileSync;

    @Value("${files.root.path}")
    private String filesRootPath;
    @Value("${files.relative.path}")
    private String filesRelativePath;

    /** What the frontend needs to render + persist a background: a servable URL, a cache token, and dimensions. */
    public record BackgroundResult(String url, String ext, long token, int width, int height) {}

    private Path dir() throws IOException {
        Path d = Paths.get(filesRootPath, "plant-map-bg").toAbsolutePath();
        Files.createDirectories(d);
        return d;
    }

    private Path resolve(long diagramId, String ext) throws IOException {
        return dir().resolve(diagramId + "." + ext);
    }

    /** Save the uploaded image for a diagram (replacing any prior one), then push it to the sync fabric. */
    public BackgroundResult upload(long diagramId, MultipartFile file) throws IOException {
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) throw new IllegalArgumentException("The reference must be an image file.");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Image too large (max 10 MB) — crop or downscale it.");
        String ext = extOf(file.getOriginalFilename(), ct);

        deleteLocalFiles(diagramId);                          // drop any prior extension so we never keep two
        Path target = resolve(diagramId, ext);
        file.transferTo(target.toFile());

        // Local save must succeed even when the sync transport is down (offline desktop) — same posture as work-area.
        try { fileSync.replaceTrackedFiles(ENTITY_TYPE, diagramId, List.of(target)); }
        catch (Exception e) { log.warn("plant-map background {} saved locally but sync push failed: {}", diagramId, e.getMessage()); }

        return describe(diagramId, target);
    }

    /** Ensure the image is present locally (pulling from a peer if this device doesn't have it yet); null if none. */
    public BackgroundResult get(long diagramId) throws IOException {
        Path local = findLocal(diagramId);
        if (local == null) {
            // Not here — pull whatever a peer has for this diagram into our bg dir.
            fileSync.downloadEntityFiles(ENTITY_TYPE, diagramId, rf -> {
                try { return rf.fileName() != null && rf.fileName().startsWith(diagramId + ".") ? dir().resolve(rf.fileName()) : null; }
                catch (IOException e) { return null; }
            });
            local = findLocal(diagramId);
        } else if (fileSync.getRemoteFiles(ENTITY_TYPE, diagramId).isEmpty()) {
            // Self-heal: bytes exist locally but were never registered (upload's push failed once) — re-push.
            try { fileSync.replaceTrackedFiles(ENTITY_TYPE, diagramId, List.of(local)); }
            catch (Exception e) { log.warn("plant-map background {} re-push failed: {}", diagramId, e.getMessage()); }
        }
        return local == null ? null : describe(diagramId, local);
    }

    public void delete(long diagramId) {
        try { fileSync.deleteTrackedFiles(ENTITY_TYPE, diagramId); }
        catch (Exception e) { log.warn("plant-map background {} sync-delete failed: {}", diagramId, e.getMessage()); }
        deleteLocalFiles(diagramId);
    }

    // ── helpers ──

    private Path findLocal(long diagramId) throws IOException {
        try (Stream<Path> s = Files.list(dir())) {
            return s.filter(p -> p.getFileName().toString().startsWith(diagramId + ".")).findFirst().orElse(null);
        }
    }

    private void deleteLocalFiles(long diagramId) {
        try (Stream<Path> s = Files.list(dir())) {
            s.filter(p -> p.getFileName().toString().startsWith(diagramId + ".")).forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
        } catch (IOException ignored) {}
    }

    private BackgroundResult describe(long diagramId, Path file) throws IOException {
        String name = file.getFileName().toString();
        String ext = name.substring(name.lastIndexOf('.') + 1);
        long token = Files.getLastModifiedTime(file).toMillis();
        int w = 0, h = 0;
        try (InputStream in = Files.newInputStream(file)) {
            BufferedImage img = ImageIO.read(in);
            if (img != null) { w = img.getWidth(); h = img.getHeight(); }
        } catch (Exception ignored) {}
        String url = "/" + filesRelativePath + "/plant-map-bg/" + diagramId + "." + ext + "?v=" + token;
        return new BackgroundResult(url, ext, token, w, h);
    }

    private String extOf(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String e = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (ALLOWED_EXT.contains(e)) return e.equals("jpeg") ? "jpg" : e;
        }
        String e = contentType.substring(contentType.indexOf('/') + 1).toLowerCase();
        return e.equals("jpeg") ? "jpg" : (ALLOWED_EXT.contains(e) ? e : "png");
    }
}
