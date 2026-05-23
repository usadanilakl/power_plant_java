package com.dk_power.power_plant_java.sevice.automation.redtag;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Hand-crop helper. Crops every SW checkbox row from the zoomed-out screenshot
 * using measured grid coords (column X + first-row Y + per-row Y offset) and
 * writes the PNGs to {@code src/main/resources/automation/redtag/patterns/safe-work/labels/}.
 *
 * <p>Why hand-coords: Tesseract OCR cannot read the labels at this zoom (text is
 * ~9 px tall) — see {@link GenerateSwLabelPatternsIT} for the failed OCR attempt.
 * The form is a fixed grid, so a small set of measured coordinates is enough.
 *
 * <p>PPE rows aren't on a uniform pitch — some columns have "Type [input]" sub-rows
 * between checkbox rows. Per-row Y offsets are specified explicitly for PPE.
 *
 * <p>Run with {@code mvn -Dtest=HandCropSwLabelsIT -DskipTests=false -DfailIfNoTests=false test}.
 */
class HandCropSwLabelsIT {

    private static final String SCREENSHOT =
            "project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png";
    private static final Path OUT_DIR =
            Paths.get("src/main/resources/automation/redtag/patterns/safe-work/labels");

    /** Row-to-row spacing (top of one row to top of next), in source pixels. */
    private static final int ROW_PITCH = 23;
    /** Height of the crop strip — tight to the label so it doesn't bleed. */
    private static final int ROW_H = 15;

    // ---- Hazards: 3 columns, uniform pitch ----
    private static final int HAZ_Y0 = 402;
    private static final int[] HAZ_COL_X = { 820, 1100, 1405 };
    private static final int HAZ_COL_W = 275;
    private static final String[] HAZ_COL1 = {
            "high-temp", "high-pressure", "hazardous-piping", "electrical-testing",
            "energized-electrical-work", "stored-energy", "eye-hazard",
            "egress-access", "ergonomic",
    };
    private static final String[] HAZ_COL2 = {
            "falling-object", "high-noise", "dust-particulate", "combustible-dust",
            "fire-explosion", "hot-surfaces", "slip-trip", "ventilation-required",
            "lighting-restrictions", "exposed-rotating",
    };
    private static final String[] HAZ_COL3 = {
            "chemical-exposure", "lifting-hazard", "hand-traps", "heat-cold-stress",
            "elevated-surface", "environmental", "weather-hazards",
            "testing-troubleshooting", "hexavalent-chromium", "haz-other",
    };

    // ---- Permits: 3 columns, uniform pitch ----
    private static final int PER_Y0 = 685;
    private static final int[] PER_COL_X = { 820, 1100, 1405 };
    private static final int PER_COL_W = 275;
    private static final String[] PER_COL1 = {
            "loto-required", "hot-work-permit", "confined-space",
            "excavation-permit", "energized-elec-wp",
    };
    private static final String[] PER_COL2 = {
            "venting-purging", "jha", "air-monitoring", "lift-plan",
    };
    private static final String[] PER_COL3 = {
            "rescue-plan-review", "fall-rescue-plan", "per-other",
    };

    // ---- PPE: 4 columns. Cols 2/3/4 have "Type [input]" sub-rows between checkbox rows. ----
    private static final int PPE_Y0 = 843;
    private static final int[] PPE_COL_X = { 820, 1020, 1250, 1480 };
    private static final int PPE_COL_W = 200;
    /**
     * Per-column (label, y-offset-from-PPE_Y0). y-offset is the row index in the
     * visual layout — column 2 has sub-rows so its main rows are at offsets
     * 0, 46, 92, 115 (skipping the Type/Type Cut-resistant sub-row slots).
     */
    private static final Row[] PPE_COL1 = {
            row("hardhat", 0),
            row("safety-glasses", 23),
            row("hearing-protection", 46),
            row("protective-footwear", 69),
            row("welding-ppe", 92),
    };
    private static final Row[] PPE_COL2 = {
            row("respirator-dust-mask", 0),
            row("protective-gloves", 46),
            row("air-monitor", 92),
            row("tyvek-suit", 115),
    };
    private static final Row[] PPE_COL3 = {
            row("acid-suit", 0),
            row("barricade", 23),
            row("face-shield", 46),
            row("arc-flash", 69),
            row("gfci", 115),
    };
    private static final Row[] PPE_COL4 = {
            row("purging-ventilation", 0),
            row("fall-protection", 23),
            row("ppe-other", 69),
    };

    private record Row(String key, int yOffset) {}
    private static Row row(String key, int yOffset) { return new Row(key, yOffset); }

    @Test
    void crop() throws Exception {
        BufferedImage src = ImageIO.read(new File(SCREENSHOT));
        Files.createDirectories(OUT_DIR);
        System.out.println("Source: " + src.getWidth() + "x" + src.getHeight() + " -> " + OUT_DIR.toAbsolutePath());

        cropUniform(src, HAZ_Y0, HAZ_COL_X[0], HAZ_COL_W, HAZ_COL1);
        cropUniform(src, HAZ_Y0, HAZ_COL_X[1], HAZ_COL_W, HAZ_COL2);
        cropUniform(src, HAZ_Y0, HAZ_COL_X[2], HAZ_COL_W, HAZ_COL3);
        cropUniform(src, PER_Y0, PER_COL_X[0], PER_COL_W, PER_COL1);
        cropUniform(src, PER_Y0, PER_COL_X[1], PER_COL_W, PER_COL2);
        cropUniform(src, PER_Y0, PER_COL_X[2], PER_COL_W, PER_COL3);
        cropExplicit(src, PPE_Y0, PPE_COL_X[0], PPE_COL_W, PPE_COL1);
        cropExplicit(src, PPE_Y0, PPE_COL_X[1], PPE_COL_W, PPE_COL2);
        cropExplicit(src, PPE_Y0, PPE_COL_X[2], PPE_COL_W, PPE_COL3);
        cropExplicit(src, PPE_Y0, PPE_COL_X[3], PPE_COL_W, PPE_COL4);
    }

    private void cropUniform(BufferedImage src, int y0, int colX, int colW, String[] keys) throws Exception {
        for (int i = 0; i < keys.length; i++) {
            writeCrop(src, keys[i], colX, y0 + i * ROW_PITCH, colW);
        }
    }

    private void cropExplicit(BufferedImage src, int y0, int colX, int colW, Row[] rows) throws Exception {
        for (Row r : rows) {
            writeCrop(src, r.key, colX, y0 + r.yOffset, colW);
        }
    }

    private void writeCrop(BufferedImage src, String key, int x, int y, int w) throws Exception {
        int sw = Math.min(w, src.getWidth() - x);
        int sh = Math.min(ROW_H, src.getHeight() - y);
        BufferedImage strip = src.getSubimage(x, y, sw, sh);
        File out = OUT_DIR.resolve(key + ".png").toFile();
        ImageIO.write(strip, "png", out);
        System.out.printf("  %s -> (%d,%d) %dx%d%n", key, x, y, sw, sh);
    }
}
