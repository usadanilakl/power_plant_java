package com.dk_power.power_plant_java.sevice.automation.redtag.core;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Pattern;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.EnumMap;
import java.util.Map;

/**
 * Resolves a {@link RedTagPattern} to a ready-to-use SikuliX {@link Pattern}.
 *
 * <p>This is the heart of the "better screenshot handling" rework:
 * <ul>
 *   <li>Pattern PNGs are bundled in the repo at
 *       {@code src/main/resources/automation/redtag/patterns/} — versioned, no network drive.</li>
 *   <li>On startup they are extracted to a writable working directory so an operator can
 *       recapture / tweak a single image without rebuilding the app.</li>
 *   <li>An external folder may override the bundle entirely via
 *       {@code redtag.automation.pattern-base-path}.</li>
 *   <li>Every pattern is resolved by logical name with a similarity applied once, here.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PatternCatalog {

    private static final String CLASSPATH_ROOT = "automation/redtag/patterns";

    /**
     * Sub-folder under {@link #baseDir} holding rescaled copies of the bundled patterns,
     * one directory per zoom level (named in per-mille, e.g. {@code .scaled/1450}).
     */
    private static final String SCALED_ROOT = ".scaled";

    /** Below this the requested zoom is treated as "the captured one" and the original PNG is used. */
    private static final double SCALE_EPSILON = 0.02;

    private final RedTagAutomationProperties properties;
    private final Map<RedTagPattern, Pattern> cache = new EnumMap<>(RedTagPattern.class);

    /** Absolute directory the pattern PNGs are read from at runtime. */
    private Path baseDir;

    /**
     * Zoom of the live form relative to the zoom the patterns were captured at.
     *
     * <p>Every bundled pattern comes from one capture pass of the 2026-09-03 forms, taken at the
     * zoom where a whole permit fits the window. The Red Tag form does not always render at that
     * zoom — it follows the window size, the monitor's DPI and whatever Ctrl+wheel the last
     * operator left behind — and a SikuliX pattern only matches at the scale it was captured at.
     * Historically this was "fixed" by recapturing every crop on the machine that had drifted,
     * which is what left the catalogue holding three different scales at once and is why the
     * automation broke whenever anything about the display changed.
     *
     * <p>So the scale is measured instead: {@code SikuliDriver.calibrateScale} finds a section
     * header across a ladder of zooms once per build, and every pattern and pixel offset is
     * scaled by the result. See {@link #setScale}.
     */
    private volatile double scale = 1.0;

    @PostConstruct
    void init() {
        String override = properties.getPatternBasePath();
        if (override != null && !override.isBlank() && Files.isDirectory(Paths.get(override))) {
            baseDir = Paths.get(override).toAbsolutePath();
            log.info("[RedTag] Using external pattern folder: {}", baseDir);
        } else {
            baseDir = Paths.get(properties.getPatternWorkingDir()).toAbsolutePath();
            extractBundledPatterns();
        }
        auditCatalogue();
    }

    /** Copies pattern PNGs bundled on the classpath into the writable working directory. */
    private void extractBundledPatterns() {
        int copied = 0;
        try {
            Files.createDirectories(baseDir);
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:" + CLASSPATH_ROOT + "/**/*.png");
            for (Resource resource : resources) {
                String url = resource.getURL().toString();
                int marker = url.indexOf(CLASSPATH_ROOT + "/");
                if (marker < 0) continue;
                String relative = url.substring(marker + CLASSPATH_ROOT.length() + 1);
                Path target = baseDir.resolve(relative);
                Files.createDirectories(target.getParent());
                try (InputStream in = resource.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                    copied++;
                }
            }
        } catch (Exception e) {
            log.warn("[RedTag] Could not extract bundled patterns: {}", e.getMessage());
        }
        log.info("[RedTag] Extracted {} pattern image(s) to {}", copied, baseDir);
    }

    /** Logs, once at startup, which patterns are present and which still need capturing. */
    private void auditCatalogue() {
        int present = 0, missing = 0;
        for (RedTagPattern p : RedTagPattern.values()) {
            if (Files.isRegularFile(baseDir.resolve(p.getRelativePath()))) {
                present++;
            } else {
                missing++;
                log.warn("[RedTag] Pattern image MISSING: {} ({}){}",
                        p.name(), p.getRelativePath(),
                        p.needsCapture() ? " — must be captured from the live app" : "");
            }
        }
        log.info("[RedTag] Pattern catalogue: {} present, {} missing of {} total",
                present, missing, RedTagPattern.values().length);
    }

    /** @return {@code true} if the image file for this pattern exists on disk. */
    public boolean isAvailable(RedTagPattern key) {
        return Files.isRegularFile(baseDir.resolve(key.getRelativePath()));
    }

    /**
     * Resolves a SikuliX {@link Pattern} for the given logical key, applying the
     * pattern's similarity (or the configured default).
     *
     * @throws AutomationException if the underlying PNG file does not exist
     */
    public Pattern resolve(RedTagPattern key) {
        return cache.computeIfAbsent(key, k -> {
            Path file = baseDir.resolve(k.getRelativePath());
            if (!Files.isRegularFile(file)) {
                throw new AutomationException(
                        "Pattern image not found for " + k.name() + " — expected at " + file
                                + (k.needsCapture()
                                ? ". This image must be captured manually from the running Red Tag app."
                                : ". Re-run the pattern-cropping script."),
                        k.name(), null);
            }
            double similarity = k.getSimilarity() != null
                    ? k.getSimilarity()
                    : properties.getDefaultSimilarity();
            // Application chrome does not follow the form's zoom - see RedTagPattern.FORM_CONTENT.
            return k.isFormContent()
                    ? patternFor(file, similarity)
                    : new Pattern(file.toString()).similar(similarity);
        });
    }

    /**
     * Resolves a pattern at an explicit similarity <b>without</b> touching the cache.
     *
     * <p>Calibration needs this: SikuliX's {@code Pattern.similar} mutates the pattern in place
     * and returns it, so relaxing a cached pattern for a probe would leave every later find
     * running at the probe's threshold.
     */
    public Pattern resolveUncached(RedTagPattern key, double similarity) {
        Path file = baseDir.resolve(key.getRelativePath());
        if (!Files.isRegularFile(file)) {
            throw new AutomationException(
                    "Pattern image not found for " + key.name() + " — expected at " + file,
                    key.name(), null);
        }
        return key.isFormContent()
                ? patternFor(file, similarity, false)
                : new Pattern(file.toString()).similar(similarity);
    }

    public Path getBaseDir() {
        return baseDir;
    }

    // --- Zoom calibration ----------------------------------------------------

    public double getScale() {
        return scale;
    }

    /**
     * Sets the live-form zoom relative to the captured patterns and drops the resolved-pattern
     * cache so subsequent lookups pick up the rescaled images.
     *
     * @param scale 1.0 = the form renders exactly as captured; 2.0 = twice as large on screen
     */
    public void setScale(double scale) {
        if (scale <= 0) throw new IllegalArgumentException("scale must be positive, was " + scale);
        this.scale = scale;
        cache.clear();
        // debug, not info: calibration walks ~30 candidate zooms through here in a couple of
        // seconds, and the only value worth an operator's attention is the one it settles on,
        // which SikuliDriver.calibrateScale logs itself.
        log.debug("[RedTag] Pattern scale set to {}", String.format("%.2f", scale));
    }

    /**
     * Builds a {@link Pattern} for a source PNG at the current {@link #scale}, rescaling and
     * caching the image on disk the first time a zoom level is used.
     *
     * <p>Rescaled patterns match a little less crisply than the original pixels — resampling
     * softens the glyph edges either way — so they are matched with a relaxed similarity. The
     * relaxation is proportional to how far the zoom is from the capture, and is floored at 0.62
     * so a badly-off calibration still cannot start matching arbitrary text.
     */
    private Pattern patternFor(Path source, double similarity) {
        return patternFor(source, similarity, true);
    }

    /**
     * @param relaxWhenScaled {@code false} to use {@code similarity} exactly — calibration ranks
     *                        candidate zooms by score and must not have its threshold moved
     *                        underneath it
     */
    private Pattern patternFor(Path source, double similarity, boolean relaxWhenScaled) {
        if (Math.abs(scale - 1.0) <= SCALE_EPSILON) {
            return new Pattern(source.toString()).similar(similarity);
        }
        Path scaled = scaledCopy(source);
        if (scaled == null) {
            // Rescaling failed — better to try the original than to fail the whole step.
            return new Pattern(source.toString()).similar(similarity);
        }
        double threshold = relaxWhenScaled
                ? Math.max(0.62, similarity - 0.08 - 0.04 * Math.abs(scale - 1.0))
                : similarity;
        return new Pattern(scaled.toString()).similar(threshold);
    }

    /** Returns the rescaled twin of {@code source} for the current scale, creating it if needed. */
    private Path scaledCopy(Path source) {
        Path relative = baseDir.relativize(source);
        Path target = baseDir.resolve(SCALED_ROOT)
                .resolve(String.valueOf(Math.round(scale * 1000)))
                .resolve(relative);
        try {
            if (Files.isRegularFile(target)
                    && Files.getLastModifiedTime(target).compareTo(Files.getLastModifiedTime(source)) >= 0) {
                return target;
            }
            BufferedImage src = ImageIO.read(source.toFile());
            if (src == null) return null;
            int w = Math.max(1, (int) Math.round(src.getWidth() * scale));
            int h = Math.max(1, (int) Math.round(src.getHeight() * scale));
            BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = out.createGraphics();
            try {
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                        RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.drawImage(src, 0, 0, w, h, null);
            } finally {
                g.dispose();
            }
            Files.createDirectories(target.getParent());
            ImageIO.write(out, "png", target.toFile());
            return target;
        } catch (Exception e) {
            log.warn("[RedTag] Could not rescale {} to {}x: {}", relative, scale, e.getMessage());
            return null;
        }
    }

    // --- Per-permit label crops ---------------------------------------------

    /**
     * Folder holding one cropped PNG per checkbox/field label for a permit type —
     * {@code <baseDir>/<permitFolder>/labels/<key>.png} (e.g. {@code safe-work},
     * {@code hot-work}). Runtime resolves these by string key (e.g.
     * {@code "high-temp"}) rather than by {@link RedTagPattern}, so the set can
     * grow without touching the enum.
     */
    public Path getLabelsDir(String permitFolder) {
        return baseDir.resolve(permitFolder).resolve("labels");
    }

    /** @return {@code true} if a label crop exists for this key under the permit folder. */
    public boolean labelExists(String permitFolder, String key) {
        return Files.isRegularFile(getLabelsDir(permitFolder).resolve(key + ".png"));
    }

    /**
     * Resolves a label crop to a SikuliX {@link Pattern}. Uses high similarity
     * (0.85) because at the captured zoom the crops are byte-identical to the
     * on-screen pixels — anything lower would risk neighbouring rows matching.
     * At any other zoom {@link #patternFor} relaxes it to absorb resampling.
     */
    public Pattern resolveLabel(String permitFolder, String key) {
        Path file = getLabelsDir(permitFolder).resolve(key + ".png");
        if (!Files.isRegularFile(file)) {
            throw new AutomationException(
                    "Label pattern not found for '" + permitFolder + "/" + key + "' — expected at " + file,
                    key, null);
        }
        return patternFor(file, 0.85);
    }

    // Safe Work convenience overloads (default folder) — keep existing SW callers working.
    public Path getLabelsDir() {
        return getLabelsDir("safe-work");
    }

    public boolean labelExists(String key) {
        return labelExists("safe-work", key);
    }

    public Pattern resolveLabel(String key) {
        return resolveLabel("safe-work", key);
    }
}
