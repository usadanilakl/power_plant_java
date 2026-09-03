package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.AssignLotoRequest;
import com.dk_power.power_plant_java.dto.maximo.AssignLotoResultDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto;
import com.dk_power.power_plant_java.dto.maximo.OutageCoverageDto;
import com.dk_power.power_plant_java.dto.permits.LotoLinkDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Coverage join for the Outage Items page: pairs each outage work order with the non-closed LOTOs that cover it.
 * "Covered" is true when EITHER (a) the WO number is on a LOTO's structured link ({@code linkedWonums}), OR
 * (b) one of the LOTO's identifiers (red-tag #, local/doc #, permit #) appears in the WO's LOTO worklog text.
 *
 * <p>Bulk-assign links a chosen LOTO to many WOs at once and posts a "Covered by LOTO: …" worklog to each — the
 * comment that both audits the assignment in Maximo and feeds the parsed side of the coverage check on reload.
 *
 * <p>Gated with the Maximo beans it uses ({@code maximo.api-key}); {@link NgLotoService} is always present.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "maximo.api-key")
public class MaximoOutageCoverageService {

    private static final List<String> OUTAGE_TYPES = List.of("PLAN", "SNOW");
    /** Below this length a numeric identifier is too generic to match safely in free text (structured link still covers it). */
    private static final int MIN_PARSE_TOKEN_LEN = 3;

    private final MaximoWorkOrderAdapter workOrders;
    private final NgLotoService lotoService;

    /** Precompiled matcher for one non-closed LOTO: its linked WO numbers + word-boundary patterns for its identifiers. */
    private record LotoMatcher(Long id, List<String> wonums, List<Pattern> patterns) {}

    /** Outage WOs enriched with coverage flags + the non-closed LOTO catalog (for grouping headers + the picker). */
    public OutageCoverageDto listCoverage(String siteid, int pageSize) {
        List<MaximoWorkOrderAdapter.OutageWo> raws = workOrders.listOutageWithNotes(OUTAGE_TYPES, siteid, pageSize);
        List<LotoLinkDto> lotos = lotoService.findActiveLight();

        List<LotoMatcher> matchers = new ArrayList<>(lotos.size());
        for (LotoLinkDto l : lotos) {
            List<Pattern> patterns = new ArrayList<>();
            addTokenPattern(patterns, l.redTagNum());
            addTokenPattern(patterns, l.docNum() == null ? null : l.docNum().toString());
            addTokenPattern(patterns, l.permitNumber());
            matchers.add(new LotoMatcher(l.id(),
                    l.linkedWonums() == null ? List.of() : l.linkedWonums(), patterns));
        }

        List<MaximoWorkOrderDto> items = new ArrayList<>(raws.size());
        for (MaximoWorkOrderAdapter.OutageWo raw : raws) {
            MaximoWorkOrderDto d = raw.wo();
            String wonum = d.getWonum() == null ? "" : d.getWonum().trim();
            String noteText = concatNotes(raw.lotoNotes());
            String[] range = noteRange(raw.lotoNotes());
            d.setLotoNoteEarliest(range[0]);
            d.setLotoNoteLatest(range[1]);

            LinkedHashSet<Long> covering = new LinkedHashSet<>();
            for (LotoMatcher m : matchers) {
                boolean structured = !wonum.isEmpty()
                        && m.wonums().stream().anyMatch(w -> w != null && w.equalsIgnoreCase(wonum));
                boolean parsed = !noteText.isEmpty()
                        && m.patterns().stream().anyMatch(p -> p.matcher(noteText).find());
                if (structured || parsed) covering.add(m.id());
            }
            d.setCoveringLotoIds(new ArrayList<>(covering));
            d.setCovered(!covering.isEmpty());
            items.add(d);
        }
        return new OutageCoverageDto(items, lotos);
    }

