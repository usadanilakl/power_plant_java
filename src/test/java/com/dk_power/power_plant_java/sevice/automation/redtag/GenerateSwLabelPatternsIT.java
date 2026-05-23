package com.dk_power.power_plant_java.sevice.automation.redtag;

import org.junit.jupiter.api.Test;
import org.sikuli.script.Match;
import org.sikuli.script.OCR;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Offline build helper. Slices the bundled SW screenshot into ~58 checkbox PNGs
 * directly into {@code src/main/resources/automation/redtag/patterns/safe-work/labels/}
 * so they ship with the JAR — no per-machine generation step.
 *
 * <p>Run via:
 * {@code mvn -Dtest=GenerateSwLabelPatternsIT -DskipTests=false -DfailIfNoTests=false test}
 *
 * <p>Deliberately NOT a {@code @SpringBootTest} — the slicing only needs an image
 * and SikuliX OCR, and the legacy {@code RedTagAutomationService} bean fails to
 * construct off the {@code J:/} drive so the full Spring context can't load.
 *
 * <p>Inspect the generated PNGs visually before committing. Anything in the
 * {@code missed} log line needs a hand-crop from the source screenshot.
 */
class GenerateSwLabelPatternsIT {

    private static final String SCREENSHOT =
            "project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png";
    private static final Path OUTPUT_DIR =
            Paths.get("src/main/resources/automation/redtag/patterns/safe-work/labels");

    private static final int CROP_LEFT_PAD = 25;
    private static final int CROP_RIGHT_PAD = 5;
    private static final int CROP_VERT_PAD = 2;

    /** Section regions inside the 2556x1391 screenshot. */
    private record Section(String name, int x, int y, int w, int h) {}
    private static final Section HAZARDS = new Section("hazards", 0, 395, 2556, 270);
    private static final Section PERMITS = new Section("permits", 0, 680, 2556, 135);
    private static final Section PPE     = new Section("ppe",     0, 830, 2556, 150);

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

    @Test
    void sliceAndCopyToResources() throws Exception {
        File file = new File(SCREENSHOT);
        if (!file.exists()) {
            throw new IllegalStateException("Screenshot not found: " + file.getAbsolutePath());
        }
        BufferedImage source = ImageIO.read(file);
        Files.createDirectories(OUTPUT_DIR);

        List<String> generated = new ArrayList<>();
        List<String> missed = new ArrayList<>();
        sliceSection(source, HAZARDS, HAZ_LABELS, generated, missed);
        sliceSection(source, PERMITS, PER_LABELS, generated, missed);
        sliceSection(source, PPE,     PPE_LABELS, generated, missed);

        System.out.println("[SwLabelGen] Generated " + generated.size() + ": " + generated);
        System.out.println("[SwLabelGen] Missed    " + missed.size() + ": " + missed);
        System.out.println("[SwLabelGen] Output:   " + OUTPUT_DIR.toAbsolutePath());
    }

    private static void sliceSection(BufferedImage source, Section sect, String[][] labels,
                                     List<String> generated, List<String> missed) throws Exception {
        int sx = Math.max(0, sect.x);
        int sy = Math.max(0, sect.y);
        int sw = Math.min(source.getWidth() - sx, sect.w);
        int sh = Math.min(source.getHeight() - sy, sect.h);
        BufferedImage sectionImg = source.getSubimage(sx, sy, sw, sh);
        List<Match> lines = OCR.readLines(sectionImg);
        System.out.println("[SwLabelGen] " + sect.name + " section: " + lines.size() + " OCR lines");
        for (Match line : lines) {
            System.out.printf("[SwLabelGen]   '%s' at (%d,%d) %dx%d%n",
                    line.getText(), line.x, line.y, line.w, line.h);
        }
        for (String[] entry : labels) {
            String key = entry[0];
            String[] aliases = Arrays.copyOfRange(entry, 1, entry.length);
            Match m = findLine(lines, aliases);
            if (m == null) {
                System.out.println("[SwLabelGen] MISS " + key + " (tried " + Arrays.toString(aliases) + ")");
                missed.add(key);
                continue;
            }
            int abx = sx + m.x;
            int aby = sy + m.y;
            int cropX = Math.max(0, abx - CROP_LEFT_PAD);
            int cropY = Math.max(0, aby - CROP_VERT_PAD);
            int cropW = Math.min(source.getWidth() - cropX, m.w + CROP_LEFT_PAD + CROP_RIGHT_PAD);
            int cropH = Math.min(source.getHeight() - cropY, m.h + 2 * CROP_VERT_PAD);
            BufferedImage crop = source.getSubimage(cropX, cropY, cropW, cropH);
            File out = OUTPUT_DIR.resolve(key + ".png").toFile();
            ImageIO.write(crop, "png", out);
            System.out.printf("[SwLabelGen] OK %s -> %s (%dx%d at %d,%d)%n",
                    key, out.getName(), cropW, cropH, cropX, cropY);
            generated.add(key);
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
}
