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

/**
 * Diagnostic: stacks 50 narrow horizontal strips (y, y+5, y+10, ...) with the
 * source-y label printed on each. By reading which strip contains which form
 * row we get exact pixel coordinates for the hand-crop grid.
 */
class InspectSwYBandsIT {

    private static final String SCREENSHOT =
            "project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png";
    private static final Path OUT_DIR = Paths.get("target/sw-inspect");

    @Test
    void stackStrips() throws Exception {
        BufferedImage src = ImageIO.read(new File(SCREENSHOT));
        Files.createDirectories(OUT_DIR);

        // Region of interest: middle of the form, x=800..1700. Cover y=350..900.
        // Vertical step = 5 source px. Strip height = 7 source px (enough to see one row).
        int x = 800, w = 920;
        int yStart = 280, yEnd = 900, step = 5, stripH = 7;
        int scale = 3;
        int labelW = 70;

        int rows = (yEnd - yStart) / step;
        BufferedImage out = new BufferedImage(labelW + w * scale, rows * stripH * scale + 6, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = out.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, out.getWidth(), out.getHeight());
        g.setFont(new Font("SansSerif", Font.BOLD, 14));

        for (int i = 0; i < rows; i++) {
            int sy = yStart + i * step;
            if (sy + stripH > src.getHeight()) break;
            BufferedImage strip = src.getSubimage(x, sy, w, stripH);
            int destY = i * stripH * scale;
            g.drawImage(strip, labelW, destY, w * scale, stripH * scale, null);
            g.setColor(i % 4 == 0 ? Color.RED : Color.BLACK);
            g.drawString("y=" + sy, 4, destY + stripH * scale / 2 + 5);
        }

        g.dispose();
        File outFile = OUT_DIR.resolve("y-strips.png").toFile();
        ImageIO.write(out, "png", outFile);
        System.out.println("Wrote " + outFile + " (" + out.getWidth() + "x" + out.getHeight() + ")");
    }
}
