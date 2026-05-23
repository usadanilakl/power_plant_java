package com.dk_power.power_plant_java.sevice.automation.redtag.tools;

import com.dk_power.power_plant_java.sevice.automation.redtag.core.PatternCatalog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Match;
import org.sikuli.script.OCR;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * One-time generator: loads the Safe Work screenshot, OCRs each section to find
 * every checkbox label, and crops a small "checkbox + label" strip image per
 * label into {@code safe-work/labels/}. Runtime then uses fast deterministic
 * SikuliX image matching against those crops — no OCR at automation time.
 *
 * <p>Triggered via {@code POST /ng/red-tag-automation/admin/generate-sw-label-patterns}
 * and meant to be run <b>once</b> per machine after the SW screenshot is captured
 * there. The generated PNGs land in the runtime pattern folder and survive Spring
 * restarts (bundled resources are extracted alongside but never overwrite generated
 * files that don't exist in the bundle).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SwLabelPatternGenerator {

    /** Default screenshot path (project-relative) — the one supplied for the SW rebuild. */
    public static final String DEFAULT_SCREENSHOT =
            "project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png";

    /** How far LEFT of an OCR'd label to extend the crop so the checkbox lands inside it. */
    private static final int CROP_LEFT_PAD = 25;
    private static final int CROP_RIGHT_PAD = 5;
    private static final int CROP_VERT_PAD = 2;

    /**
     * Section regions inside the screenshot — y bounds chosen to include all label
     * lines for that section. Per-section OCR keeps the "Other" disambiguation
     * (it appears once in each section).
     */
    private static final Section HAZARDS = new Section("hazards", 0, 395, 2560, 270);
    private static final Section PERMITS = new Section("permits", 0, 680, 2560, 135);
    private static final Section PPE     = new Section("ppe",     0, 830, 2560, 150);

    /** {key, OCR aliases...}. Aliases tried in order; first substring match (normalised) wins. */
    private static final String[][] HAZ_LABELS = {
            {"high-temp", "High Temperature"},
            {"high-pressure", "High Pressure"},
            {"hazardous-piping", "Hazardous or Flammable", "Flammable Piping", "Hazardous"},
            {"electrical-testing", "Electrical Testing"},
            {"energized-electrical-work", "Energized Electrical Work"},
            {"stored-energy", "Stored Energy"},
            {"eye-hazard", "Eye Hazard"},
            {"egress-access", "Egress"},
            {"ergonomic", "Ergonomic"},
            {"falling-object", "Falling Object"},
            {"high-noise", "High Noise"},
            {"dust-particulate", "Dust/Particulate", "Particulate"},
            {"combustible-dust", "Combustible Dust"},
            {"fire-explosion", "Fire/Explosion", "Explosion"},
            {"hot-surfaces", "Hot Surfaces"},
            {"slip-trip", "Slip/Trip", "Slip"},
            {"ventilation-required", "Ventilation Req", "Ventilation"},
            {"lighting-restrictions", "Lighting"},
            {"exposed-rotating", "Exposed Rotating", "Rotating Parts"},
            {"chemical-exposure", "Chemical Exposure"},
            {"lifting-hazard", "Lifting Hazard"},
            {"hand-traps", "Hand Traps"},
            {"heat-cold-stress", "Heat/Cold", "Cold Stress"},
            {"elevated-surface", "Elevated"},
            {"environmental", "Environmental"},
            {"weather-hazards", "Weather"},
            {"testing-troubleshooting", "Troubleshooting"},
            {"hexavalent-chromium", "Hexavalent"},
            {"haz-other", "Other"},
    };

    private static final String[][] PER_LABELS = {
            {"loto-required", "LOTO Required"},
            {"hot-work-permit", "Hot Work Permit"},
            {"confined-space", "Confined Space"},
            {"excavation-permit", "Excavation"},
            {"energized-elec-wp", "Energized Electrical WP", "Electrical WP"},
            {"venting-purging", "Venting", "Purging Procedure"},
            {"jha", "JHA"},
            {"air-monitoring", "Air Monitoring"},
            {"lift-plan", "Lift Plan"},
            {"rescue-plan-review", "Rescue Plan Review", "Space Rescue"},
            {"fall-rescue-plan", "Fall Rescue"},
            {"per-other", "Other"},
    };

    private static final String[][] PPE_LABELS = {
            {"hardhat", "Hardhat"},
            {"safety-glasses", "Safety Glasses"},
            {"hearing-protection", "Hearing Protection", "Hearing"},
            {"protective-footwear", "Protective Footwear"},
            {"welding-ppe", "Welding PPE"},
            {"respirator-dust-mask", "Respirator", "Dust Mask"},
            {"protective-gloves", "Protective Gloves"},
            {"air-monitor", "Air Monitor"},
            {"tyvek-suit", "Tyvek"},
            {"acid-suit", "Acid Suit", "Rainsuit"},
            {"barricade", "Barricade", "Rope Off"},
            {"face-shield", "Face Shield", "Goggles"},
            {"arc-flash", "Arc Flash", "Shock PPE"},
            {"gfci", "GFCI"},
            {"purging-ventilation", "Purging"},
            {"fall-protection", "Fall Protection", "Restraint"},
            {"ppe-other", "Other"},
    };

    private final PatternCatalog catalog;

    /** Reads the default screenshot, generates label crops, returns a summary. */
    public Result generate() throws IOException {
        return generate(DEFAULT_SCREENSHOT);
    }

    public Result generate(String screenshotPath) throws IOException {
        File file = new File(screenshotPath);
        if (!file.exists()) {
            throw new IOException("Screenshot not found: " + file.getAbsolutePath());
        }
        BufferedImage source = ImageIO.read(file);
        Path outDir = catalog.getBaseDir().resolve("safe-work").resolve("labels");
        Files.createDirectories(outDir);

        Result result = new Result();
        result.outputDir = outDir.toString();
        generateSection(source, HAZARDS, HAZ_LABELS, outDir, result);
        generateSection(source, PERMITS, PER_LABELS, outDir, result);
        generateSection(source, PPE,     PPE_LABELS, outDir, result);
        log.info("[SwLabelGen] Done: {} generated, {} missed -> {}",
                result.generated.size(), result.missed.size(), result.outputDir);
        return result;
    }

    private void generateSection(BufferedImage source, Section sect, String[][] labels,
                                 Path outDir, Result result) throws IOException {
        // Clamp section bounds to the image so getSubimage doesn't blow up
        int sx = Math.max(0, sect.x);
        int sy = Math.max(0, sect.y);
        int sw = Math.min(source.getWidth() - sx, sect.w);
        int sh = Math.min(source.getHeight() - sy, sect.h);
        BufferedImage sectionImg = source.getSubimage(sx, sy, sw, sh);
        List<Match> lines = OCR.readLines(sectionImg);
        log.info("[SwLabelGen] {} section at ({},{}) {}x{}: {} OCR lines",
                sect.name, sx, sy, sw, sh, lines.size());
        for (Match line : lines) {
            log.info("[SwLabelGen]   '{}' at ({},{}) {}x{}",
                    line.getText(), line.x, line.y, line.w, line.h);
        }
        for (String[] entry : labels) {
            String key = entry[0];
            String[] aliases = Arrays.copyOfRange(entry, 1, entry.length);
            Match m = findLine(lines, aliases);
            if (m == null) {
                log.warn("[SwLabelGen] MISS {} (tried {})", key, Arrays.toString(aliases));
                result.missed.add(key);
                continue;
            }
            // Match coords are section-relative; convert to screenshot coords.
            int abx = sx + m.x;
            int aby = sy + m.y;
            int cropX = Math.max(0, abx - CROP_LEFT_PAD);
            int cropY = Math.max(0, aby - CROP_VERT_PAD);
            int cropW = Math.min(source.getWidth() - cropX, m.w + CROP_LEFT_PAD + CROP_RIGHT_PAD);
            int cropH = Math.min(source.getHeight() - cropY, m.h + 2 * CROP_VERT_PAD);
            BufferedImage crop = source.getSubimage(cropX, cropY, cropW, cropH);
            File out = outDir.resolve(key + ".png").toFile();
            ImageIO.write(crop, "png", out);
            log.info("[SwLabelGen] OK {} -> {} ({}x{} at {},{})",
                    key, out.getName(), cropW, cropH, cropX, cropY);
            result.generated.add(key);
        }
    }

    private static Match findLine(List<Match> lines, String[] aliases) {
        for (String alias : aliases) {
            String needle = normalize(alias);
            for (Match line : lines) {
                if (normalize(line.getText()).contains(needle)) return line;
            }
        }
        return null;
    }

    private static String normalize(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private record Section(String name, int x, int y, int w, int h) {}

    public static class Result {
        public String outputDir;
        public List<String> generated = new ArrayList<>();
        public List<String> missed = new ArrayList<>();
    }
}
