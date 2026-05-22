package com.dk_power.power_plant_java.sevice.automation.redtag.core;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Pattern;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

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

    private final RedTagAutomationProperties properties;
    private final Map<RedTagPattern, Pattern> cache = new EnumMap<>(RedTagPattern.class);

    /** Absolute directory the pattern PNGs are read from at runtime. */
    private Path baseDir;

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
            return new Pattern(file.toString()).similar(similarity);
        });
    }

    public Path getBaseDir() {
        return baseDir;
    }
}
