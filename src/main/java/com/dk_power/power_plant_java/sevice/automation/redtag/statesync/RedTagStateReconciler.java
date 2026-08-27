package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Read-only reconciliation service: given a {@link RedTagScrapeResult}, decides
 * what should happen to local LOTOs to bring them into line with what Red Tag
 * currently shows.
 *
 * <p>The result is a {@link DiffPlan} of proposed actions — no writes here.
 * Applying the plan is the caller's job (see {@code RedTagStateSyncAutomationService.apply}).
 * The user always reviews and can toggle any entry off before submitting, so
 * the reconciler errs on the side of surfacing more entries rather than fewer.
 *
 * <p>Match key precedence:
 * <ol>
 *   <li>Red Tag number ({@code lotoNumber} → {@code Loto.redTagNum}) — strongest.</li>
 *   <li>Lock box number ({@code lockBox} → {@code Loto.boxNumber}) — only for
 *       {@link RedTagStatus#ACTIVE}, and only when the local LOTO is in a
 *       non-closed status. Skipped for terminal-status scrapes because closed
 *       local LOTOs share box numbers with newer active ones over time.</li>
 *   <li>Fuzzy job-description (token Jaccard on lowercase words) — never
 *       matches automatically; produces {@link DiffAction#ORPHAN} entries with
 *       up to three candidate ids for the user to pair by hand.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagStateReconciler {

    private static final double FUZZY_MIN_JACCARD = 0.5;
    private static final int MAX_ORPHAN_CANDIDATES = 3;

    private final LotoRepo lotoRepo;

    @Transactional(readOnly = true)
    public DiffPlan buildPlan(RedTagScrapeResult scrape) {
        Objects.requireNonNull(scrape, "scrape result required");
        Objects.requireNonNull(scrape.getStatus(), "scrape status required");

        List<LocalLotoView> allLocals = lotoRepo.findAllForReconcile();
        MatchIndex idx = MatchIndex.build(allLocals);
        String targetLocalStatus = scrape.getStatus().localPermitStatus();

        List<DiffEntry> entries = new ArrayList<>();
        Set<Long> matchedLocalIds = new HashSet<>();
        int keyCounter = 0;

        for (RedTagRow row : scrape.getRows() != null ? scrape.getRows() : List.<RedTagRow>of()) {
            LocalLotoView match = null;
            String strategy = "NONE";

            if (notBlank(row.getLotoNumber())) {
                match = idx.byRedTagNum.get(row.getLotoNumber().trim());
                if (match != null) strategy = "RED_TAG_NUMBER";
            }
            if (match == null && scrape.getStatus() == RedTagStatus.ACTIVE
                    && notBlank(row.getLockBox())) {
                Integer box = tryParseInt(row.getLockBox());
                if (box != null) {
                    match = idx.activeBoxOwner(box);
                    if (match != null) strategy = "LOCK_BOX";
                }
            }

            if (match != null) {
                matchedLocalIds.add(match.getId());
                entries.add(buildMatchedEntry(nextKey(++keyCounter), row, match,
                        targetLocalStatus, strategy, scrape.getStatus()));
                continue;
            }

            // No strong match — try fuzzy job description across all locals.
            List<LocalLotoView> fuzzy = fuzzyCandidates(row.getJobDescription(), allLocals);
            if (fuzzy.isEmpty()) {
                entries.add(buildCreateEntry(nextKey(++keyCounter), row, targetLocalStatus));
            } else {
                entries.add(buildOrphanEntry(nextKey(++keyCounter), row, fuzzy));
            }
        }

        // For an ACTIVE-tab scrape, propose closing local LOTOs that are still
        // marked Active locally but did NOT appear in Red Tag's active list.
        // The user can toggle any of these off in the preview.
        int localOnlyCount = 0;
        if (scrape.getStatus() == RedTagStatus.ACTIVE) {
            for (LocalLotoView l : allLocals) {
                if (!"Active".equals(l.getPermitStatusName())) continue;
                if (matchedLocalIds.contains(l.getId())) continue;
                entries.add(buildCloseSuggestionEntry(nextKey(++keyCounter), l));
                localOnlyCount++;
            }
        }

        DiffPlan plan = new DiffPlan();
        plan.setStatus(scrape.getStatus());
        plan.setBuiltAt(Instant.now());
        plan.setEntries(entries);
        plan.setMatchedCount(matchedLocalIds.size());
        plan.setLocalOnlyCount(localOnlyCount);
        log.info("[RedTag] Diff plan for {} scrape: {} rows → {} matched, {} entries, {} local-only",
                scrape.getStatus(), scrape.getRows() != null ? scrape.getRows().size() : 0,
                matchedLocalIds.size(), entries.size(), localOnlyCount);
        return plan;
    }

    // --- entry builders ------------------------------------------------------

    private DiffEntry buildMatchedEntry(String key, RedTagRow row, LocalLotoView local,
                                        String targetLocalStatus, String strategy,
                                        RedTagStatus scrapeStatus) {
        DiffEntry e = baseFromRow(key, row);
        e.setLocalLotoId(local.getId());
        e.setLocalPermitNumber(local.getPermitNumber());
        e.setLocalPermitStatus(local.getPermitStatusName());
        e.setLocalJobDescription(local.getWorkScope());
        e.setLocalRequestor(local.getLotoRequestor());
        e.setLocalBoxNumber(local.getBoxNumber());
        e.setLocalRedTagNum(local.getRedTagNum());
        e.setMatchStrategy(strategy);

        List<String> changed = new ArrayList<>();
        if (fieldDiffers(local.getPermitStatusName(), targetLocalStatus)) changed.add("permitStatus");
        if (fieldDiffers(local.getWorkScope(), row.getJobDescription())) changed.add("jobDescription");
        if (fieldDiffers(local.getLotoRequestor(), row.getRequestor())) changed.add("requestor");
        if (notBlank(row.getLotoNumber()) && fieldDiffers(local.getRedTagNum(), row.getLotoNumber())) {
            changed.add("redTagNum");
        }
        e.setChangedFields(changed);

        boolean isTerminal = scrapeStatus == RedTagStatus.CLOSED
                || scrapeStatus == RedTagStatus.CANCELED;
        if (isTerminal && !"Closed".equals(local.getPermitStatusName())) {
            e.setAction(DiffAction.CLOSE);
            e.setReason("Red Tag " + scrapeStatus.name() + " → close local LOTO");
        } else if (changed.isEmpty()) {
            // No fields to change but still list it as UPDATE + skip=true so the
            // user can flip it back on if they disagree with the reconciler.
            e.setAction(DiffAction.UPDATE);
            e.setSkip(true);
            e.setReason("Already in sync — no changes proposed");
        } else {
            e.setAction(DiffAction.UPDATE);
            e.setReason("Matched by " + strategy + "; " + changed.size() + " field(s) differ");
        }
        return e;
    }

    private DiffEntry buildCreateEntry(String key, RedTagRow row, String targetLocalStatus) {
        DiffEntry e = baseFromRow(key, row);
        e.setAction(DiffAction.CREATE);
        e.setMatchStrategy("NONE");
        e.setReason("Present in Red Tag, no local LOTO → create as " + targetLocalStatus);
        return e;
    }

    private DiffEntry buildOrphanEntry(String key, RedTagRow row, List<LocalLotoView> fuzzy) {
        DiffEntry e = baseFromRow(key, row);
        e.setAction(DiffAction.ORPHAN);
        e.setMatchStrategy("FUZZY_JOB_DESCRIPTION");
        e.setCandidateLocalLotoIds(fuzzy.stream()
                .limit(MAX_ORPHAN_CANDIDATES)
                .map(LocalLotoView::getId)
                .collect(Collectors.toList()));
        e.setSkip(true); // orphans default to skipped — user must pair explicitly
        e.setReason("Fuzzy job-description match (" + e.getCandidateLocalLotoIds().size()
                + " candidate" + (e.getCandidateLocalLotoIds().size() == 1 ? "" : "s")
                + ") — pair manually to apply");
        return e;
    }

    private DiffEntry buildCloseSuggestionEntry(String key, LocalLotoView local) {
        DiffEntry e = new DiffEntry();
        e.setKey(key);
        e.setAction(DiffAction.CLOSE);
        e.setLocalLotoId(local.getId());
        e.setLocalPermitNumber(local.getPermitNumber());
        e.setLocalPermitStatus(local.getPermitStatusName());
        e.setLocalJobDescription(local.getWorkScope());
        e.setLocalRequestor(local.getLotoRequestor());
        e.setLocalBoxNumber(local.getBoxNumber());
        e.setLocalRedTagNum(local.getRedTagNum());
        e.setMatchStrategy("LOCAL_ONLY");
        e.setSkip(true); // default off — user must opt in to auto-close
        e.setReason("Local Active LOTO absent from Red Tag ACTIVE tab — close locally?");
        return e;
    }

    private DiffEntry baseFromRow(String key, RedTagRow row) {
        DiffEntry e = new DiffEntry();
        e.setKey(key);
        e.setRedTagLotoNumber(row.getLotoNumber());
        e.setRedTagLockBox(row.getLockBox());
        e.setRedTagJobDescription(row.getJobDescription());
        e.setRedTagRequestor(row.getRequestor());
        return e;
    }

    private String nextKey(int counter) { return "e-" + counter; }

    // --- fuzzy match ---------------------------------------------------------

    private List<LocalLotoView> fuzzyCandidates(String jobDesc, List<LocalLotoView> allLocals) {
        if (!notBlank(jobDesc)) return List.of();
        Set<String> qTokens = tokens(jobDesc);
        if (qTokens.isEmpty()) return List.of();
        List<Scored> scored = new ArrayList<>();
        for (LocalLotoView l : allLocals) {
            Set<String> lTokens = tokens(l.getWorkScope());
            if (lTokens.isEmpty()) continue;
            double jaccard = jaccard(qTokens, lTokens);
            if (jaccard >= FUZZY_MIN_JACCARD) scored.add(new Scored(l, jaccard));
        }
        scored.sort(Comparator.comparingDouble((Scored s) -> s.score).reversed());
        return scored.stream().limit(MAX_ORPHAN_CANDIDATES)
                .map(s -> s.view).collect(Collectors.toList());
    }

    private static double jaccard(Set<String> a, Set<String> b) {
        Set<String> inter = new HashSet<>(a);
        inter.retainAll(b);
        Set<String> uni = new HashSet<>(a);
        uni.addAll(b);
        return uni.isEmpty() ? 0.0 : (double) inter.size() / (double) uni.size();
    }

    private static Set<String> tokens(String s) {
        if (s == null || s.isBlank()) return Set.of();
        Set<String> out = new HashSet<>();
        for (String t : s.toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
            if (t.length() >= 3) out.add(t);
        }
        return out;
    }

    // --- helpers -------------------------------------------------------------

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    private static boolean fieldDiffers(String local, String remote) {
        String l = local == null ? "" : local.trim();
        String r = remote == null ? "" : remote.trim();
        // A blank scraped value is "unknown", not "empty" — never propose to
        // wipe a locally-filled field just because OCR missed it.
        if (r.isEmpty()) return false;
        return !l.equalsIgnoreCase(r);
    }

    private static Integer tryParseInt(String s) {
        try { return Integer.parseInt(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    private record Scored(LocalLotoView view, double score) {}

    /** Precomputed lookup index over the local LOTOs. */
    private static final class MatchIndex {
        final Map<String, LocalLotoView> byRedTagNum;
        final Map<Integer, List<LocalLotoView>> byBox;

        private MatchIndex(Map<String, LocalLotoView> byRedTagNum,
                           Map<Integer, List<LocalLotoView>> byBox) {
            this.byRedTagNum = byRedTagNum;
            this.byBox = byBox;
        }

        static MatchIndex build(List<LocalLotoView> locals) {
            Map<String, LocalLotoView> rt = new HashMap<>();
            Map<Integer, List<LocalLotoView>> box = new HashMap<>();
            for (LocalLotoView l : locals) {
                if (l.getRedTagNum() != null && !l.getRedTagNum().isBlank()) {
                    // Multiple locals with the same redTagNum shouldn't happen —
                    // if it does, take whichever loaded first and log a warning.
                    LocalLotoView prev = rt.putIfAbsent(l.getRedTagNum().trim(), l);
                    if (prev != null && !prev.getId().equals(l.getId())) {
                        log.warn("[RedTag] Duplicate local redTagNum '{}' on Loto ids {} and {} — first wins",
                                l.getRedTagNum(), prev.getId(), l.getId());
                    }
                }
                if (l.getBoxNumber() != null) {
                    box.computeIfAbsent(l.getBoxNumber(), k -> new ArrayList<>()).add(l);
                }
            }
            return new MatchIndex(rt, box);
        }

        /**
         * Owner of a lock box within the current non-closed local LOTOs. A box
         * is reused over time — closed LOTOs at the same box aren't candidates.
         * Prefers Active > Test > Building > Closed order.
         */
        LocalLotoView activeBoxOwner(int boxNumber) {
            List<LocalLotoView> at = byBox.getOrDefault(boxNumber, List.of());
            LocalLotoView pick = null;
            int bestRank = Integer.MAX_VALUE;
            for (LocalLotoView l : at) {
                int rank = rank(l.getPermitStatusName());
                if (rank < bestRank) { bestRank = rank; pick = l; }
            }
            // Skip when the only match is Closed — reusing a stale closed box is not a real match.
            if (pick != null && "Closed".equals(pick.getPermitStatusName())) return null;
            return pick;
        }

        private int rank(String status) {
            if ("Active".equals(status)) return 0;
            if ("Test".equals(status)) return 1;
            if ("Building".equals(status)) return 2;
            if (status == null) return 3;
            return 4; // Closed and anything else
        }
    }
}
