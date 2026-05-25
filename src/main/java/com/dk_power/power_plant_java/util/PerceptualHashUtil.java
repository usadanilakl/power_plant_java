package com.dk_power.power_plant_java.util;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

/**
 * Simple 64-bit aHash (average hash) implementation for visual duplicate detection.
 *
 * Algorithm:
 *   1. Shrink image to 8x8 (64 pixels)
 *   2. Convert to grayscale
 *   3. Compute the average pixel intensity
 *   4. For each pixel, set bit = 1 if pixel > average else 0
 *   5. Pack 64 bits into a hex string
 *
 * Comparison via Hamming distance (XOR + popcount) on the 64-bit values.
 *   0     = identical
 *   <= 10 = likely same image (re-export, different DPI)
 *   <= 20 = similar
 *   > 20  = different
 *
 * aHash is simpler than pHash/dHash but works well for binary documents (P&IDs,
 * schematics) where the visual content is high-contrast and structurally stable.
 */
public final class PerceptualHashUtil {

    private static final int SIZE = 8;

    private PerceptualHashUtil() {}

    /** Compute the 64-bit aHash of an image file, returned as a 16-char hex string. */
    public static String computeHash(File imageFile) throws IOException {
        BufferedImage source = ImageIO.read(imageFile);
        if (source == null) {
            throw new IOException("Could not read image: " + imageFile.getAbsolutePath());
        }
        return computeHash(source);
    }

    public static String computeHash(BufferedImage source) {
        BufferedImage scaled = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = scaled.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(source, 0, 0, SIZE, SIZE, null);
        } finally {
            g.dispose();
        }

        // Average intensity
        int[] pixels = new int[SIZE * SIZE];
        int sum = 0;
        for (int y = 0; y < SIZE; y++) {
            for (int x = 0; x < SIZE; x++) {
                int p = scaled.getRGB(x, y) & 0xFF;
                pixels[y * SIZE + x] = p;
                sum += p;
            }
        }
        int avg = sum / pixels.length;

        long bits = 0L;
        for (int i = 0; i < pixels.length; i++) {
            if (pixels[i] > avg) {
                bits |= (1L << i);
            }
        }
        return String.format("%016x", bits);
    }

    /**
     * Hamming distance between two hex-encoded 64-bit hashes (0..64).
     * Returns Integer.MAX_VALUE if either hash is malformed.
     */
    public static int hammingDistance(String hashA, String hashB) {
        if (hashA == null || hashB == null) return Integer.MAX_VALUE;
        try {
            long a = Long.parseUnsignedLong(hashA, 16);
            long b = Long.parseUnsignedLong(hashB, 16);
            return Long.bitCount(a ^ b);
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }
}
