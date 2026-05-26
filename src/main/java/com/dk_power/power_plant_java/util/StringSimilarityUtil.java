package com.dk_power.power_plant_java.util;

/**
 * Lightweight string similarity helpers — no external dependency.
 * Used for fuzzy file-number / name matching during duplicate detection.
 */
public final class StringSimilarityUtil {

    private StringSimilarityUtil() {}

    /**
     * Normalize a string for similarity comparison: lowercase, trim, collapse whitespace.
     * Preserves separators like '.', '-', '_' so Levenshtein distance reflects structural changes.
     */
    public static String normalize(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    /**
     * Classic Levenshtein edit distance with O(min(a,b)) memory.
     * Returns {@link Integer#MAX_VALUE} for null inputs.
     */
    public static int levenshtein(String a, String b) {
        if (a == null || b == null) return Integer.MAX_VALUE;
        if (a.equals(b)) return 0;
        if (a.isEmpty()) return b.length();
        if (b.isEmpty()) return a.length();

        // Ensure b is the shorter string for memory savings
        if (a.length() < b.length()) {
            String tmp = a;
            a = b;
            b = tmp;
        }

        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;

        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);
            for (int j = 1; j <= b.length(); j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                curr[j] = Math.min(
                        Math.min(prev[j] + 1, curr[j - 1] + 1),
                        prev[j - 1] + cost
                );
            }
            // swap prev <-> curr
            int[] swap = prev;
            prev = curr;
            curr = swap;
        }
        return prev[b.length()];
    }
}
