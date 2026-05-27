package com.dk_power.power_plant_java.util;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

/**
 * 64-bit dHash (difference hash) for visual duplicate detection.
 *
 * Encodes whether each pixel is brighter than its right neighbor — captures
 * gradient direction, which on line drawings (P&IDs, schematics) is the
 * structural signal you actually want. Robust to small re-renders, DPI
 * changes, and PdfBox-rewriting that doesn't alter rendered pixels.
 *
 *   9x8 grayscale → 8 rows × 8 horizontal-diff bits = 64-bit fingerprint.
 *
 * Typical thresholds (lower than aHash):
 *   0     = identical render
 *   <= 6  = same source, different export/DPI
 *   <= 12 = visually similar
 *   > 12  = different
 *
 * Previously used aHash (average hash) — replaced because it produced
 * near-zero hashes on sparse line drawings, where most pixels share the
 * white-paper background and thresholding against the mean collapses.
 */
public final class PerceptualHashUtil {

    /** dHash needs one extra horizontal column so each row produces SIZE horizontal diffs. */
    private static final int SIZE = 8;
    private static final int WIDTH = SIZE + 1;

    private PerceptualHashUtil() {}

    /** Compute the 64-bit dHash of an image file, returned as a 16-char hex string. */
    public static String computeHash(File imageFile) throws IOException {
        BufferedImage source = ImageIO.read(imageFile);
        if (source == null) {
            throw new IOException("Could not read image: " + imageFile.getAbsolutePath());
        }
        return computeHash(source);
    }

    public static String computeHash(BufferedImage source) {
        BufferedImage scaled = new BufferedImage(WIDTH, SIZE, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = scaled.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(source, 0, 0, WIDTH, SIZE, null);
        } finally {
            g.dispose();
        }

        long bits = 0L;
        int bitIndex = 0;
        for (int y = 0; y < SIZE; y++) {
            int left = scaled.getRGB(0, y) & 0xFF;
            for (int x = 1; x < WIDTH; x++) {
                int right = scaled.getRGB(x, y) & 0xFF;
                if (left > right) {
                    bits |= (1L << bitIndex);
                }
                left = right;
                bitIndex++;
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
