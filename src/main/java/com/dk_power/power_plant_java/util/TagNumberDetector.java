package com.dk_power.power_plant_java.util;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TagNumberDetector {

    public record DetectedTag(String rawText, String normalized, TagMatchType matchType) {}

    public enum TagMatchType { FULL, PARTIAL }

    private static final int FULL_MATCH_MIN_LENGTH = 8;

    // Patterns ordered from most specific to least specific.
    // All applied against uppercased text; non-overlapping via consumed positions.
    private static final List<Pattern> PATTERNS = List.of(
            // 1. Unit-prefixed with dashes: XX-segment(-segment)*
            //    Covers: 01-ACC-HEX-01B, 01-VBFW131, 01-PCV-AXS713, 01-HPL-1312-19,
            //    00-V-SWS001-JG, 02-LVF-PPL-013-25, 02-MOV-HIS943H-JG, 01-MOV-CND201.
            Pattern.compile("\\b(\\d{2}-[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){0,4})\\.?(?=\\s|,|;|$|\\)|\\])"),

            // 2. Unit-prefixed KKS (no dash after unit digits): XXLetters+Digits
            //    Covers: 01MAM30AA101-H01, 01MBP01AA801, 02LCA14AA707, 02MAWO1AA002(F)
            Pattern.compile("\\b(\\d{2}[A-Z]{2,5}[A-Z0-9]{2,}(?:-[A-Z]\\d{2,3})?(?:\\([A-Z]\\))?)\\b"),

            // 3. Fragments without unit prefix (marked as PARTIAL)
            //    Covers: MPM-02B, CPL-06
            Pattern.compile("\\b([A-Z]{2,4}-\\d{2,4}[A-Z]?)\\b")
    );

    private static final Set<String> NOISE_WORDS = Set.of(
            "NOIDENTIFICATION", "NO", "NODATA"
    );

    public List<DetectedTag> detectTagNumbers(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return Collections.emptyList();
        }

        // Pre-process: uppercase, collapse whitespace
        String text = inputText.toUpperCase()
                .replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        // Track consumed character positions to prevent overlapping matches
        boolean[] consumed = new boolean[text.length()];
        LinkedHashMap<String, DetectedTag> results = new LinkedHashMap<>();

        for (Pattern pattern : PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                int start = matcher.start(1);
                int end = matcher.end(1);

                // Skip if region overlaps with already-consumed match
                boolean overlaps = false;
                for (int i = start; i < end; i++) {
                    if (consumed[i]) {
                        overlaps = true;
                        break;
                    }
                }
                if (overlaps) continue;

                String raw = matcher.group(1);
                String normalized = normalize(raw);

                if (isNoise(normalized)) continue;
                if (results.containsKey(normalized)) continue;

                // Mark positions as consumed
                for (int i = start; i < end; i++) {
                    consumed[i] = true;
                }

                TagMatchType matchType = normalized.length() >= FULL_MATCH_MIN_LENGTH
                        ? TagMatchType.FULL
                        : TagMatchType.PARTIAL;

                results.put(normalized, new DetectedTag(raw, normalized, matchType));
            }
        }

        return new ArrayList<>(results.values());
    }

    private String normalize(String tag) {
        String result = tag.trim().toUpperCase();
        // Remove trailing dots
        while (result.endsWith(".")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private boolean isNoise(String tag) {
        if (tag.length() < 3) return true;
        // Pure numbers or pure letters (no mix)
        if (tag.matches("\\d+")) return true;
        if (tag.matches("[A-Z]+")) return true;
        if (tag.matches("[A-Z]+-[A-Z]+")) return true; // letter-dash-letter like NO-ID
        // Known noise prefixes
        if (tag.startsWith("LOTONODATA")) return true;
        if (NOISE_WORDS.contains(tag)) return true;
        return false;
    }
}
