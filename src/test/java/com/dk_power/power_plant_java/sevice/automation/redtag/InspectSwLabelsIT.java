package com.dk_power.power_plant_java.sevice.automation.redtag;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Stitches every generated label crop into one tall mosaic with the key name
 * printed next to each row, so we can verify all 58 crops in a single image.
 */
class InspectSwLabelsIT {

    private static final Path LABELS_DIR =
            Paths.get("src/main/resources/automation/redtag/patterns/safe-work/labels");
    private static final Path OUT = Paths.get("target/sw-inspect/labels-mosaic.png");

    @Test
    void mosaic() throws Exception {
        File[] pngs = LABELS_DIR.toFile().listFiles((d, n) -> n.endsWith(".png"));
        if (pngs == null || pngs.length == 0) {
            throw new IllegalStateException("No PNGs in " + LABELS_DIR);
        }
        Arrays.sort(pngs, Comparator.comparing(File::getName));
        int scale = 4;
        int labelW = 280;
        int rowH = 15 * scale + 4;
        int maxW = 0;
        for (File f : pngs) {
            BufferedImage b = ImageIO.read(f);
            maxW = Math.max(maxW, b.getWidth() * scale);
        }
        int totalH = pngs.length * rowH + 10;
        int totalW = labelW + maxW + 10;

        BufferedImage out = new BufferedImage(totalW, totalH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = out.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, totalW, totalH);
        g.setFont(new Font("Monospaced", Font.BOLD, 14));

        for (int i = 0; i < pngs.length; i++) {
            BufferedImage strip = ImageIO.read(pngs[i]);
            int y = i * rowH;
            g.setColor(Color.BLACK);
            g.drawString(pngs[i].getName().replace(".png", ""), 6, y + rowH / 2 + 5);
            g.drawImage(strip, labelW, y, strip.getWidth() * scale, strip.getHeight() * scale, null);
        }
        g.dispose();
        Files.createDirectories(OUT.getParent());
        ImageIO.write(out, "png", OUT.toFile());
        System.out.println("Wrote " + OUT.toAbsolutePath() + " (" + totalW + "x" + totalH + ")");
    }
}