    /**
     * Link one LOTO to many outage WOs and post the "Covered by LOTO: …" worklog to each newly-linked WO. The
     * structured link goes through {@link NgLotoService#linkWo} (its own transaction, so the change syncs); the
     * Maximo comments are written afterwards, best-effort — a comment failure never undoes the link.
     */
    public AssignLotoResultDto assignLoto(Long lotoId, List<AssignLotoRequest.Target> targets, String user) {
        if (lotoId == null) throw new IllegalArgumentException("lotoId is required");
        LotoLinkDto link = lotoService.findLinkById(lotoId);   // throws if the LOTO doesn't exist
        Set<String> already = (link.linkedWonums() == null ? List.<String>of() : link.linkedWonums())
                .stream().map(s -> s.toLowerCase()).collect(Collectors.toSet());

        List<AssignLotoRequest.Target> newly = new ArrayList<>();
        int alreadyLinked = 0;
        for (AssignLotoRequest.Target t : (targets == null ? List.<AssignLotoRequest.Target>of() : targets)) {
            if (t == null || t.wonum() == null || t.wonum().isBlank()) continue;
            String w = t.wonum().trim();
            if (already.contains(w.toLowerCase())) { alreadyLinked++; continue; }
            lotoService.linkWo(lotoId, w);   // structured link + @PostUpdate sync
            newly.add(t);
        }

        LotoLinkDto updated = lotoService.findLinkById(lotoId);
        String comment = buildCoveredByComment(updated, user);
        int commentsWritten = 0;
        List<String> failures = new ArrayList<>();
        for (AssignLotoRequest.Target t : newly) {
            if (t.href() == null || t.href().isBlank()) { failures.add(t.wonum() + " (no work-order link)"); continue; }
            try {
                workOrders.addLotoNote(t.href(), comment);
                commentsWritten++;
            } catch (Exception e) {
                failures.add(t.wonum());
                log.warn("[Outage] 'Covered by LOTO' comment failed for {}: {}", t.wonum(), e.getMessage());
            }
        }
        return new AssignLotoResultDto(newly.size(), alreadyLinked, commentsWritten, failures, updated);
    }

    // ── helpers ─────────────────────────────────────────────────────────────────

    /** The Maximo worklog body written on assign — the fields the user asked for, each line skipped when blank. */
    private static String buildCoveredByComment(LotoLinkDto l, String user) {
        StringBuilder sb = new StringBuilder();
        String id = (l.permitNumber() != null && !l.permitNumber().isBlank()) ? l.permitNumber() : ("LOTO " + l.id());
        sb.append("Covered by LOTO ").append(id);
        String scope = firstNonBlank(l.workScope(), l.equipmentSystem());
        if (scope != null) sb.append('\n').append("Scope: ").append(scope.trim());
        if (notBlank(l.redTagNum()))   sb.append('\n').append("Red Tag #: ").append(l.redTagNum().trim());
        if (l.docNum() != null)        sb.append('\n').append("Local #: ").append(l.docNum());
        if (l.boxNumber() != null)     sb.append('\n').append("LOTO Box #: ").append(l.boxNumber());
        if (notBlank(user))            sb.append('\n').append("Linked by ").append(user.trim());
        return sb.toString();
    }

    /** Word-boundary pattern for a numeric/alphanumeric identifier, so "12" doesn't match inside "123". */
    private static void addTokenPattern(List<Pattern> out, String token) {
        if (token == null) return;
        String t = token.trim();
        if (t.length() < MIN_PARSE_TOKEN_LEN) return;
        out.add(Pattern.compile("(?<![A-Za-z0-9])" + Pattern.quote(t) + "(?![A-Za-z0-9])",
                Pattern.CASE_INSENSITIVE));
    }

    /** All LOTO-note text (title + body) joined, for the parsed-coverage scan. */
    private static String concatNotes(List<MaximoWorklogDto> notes) {
        if (notes == null || notes.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (MaximoWorklogDto n : notes) {
            if (n.getDescription() != null) sb.append(n.getDescription()).append(' ');
            if (n.getLongDescription() != null) sb.append(n.getLongDescription()).append(' ');
        }
        return sb.toString();
    }

    /** [earliest, latest] createdate across the LOTO notes (ISO strings compare lexicographically); nulls when none. */
    private static String[] noteRange(List<MaximoWorklogDto> notes) {
        String min = null, max = null;
        if (notes != null) {
            for (MaximoWorklogDto n : notes) {
                String cd = n.getCreatedate();
                if (cd == null || cd.isBlank()) continue;
                if (min == null || cd.compareTo(min) < 0) min = cd;
                if (max == null || cd.compareTo(max) > 0) max = cd;
            }
        }
        return new String[]{min, max};
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static String firstNonBlank(String a, String b) {
        if (notBlank(a)) return a;
        if (notBlank(b)) return b;
        return null;
    }
}
