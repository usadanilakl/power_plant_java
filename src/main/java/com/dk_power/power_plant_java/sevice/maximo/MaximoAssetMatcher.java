package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import com.dk_power.power_plant_java.entities.maximo.AssetMatchConfidence;
import com.dk_power.power_plant_java.util.TagNumberDetector;
import com.dk_power.power_plant_java.util.TagNumberDetector.DetectedTag;
import com.dk_power.power_plant_java.util.TagNumberDetector.TagMatchType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Matches free-text Maximo ticket descriptions to a real asset by tag number, tolerating PARTIAL tags.
 *
 * <p>Reuses {@link TagNumberDetector} to pull tag tokens from the text, then resolves them against an
 * {@link AssetIndex} built once per run from the live Maximo asset master. Matching is layered:
 * <ol>
 *   <li>if the ticket already carries a valid Maximo assetnum → EXACT;</li>
 *   <li>a FULL tag that resolves to exactly one asset (exact, or delimiter-insensitive "compact") → STRONG;</li>
 *   <li>otherwise collect the assets whose compact tag CONTAINS a token → PARTIAL suggestions.</li>
 * </ol>
 * Stateless/thread-safe; the per-run index is passed in.
 */
@Component
@RequiredArgsConstructor
public class MaximoAssetMatcher {

    /** Ignore tokens shorter than this (compacted) for the partial substring scan — too noisy. */
    private static final int MIN_PARTIAL_LEN = 4;
    /** Cap suggestions per single tag token during the partial scan. */
    private static final int SUGGEST_PER_TAG = 6;
    /** Cap total suggestions stored on a ticket. */
    private static final int MAX_SUGGESTIONS = 8;

    private final TagNumberDetector tagDetector;

    /** Immutable per-run lookup over the site's assets. */
    public static final class AssetIndex {
        /** normalized (upper) assetnum → canonical assetnum. */
        private final Map<String, String> exact;
        /** compact key (alnum only, upper) → canonical assetnums (may be >1). */
        private final Map<String, List<String>> compact;
        /** [compactKey, canonicalAssetnum] pairs for the bounded substring scan. */
        private final List<String[]> compactPairs;

        private AssetIndex(Map<String, String> exact, Map<String, List<String>> compact, List<String[]> compactPairs) {
            this.exact = exact;
            this.compact = compact;
            this.compactPairs = compactPairs;
        }

        public int size() { return exact.size(); }
    }

    public AssetIndex buildIndex(List<MaximoAssetDto> assets) {
        Map<String, String> exact = new LinkedHashMap<>();
        Map<String, List<String>> compact = new LinkedHashMap<>();
        List<String[]> compactPairs = new ArrayList<>();
        if (assets != null) {
            for (MaximoAssetDto a : assets) {
                if (a == null || a.getAssetnum() == null || a.getAssetnum().isBlank()) continue;
                String canonical = a.getAssetnum().trim();
                String norm = canonical.toUpperCase();
                exact.putIfAbsent(norm, canonical);
                String c = compactKey(norm);
                if (c.isEmpty()) continue;
                compact.computeIfAbsent(c, k -> new ArrayList<>()).add(canonical);
                compactPairs.add(new String[]{c, canonical});
            }
        }
        return new AssetIndex(exact, compact, compactPairs);
    }

    /** The outcome of matching one ticket. */
    public record MatchResult(String identifiedAssetnum, AssetMatchConfidence confidence, String matchSource,
                              List<String> suggested, List<String> extractedTags) {}

    public MatchResult match(AssetIndex index, String maximoAssetnum, String title, String longDescription) {
        String text = ((title == null ? "" : title) + " " + (longDescription == null ? "" : longDescription)).trim();
        List<DetectedTag> tags = tagDetector.detectTagNumbers(text);
        List<String> extracted = new ArrayList<>();
        for (DetectedTag t : tags) if (!extracted.contains(t.normalized())) extracted.add(t.normalized());

        String identified = null;
        AssetMatchConfidence conf = AssetMatchConfidence.NONE;
        String source = "NONE";
        LinkedHashSet<String> suggested = new LinkedHashSet<>();

        // 1. Trust a valid assetnum Maximo already has on the ticket.
        if (maximoAssetnum != null && !maximoAssetnum.isBlank()) {
            String norm = maximoAssetnum.trim().toUpperCase();
            String hit = index.exact.get(norm);
            if (hit != null) {
                identified = hit;
                conf = AssetMatchConfidence.EXACT;
                source = "MAXIMO_FIELD";
            }
        }

        // 2. Resolve FULL tags from the text to exactly one asset.
        if (identified == null) {
            for (DetectedTag t : tags) {
                if (t.matchType() != TagMatchType.FULL) continue;
                String norm = t.normalized();
                String exactHit = index.exact.get(norm);
                if (exactHit != null) { identified = exactHit; conf = AssetMatchConfidence.STRONG; source = "TEXT_EXACT"; break; }
                List<String> compactHits = index.compact.get(compactKey(norm));
                if (compactHits != null && compactHits.size() == 1) {
                    identified = compactHits.get(0); conf = AssetMatchConfidence.STRONG; source = "TEXT_COMPACT"; break;
                }
                if (compactHits != null) suggested.addAll(compactHits); // ambiguous compact → suggestions
            }
        }

        // 3. Partial/suggestion scan (only when we have no strong identification).
        if (identified == null) {
            for (DetectedTag t : tags) {
                if (suggested.size() >= MAX_SUGGESTIONS) break;   // already have enough — skip the O(assets) scan
                String c = compactKey(t.normalized());
                if (c.length() < MIN_PARTIAL_LEN) continue;
                int added = 0;
                for (String[] pair : index.compactPairs) {
                    if (pair[0].contains(c)) {
                        suggested.add(pair[1]);
                        if (++added >= SUGGEST_PER_TAG) break;
                    }
                }
            }
        }

        // Finalize: drop the identified asset from the suggestion set; cap.
        List<String> suggestions = new ArrayList<>();
        for (String s : suggested) {
            if (identified != null && s.equalsIgnoreCase(identified)) continue;
            suggestions.add(s);
            if (suggestions.size() >= MAX_SUGGESTIONS) break;
        }
        if (identified == null && !suggestions.isEmpty()) {
            conf = AssetMatchConfidence.PARTIAL;
            source = "TEXT_PARTIAL";
        }

        return new MatchResult(identified, conf, source, suggestions, extracted);
    }

    /** Delimiter-insensitive key: uppercase, keep only A–Z0–9. So "01-ACC-HEX-01B" == "01 ACC HEX 01B". */
    static String compactKey(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char ch = Character.toUpperCase(s.charAt(i));
            if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) b.append(ch);
        }
        return b.toString();
    }
}
