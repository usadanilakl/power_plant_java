package com.dk_power.power_plant_java.sevice.automation.redtag;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * One-shot debug helper: writes magnified crops of the zoomed-out SW screenshot
 * to {@code target/sw-inspect/} so the layout can be inspected at full pixel
 * detail. Used to identify checkbox pixel coordinates by visual inspection.
 *
 * <p>Run with {@code mvn -Dtest=InspectSwFormIT -DskipTests=false -DfailIfNoTests=false test}.
 */
class InspectSwFormIT {

    private static final String SCREENSHOT =
            "project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png";
    private static final Path OUT_DIR = Paths.get("target/sw-inspect");

    @Test
    void cropAndMagnify() throws Exception {
        BufferedImage source = ImageIO.read(new File(SCREENSHOT));
        Files.createDirectories(OUT_DIR);
        System.out.println("Source: " + source.getWidth() + "x" + source.getHeight());

        // Form is centred horizontally. The horizontal rules at y=137/227/260 from OCR
        // tell us the form starts around x=834 and ends around x=1710 (banner area).
        // The checkbox sections are below the banner — slice that whole band and 5x it.
        magnify(source, "form-full",     800,  100, 920, 1200, 2);
        magnify(source, "hazards-band",  800,  280, 920,  240, 4);
        magnify(source, "permits-band",  800,  520, 920,  130, 4);
        magnify(source, "ppe-band",      800,  650, 920,  130, 4);

        System.out.println("Wrote crops to " + OUT_DIR.toAbsolutePath());
    }

    /** Crops (x,y,w,h) from source, scales by factor, writes PNG with axis labels. */
    private static void magnify(BufferedImage src, String name, int x, int y, int w, int h, int scale) throws Exception {
        int sw = Math.min(w, src.getWidth() - x);
        int sh = Math.min(h, src.getHeight() - y);
        BufferedImage crop = src.getSubimage(x, y, sw, sh);
        BufferedImage scaled = new BufferedImage(sw * scale, sh * scale, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = scaled.createGraphics();
        g.drawImage(crop, 0, 0, sw * scale, sh * scale, null);
        // Grid every 20 source-pixels (= 20*scale screen-pixels) so coords are easy to read.
        g.setColor(new Color(255, 0, 0, 80));
        for (int gx = 0; gx < sw; gx += 20) g.drawLine(gx * scale, 0, gx * scale, sh * scale);
        for (int gy = 0; gy < sh; gy += 20) g.drawLine(0, gy * scale, sw * scale, gy * scale);
        // Stronger lines every 100 px so we can quickly read coordinates.
        g.setColor(new Color(0, 0, 255, 140));
        for (int gx = 0; gx < sw; gx += 100) g.drawLine(gx * scale, 0, gx * scale, sh * scale);
        for (int gy = 0; gy < sh; gy += 100) g.drawLine(0, gy * scale, sw * scale, gy * scale);
        g.dispose();
        File out = OUT_DIR.resolve(name + "_x" + x + "_y" + y + "_w" + sw + "_h" + sh + ".png").toFile();
        ImageIO.write(scaled, "png", out);
        System.out.println("  wrote " + out.getName());
    }
}
