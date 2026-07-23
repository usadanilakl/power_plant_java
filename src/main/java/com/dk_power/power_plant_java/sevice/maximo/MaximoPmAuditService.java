package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto;
import com.dk_power.power_plant_java.dto.maximo.PmAuditCardDto;
import com.dk_power.power_plant_java.dto.maximo.PmAuditRowDto;
import com.dk_power.power_plant_java.dto.maximo.PmCompletionDetailDto;
import com.dk_power.power_plant_java.dto.maximo.RecurringPmDto;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormStatus;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormSubmissionRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * The PM audit view. The <b>list</b> is hub-local (the RecurringPm catalog: cadence, last target date, overdue
 * by schedule) and drives sorting/filtering. The actual <b>completion</b> — last completed/closed WO, its form
 * and comment, the next scheduled WO — is the PM's real Maximo work orders, loaded per PM on expand exactly
 * like the Recurring PMs tab's clock-icon history (see {@code RecurringPmService.occurrences}).
 *
 * <p>A completed WO is "troubled" when a flag {@link #ISSUE_KEYWORDS keyword} appears in its worklog comment
 * (the universal signal — every WO has a worklog, form or not), or, as a bonus when it was completed via one of
 * our forms, when the form carries a failing answer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoPmAuditService {

    /** Put one of these in a WO worklog note to mark that completion troubled (case-insensitive). */
    public static final List<String> ISSUE_KEYWORDS = List.of("#ISSUE", "[ISSUE]", "#FLAG", "#TROUBLE", "TROUBLED");

    /** Form answer values that mean a check did not pass. */
    private static final Set<String> NEGATIVE = Set.of(
            "NOT OK", "NO", "PRESENT", "FAIL", "FAILED", "OBSOLETE", "BAD", "DEFICIENT");

    private static final Set<String> COMPLETED_STATUSES = Set.of("COMP", "CLOSE", "CLOSED");
    private static final Set<String> OPEN_STATUSES = Set.of("WSCH", "WAPPR", "APPR", "INPRG");
    private static final int OCCURRENCE_YEARS = 2;
    private static final int OCC_PAGE_SIZE = 2000;
    private static final int OCC_MAX_PAGES = 3;
    /** Parallel fan-out to Maximo, kept under the HTTP connection pool's cap (MaximoConfig: 20). */
    private static final int AUDIT_CONCURRENCY = 12;

    private final RecurringPmService recurringPms;
    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoWorklogAdapter worklog;
    private final MaximoFormSubmissionRepo submissionRepo;
    private final ObjectMapper objectMapper;

    /**
     * Fully-populated audit cards, all PMs fanned out in parallel: each PM's real Maximo occurrences give the
     * last completed/closed WO (worklog comment + attached form) and the next scheduled WO. Eager, so the cards
     * view is colour-coded and complete with no per-card click. ~2 Maximo calls/PM, bounded by
     * {@link #AUDIT_CONCURRENCY}; ~50-70 PMs finish in a handful of seconds.
     */
    @Transactional(readOnly = true)
    public List<PmAuditCardDto> auditCards(boolean recurringOnly) {
        LocalDate today = LocalDate.now();
        List<RecurringPmDto> pms = recurringPms.getCatalog().stream()
                .filter(pm -> !recurringOnly || isRecurring(pm)).toList();

        // Preload the completed submissions ONCE (main thread) so the parallel tasks touch no JPA.
        Map<String, MaximoFormSubmission> subByWonum = new HashMap<>();
        for (MaximoFormSubmission s : submissionRepo.findByStatusOrderBySubmittedAtDesc(MaximoFormStatus.COMPLETED)) {
            if (s.getWonum() != null && !s.getWonum().isBlank()) subByWonum.putIfAbsent(s.getWonum().trim(), s);
        }

        List<PmAuditCardDto> out = new ArrayList<>();
        if (pms.isEmpty()) return out;
        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(AUDIT_CONCURRENCY, pms.size()))) {
            List<Future<PmAuditCardDto>> futures = new ArrayList<>(pms.size());
            for (RecurringPmDto pm : pms) futures.add(pool.submit(() -> buildCard(pm, subByWonum, today)));
            for (Future<PmAuditCardDto> f : futures) {
                try { out.add(f.get()); }
                catch (Exception e) { log.warn("[Maximo] audit card build failed: {}", e.toString()); }
            }
        }
        return out;
    }

    /** Build one card from a PM's live occurrences + the (in-memory) submission map. Runs on a worker thread: NO JPA. */
    private PmAuditCardDto buildCard(RecurringPmDto pm, Map<String, MaximoFormSubmission> subByWonum, LocalDate today) {
        List<MaximoWorkOrderDto> wos = occurrenceWos(pm, today);
        List<MaximoWorkOrderDto> completed = new ArrayList<>();
        List<MaximoWorkOrderDto> open = new ArrayList<>();
        for (MaximoWorkOrderDto w : wos) {
            String st = (w.getStatus() == null) ? "" : w.getStatus().trim().toUpperCase(Locale.ROOT);
            if (COMPLETED_STATUSES.contains(st)) completed.add(w);
            else if (OPEN_STATUSES.contains(st)) open.add(w);
        }
        MaximoWorkOrderDto last = completed.stream()
                .max(Comparator.comparing(w -> effectiveDate(w), Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
        MaximoWorkOrderDto next = open.stream()
                .min(Comparator.comparing(w -> effectiveDate(w), Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        LocalDate lastDate = effectiveDate(last);
        LocalDate nextDate = effectiveDate(next);

        String comment = null, formName = null;
        Long submissionId = null;
        boolean keywordHit = false, formIssues = false;
        if (last != null) {
            String worklogComment = worklogComment(last.getHref());
            MaximoFormSubmission sub = subByWonum.get(last.getWonum() == null ? "" : last.getWonum().trim());
            Map<String, Object> values = (sub == null) ? Map.of() : parseMap(sub.getValuesJson());
            String findings = (sub == null) ? null : firstNonBlank(values, "findings", "finding", "deficiencies", "comments", "comment");
            formIssues = (sub != null) && autoIssues(values);
            comment = (worklogComment != null && !worklogComment.isBlank()) ? worklogComment : findings;
            keywordHit = containsKeyword(worklogComment) || containsKeyword(findings);
            submissionId = (sub == null) ? null : sub.getId();
            formName = (sub == null) ? null : (sub.getTemplateName() != null ? sub.getTemplateName() : sub.getTemplateFormKey());
        }

        LocalDate overdueOn = firstOverdueDate(next, nextDate, lastDate, pm.getCadence());
        boolean overdue = overdueOn != null && !today.isBefore(overdueOn);   // today >= overdueOn

        return PmAuditCardDto.builder()
                .pmId(pm.getId())
                .pmnum(pm.getPmnum())
                .description(pm.getPmDescription())
                .cadence(pm.getCadence() == null ? null : pm.getCadence().name())
                .recurring(isRecurring(pm))
                .targetDate(pm.getLastTargetDate())
                .lastWonum(last == null ? null : last.getWonum())
                .lastHref(last == null ? null : last.getHref())
                .lastCompletedDate(lastDate)
                .nextWonum(next == null ? null : next.getWonum())
                .nextHref(next == null ? null : next.getHref())
                .nextScheduledDate(nextDate)
                .comment(comment)
                .submissionId(submissionId)
                .formName(formName)
                .assignedTo(firstNonBlankStr(
                        next == null ? null : next.getLeadCraft(),
                        last == null ? null : last.getLeadCraft(),
                        pm.getLead()))
                .overdue(overdue)
                .overdueOn(overdueOn)
                .keywordHit(keywordHit)
                .formIssues(formIssues)
                .hasIssues(keywordHit || formIssues)
                .build();
    }

    /** A PM's work orders over the occurrence window (pmnum, else the exact description phrase). Empty on failure. */
    private List<MaximoWorkOrderDto> occurrenceWos(RecurringPmDto pm, LocalDate today) {
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        if (pm.getPmnum() != null && !pm.getPmnum().isBlank()) {
            c.setPmnum(pm.getPmnum().trim());
        } else if (pm.getPmDescription() != null && !pm.getPmDescription().isBlank()) {
            c.setDescriptionPhrase(pm.getPmDescription().trim());
        } else {
            return List.of();
        }
        c.setReportdateFrom(today.minusYears(OCCURRENCE_YEARS) + "T00:00:00");
        try {
            return workOrders.listAllByCriteria(c, OCC_PAGE_SIZE, OCC_MAX_PAGES);
        } catch (Exception e) {
            log.debug("[Maximo] audit occurrences for PM {} failed: {}", pm.getPmnum(), e.toString());
            return List.of();
        }
    }

    /**
     * The FIRST date the PM is overdue — i.e., its due window has fully elapsed. Overdue is tied to the RANGE,
     * not the target-start passing: the scheduled WO's target start plus one cadence period (weekly → +1 week,
     * monthly → +1 month, …), which is exactly the day the next cycle would begin. So a monthly PM due Aug 1
     * isn't overdue until Sep 1. When no cadence is set, the WO's own target-finish (the last day still due)
     * plus one day is used. Falls back to the last completion + one period when nothing is scheduled. Null when
     * undeterminable (then the card shows no counter and isn't flagged overdue).
     */
    private static LocalDate firstOverdueDate(MaximoWorkOrderDto next, LocalDate nextStart,
                                              LocalDate lastCompleted, RecurrenceCadence cadence) {
        if (next != null && nextStart != null) {
            LocalDate byCadence = periodEnd(nextStart, cadence);        // start + one period = first overdue day
            if (byCadence != null) return byCadence;
            LocalDate finish = firstDate(next.getTargetFinish());       // target finish = last day still due
            if (finish != null) return finish.plusDays(1);              // → first overdue day
            return nextStart.plusDays(1);                               // no period info: overdue the day after start
        }
        // Nothing scheduled: the last completion is a full period old ⇒ a missed cycle.
        return periodEnd(lastCompleted, cadence);
    }

    /**
     * One full cadence period after {@code start} — the next cycle's boundary, which is the FIRST day the current
     * cycle is overdue. Null when the cadence gives no fixed window (OTHER / unset).
     */
    private static LocalDate periodEnd(LocalDate start, RecurrenceCadence cadence) {
        if (start == null || cadence == null) return null;
        return switch (cadence) {
            case DAY -> start.plusDays(1);
            case WEEK -> start.plusWeeks(1);
            case BIWEEK -> start.plusWeeks(2);
            case MONTH -> start.plusMonths(1);
            case QUARTER -> start.plusMonths(3);
            case OTHER -> null;
        };
    }

    private static LocalDate effectiveDate(MaximoWorkOrderDto w) {
        if (w == null) return null;
        return firstDate(w.getTargetStart(), w.getSchedstart(), w.getReportdate());
    }
    private static LocalDate firstDate(String... isos) {
        for (String s : isos) {
            if (s == null || s.length() < 10) continue;
            try { return LocalDate.parse(s.substring(0, 10)); } catch (Exception ignore) { /* try next */ }
        }
        return null;
    }

    /** The audit list: every PM (or only genuinely-recurring ones), newest known target first. Hub-local. */
    @Transactional(readOnly = true)
    public List<PmAuditRowDto> audit(boolean recurringOnly) {
        LocalDate today = LocalDate.now();
        List<PmAuditRowDto> out = new ArrayList<>();
        for (RecurringPmDto pm : recurringPms.getCatalog()) {
            boolean recurring = isRecurring(pm);
            if (recurringOnly && !recurring) continue;
            out.add(PmAuditRowDto.builder()
                    .pmId(pm.getId())
                    .pmnum(pm.getPmnum())
                    .description(pm.getPmDescription())
                    .cadence(pm.getCadence() == null ? null : pm.getCadence().name())
                    .recurring(recurring)
                    .targetDate(pm.getLastTargetDate())
                    .lastWonum(pm.getLastWonum())
                    .occurrenceCount(pm.getOccurrenceCount())
                    .overdue(overdue(pm, today))
                    .build());
        }
        return out;
    }

    /**
     * Completion detail for one WO (the last completed occurrence of a PM). Reads the WO's worklog for the
     * comment + keyword flag, and joins any completion-form submission for the PDF + failing-answer signal.
     * {@code href} may be blank — the worklog is then skipped and only the form (by wonum) is used.
     */
    @Transactional(readOnly = true)
    public PmCompletionDetailDto completionDetail(String wonum, String href) {
        if (wonum == null || wonum.isBlank()) return null;

        String worklogComment = worklogComment(href);

        MaximoFormSubmission sub = submissionRepo.findByWonumOrderByDateModifiedDesc(wonum.trim()).stream()
                .filter(s -> s.getStatus() == MaximoFormStatus.COMPLETED)
                .findFirst().orElse(null);

        Map<String, Object> values = (sub == null) ? Map.of() : parseMap(sub.getValuesJson());
        String formFindings = (sub == null) ? null : firstNonBlank(values, "findings", "finding", "deficiencies", "comments", "comment");
        boolean formIssues = (sub != null) && autoIssues(values);

        String comment = (worklogComment != null && !worklogComment.isBlank()) ? worklogComment : formFindings;
        boolean keywordHit = containsKeyword(comment) || containsKeyword(formFindings);

        return PmCompletionDetailDto.builder()
                .wonum(wonum.trim())
                .submissionId(sub == null ? null : sub.getId())
                .formName(sub == null ? null : (sub.getTemplateName() != null ? sub.getTemplateName() : sub.getTemplateFormKey()))
                .comment(comment)
                .keywordHit(keywordHit)
                .formIssues(formIssues)
                .hasIssues(keywordHit || formIssues)
                .build();
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /** Combine a WO's worklog notes (newest first) into one comment string; null/empty on failure or none. */
    private String worklogComment(String href) {
        if (href == null || href.isBlank()) return null;
        try {
            List<MaximoWorklogDto> logs = worklog.listForWo(href);
            StringBuilder sb = new StringBuilder();
            for (MaximoWorklogDto w : logs) {
                String head = (w.getDescription() == null ? "" : w.getDescription().trim());
                String body = (w.getLongDescription() == null ? "" : w.getLongDescription().trim());
                String line = (head + (body.isBlank() ? "" : (head.isBlank() ? "" : " — ") + body)).trim();
                if (line.isBlank()) continue;
                if (sb.length() > 0) sb.append('\n');
                sb.append(line);
            }
            return sb.length() == 0 ? null : sb.toString();
        } catch (Exception e) {
            log.debug("[Maximo] audit worklog fetch failed for {}: {}", href, e.toString());
            return null;
        }
    }

    private static boolean containsKeyword(String text) {
        if (text == null || text.isBlank()) return false;
        String upper = text.toUpperCase(Locale.ROOT);
        for (String kw : ISSUE_KEYWORDS) if (upper.contains(kw)) return true;
        return false;
    }

    private static boolean isRecurring(RecurringPmDto pm) {
        if (pm.getOccurrenceCount() != null && pm.getOccurrenceCount() >= 2) return true;
        return pm.getCadence() != null && !"OTHER".equalsIgnoreCase(pm.getCadence().name());
    }

    /** Next-due = last target + interval; overdue when that is before today. */
    private static boolean overdue(RecurringPmDto pm, LocalDate today) {
        Integer interval = pm.getIntervalDays();
        LocalDate base = pm.getLastTargetDate();
        if (interval == null || interval <= 0 || base == null) return false;
        return base.plusDays(interval).isBefore(today);
    }

    private boolean autoIssues(Map<String, Object> values) {
        if (values == null) return false;
        for (Map.Entry<String, Object> e : values.entrySet()) {
            String key = e.getKey() == null ? "" : e.getKey().toLowerCase(Locale.ROOT);
            Object v = e.getValue();
            if ((key.contains("finding") || key.contains("deficien") || key.contains("issue"))
                    && v != null && !v.toString().isBlank()) return true;
            for (String token : flatten(v)) {
                if (NEGATIVE.contains(token.trim().toUpperCase(Locale.ROOT))) return true;
            }
        }
        return false;
    }

    private static List<String> flatten(Object v) {
        if (v == null) return List.of();
        if (v instanceof Collection<?> col) {
            List<String> out = new ArrayList<>();
            for (Object o : col) if (o != null) out.add(o.toString());
            return out;
        }
        return List.of(v.toString());
    }

    /** First non-blank of the given strings, trimmed; null if all blank. */
    private static String firstNonBlankStr(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v.trim();
        return null;
    }

    private static String firstNonBlank(Map<String, Object> values, String... keys) {
        for (String k : keys) {
            Object v = values.get(k);
            if (v != null && !v.toString().isBlank()) return v.toString().trim();
        }
        return null;
    }

    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}); }
        catch (Exception e) { return Map.of(); }
    }
}
