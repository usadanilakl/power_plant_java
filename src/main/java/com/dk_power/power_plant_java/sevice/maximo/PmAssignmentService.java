package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.PmAssignRequest;
import com.dk_power.power_plant_java.dto.maximo.PmLeadDto;
import com.dk_power.power_plant_java.dto.maximo.PmPendingAssignmentDto;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Computes proposed assignees for WAPPR recurring-PM work orders (by matching the PM's shift against
 * the {@code ShiftDay} roster on the WO's due date) and applies approvals (set lead + changeStatus
 * APPR). See project/features/maximo/pm-auto-assignment-design.md.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PmAssignmentService {

    private static final int PAGE_SIZE = 200;
    private static final int MAX_PAGES = 25;

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoBundleService bundles;
    private final RecurringPmService recurringPmService;
    private final ShiftDayService shiftDayService;

    /**
     * WSCH/WAPPR work orders awaiting scheduling/approval, each FLAGGED recurring if it matches the
     * recurring-PM catalog (by pmnum or description), with a proposed assignee.
     *
     * Assignee = the LEAD OPERATOR on the PM's shift that day. Each roster name is resolved to a User
     * live: first by the user's explicit {@code scheduleName} alias, then by the import-time fuzzy
     * {@code userId} — and only lead operators are kept (assignment is "to leads only").
     */
    /** Statuses that mean "needs scheduling/approval": PM-generated WOs land in WSCH, manual ones in WAPPR. */
    private static final List<String> PENDING_STATUSES = List.of("WSCH", "WAPPR");

    public List<PmPendingAssignmentDto> pendingAssignments() {
        // WSCH ("waiting to be scheduled") + WAPPR ("waiting on approval"); no worktype filter.
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setStatusIn(PENDING_STATUSES);
        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(c, PAGE_SIZE, MAX_PAGES);

        Map<String, RecurringPm> byPmnum = new HashMap<>();
        Map<String, RecurringPm> byDesc = new HashMap<>();
        for (RecurringPm r : recurringPmService.allCatalog()) {
            if (r.getPmnum() != null && !r.getPmnum().isBlank()) byPmnum.putIfAbsent(r.getPmnum().trim(), r);
            String k = RecurringPmService.normDesc(r.getPmDescription());
            if (k != null) byDesc.putIfAbsent(k, r);
        }
        // Lead operators, indexed for live resolution: by explicit scheduleName alias and by id (fuzzy fallback).
        Map<String, User> leadByScheduleName = new HashMap<>();
        Map<Long, User> leadById = new HashMap<>();
        for (User u : bundles.leadOperators()) {
            if (u.getId() != null) leadById.put(u.getId(), u);
            if (u.getScheduleName() != null && !u.getScheduleName().isBlank()) {
                leadByScheduleName.put(normName(u.getScheduleName()), u);
            }
        }

        List<PmPendingAssignmentDto> out = new ArrayList<>();
        for (MaximoWorkOrderDto w : wos) {
            // Match to the recurring catalog by pmnum first, then by normalized description.
            RecurringPm pm = null;
            if (w.getPmnum() != null && !w.getPmnum().isBlank()) pm = byPmnum.get(w.getPmnum().trim());
            if (pm == null) { String k = RecurringPmService.normDesc(w.getDescription()); if (k != null) pm = byDesc.get(k); }
            boolean recurring = pm != null;

            LocalDate target = firstNonNullDate(w.getTargetStart(), w.getSchedstart(), w.getReportdate());
            if (target == null) target = LocalDate.now();
            ShiftPreference shift = (pm != null && pm.getShift() != null) ? pm.getShift() : ShiftPreference.EITHER;

            // Snap to the PM's preferred weekday, constrained by cadence: WEEKLY stays in the WO's own
            // ISO week, MONTHLY stays in the WO's month (see effectiveTargetDate).
            Integer dow = pm == null ? null : pm.getPreferredDayOfWeek();
            RecurrenceCadence cadence = pm == null ? null : pm.getCadence();
            LocalDate effective = effectiveTargetDate(target, dow, cadence);
            LocalDate effectiveFinish = periodEndDate(effective, cadence);

            ShiftDayDto day = shiftDayService.getByDate(effective);
            List<PmPendingAssignmentDto.PersonOption> candidates =
                    leadsOnShift(day, shift, leadByScheduleName, leadById);
            PmPendingAssignmentDto.PersonOption proposed = candidates.isEmpty() ? null : candidates.get(0);

            out.add(PmPendingAssignmentDto.builder()
                    .href(w.getHref())
                    .wonum(w.getWonum())
                    .pmnum(w.getPmnum())
                    .description(w.getDescription())
                    .status(w.getStatus())
                    .recurring(recurring)
                    .recurringPmId(pm == null ? null : pm.getId())
                    .targetDate(effective.toString())
                    .targetFinish(effectiveFinish == null ? null : effectiveFinish.toString())
                    .shift(shift)
                    .cadence(cadence)
                    .preferredDayOfWeek(dow)
                    .currentLead(w.getLeadCraft())
                    .proposedPersonid(proposed == null ? null : proposed.getPersonid())
                    .proposedName(proposed == null ? null : proposed.getName())
                    .note(day == null ? "No schedule loaded for " + effective
                            : (candidates.isEmpty() ? "No one on " + shift + " shift that day" : null))
                    .candidates(candidates)
                    .build());
        }
        // Recurring first, then by WO number.
        out.sort(Comparator.comparing((PmPendingAssignmentDto d) -> !Boolean.TRUE.equals(d.getRecurring()))
                .thenComparing(d -> d.getWonum() == null ? "" : d.getWonum()));
        return out;
    }

    /** Apply approvals: for each item set the lead (if given) then changeStatus → APPR. Per-item errors are collected. */
    public Map<String, Object> assign(PmAssignRequest req) {
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            return Map.of("approved", 0, "errors", List.of());
        }
        int approved = 0;
        List<Map<String, String>> errors = new ArrayList<>();
        for (PmAssignRequest.Item it : req.getItems()) {
            if (it == null || it.getHref() == null || it.getHref().isBlank()) continue;
            try {
                if (it.getPersonid() != null && !it.getPersonid().isBlank()) {
                    workOrders.setLead(it.getHref(), it.getPersonid());
                }
                // Push the target start + period-end finish onto the WO in ONE write (best-effort: a failed
                // write here must NOT block approval — Maximo may not allow the fields in every status).
                if (it.getTargetDate() != null && !it.getTargetDate().isBlank()) {
                    try {
                        LocalDate start = LocalDate.parse(it.getTargetDate().trim());
                        LocalDate finish = (it.getTargetFinish() != null && !it.getTargetFinish().isBlank())
                                ? LocalDate.parse(it.getTargetFinish().trim()) : start;
                        workOrders.setTargetWindow(it.getHref(), start, finish);
                    } catch (Exception tex) {
                        log.warn("[PM] setTargetWindow {} -> {}..{} failed: {}",
                                it.getHref(), it.getTargetDate(), it.getTargetFinish(), tex.getMessage());
                    }
                }
                workOrders.changeStatus(it.getHref(), "APPR", req.getMemo());
                approved++;
            } catch (Exception e) {
                log.warn("[PM] assign {} failed: {}", it.getHref(), e.getMessage());
                errors.add(Map.of("href", it.getHref(), "error", String.valueOf(e.getMessage())));
            }
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("approved", approved);
        res.put("errors", errors);
        return res;
    }

    /** Lead operators (id + Ops-Schedule alias + personid) so the UI can flag which roster people are leads. */
    public List<PmLeadDto> leads() {
        return bundles.leadOperators().stream()
                .map(u -> PmLeadDto.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .scheduleName(u.getScheduleName())
                        .personid(u.getMaximoPersonid())
                        .build())
                .toList();
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /**
     * Lead operators working the given shift on a day, resolved to a Maximo personid (deduped).
     * Each roster name is resolved live: first by a lead's explicit {@code scheduleName} alias, then
     * by the import-time fuzzy {@code userId}. Only lead operators survive — assignment is to leads only.
     */
    private List<PmPendingAssignmentDto.PersonOption> leadsOnShift(ShiftDayDto day, ShiftPreference shift,
                                                                  Map<String, User> leadByScheduleName,
                                                                  Map<Long, User> leadById) {
        if (day == null) return List.of();
        List<ShiftEntry> entries = new ArrayList<>();
        switch (shift) {
            case DAY -> entries.addAll(nz(day.getDayShift()));
            case NIGHT -> entries.addAll(nz(day.getNightShift()));
            case EITHER -> { entries.addAll(nz(day.getDayShift())); entries.addAll(nz(day.getNightShift())); }
        }
        return resolveLeadEntries(entries, leadByScheduleName, leadById);
    }

    /** Resolve a roster entry list to deduped lead operators (alias first, then fuzzy userId; non-leads dropped). */
    private List<PmPendingAssignmentDto.PersonOption> resolveLeadEntries(List<ShiftEntry> entries,
                                                                         Map<String, User> leadByScheduleName,
                                                                         Map<Long, User> leadById) {
        List<PmPendingAssignmentDto.PersonOption> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ShiftEntry e : nz(entries)) {
            if (e == null) continue;
            User u = e.getName() == null ? null : leadByScheduleName.get(normName(e.getName())); // explicit alias
            if (u == null && e.getUserId() != null) u = leadById.get(e.getUserId());             // fuzzy fallback (lead only)
            if (u == null) continue;                                                             // not a lead → skip
            String pid = u.getMaximoPersonid();
            if (pid == null || pid.isBlank() || !seen.add(pid)) continue;
            String name = (u.getName() != null && !u.getName().isBlank()) ? u.getName() : e.getName();
            out.add(PmPendingAssignmentDto.PersonOption.builder().personid(pid).name(name).build());
        }
        return out;
    }

    /** Normalize a name for alias matching: lowercase, trimmed, collapsed whitespace. */
    private static String normName(String s) {
        return s == null ? "" : s.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    /**
     * Snap {@code target} to the preferred weekday {@code dow} (ISO 1=Mon..7=Sun), constrained by cadence:
     * <ul>
     *   <li>WEEK → the preferred weekday in the WO's own ISO week (Mon..Sun) — may be before or after target.</li>
     *   <li>MONTH → the next-or-same preferred weekday, stepped back one week if it spilled into the next month
     *       (keeps it inside the WO's month).</li>
     *   <li>DAY / OTHER / null → next-or-same preferred weekday forward (0..6 days).</li>
     * </ul>
     * Returns {@code target} unchanged when no preferred weekday is set.
     */
    static LocalDate effectiveTargetDate(LocalDate target, Integer dow, RecurrenceCadence cadence) {
        if (target == null || dow == null || dow < 1 || dow > 7) return target;
        if (cadence == RecurrenceCadence.WEEK) {
            return target.with(ChronoField.DAY_OF_WEEK, dow); // same ISO week
        }
        int delta = ((dow - target.getDayOfWeek().getValue()) % 7 + 7) % 7; // next-or-same forward
        LocalDate forward = target.plusDays(delta);
        if (cadence == RecurrenceCadence.MONTH
                && (forward.getMonthValue() != target.getMonthValue() || forward.getYear() != target.getYear())) {
            return forward.minusWeeks(1); // spilled into next month → step back to stay in the WO's month
        }
        return forward;
    }

    /**
     * The end of {@code effectiveStart}'s period, used as the WO's Target Finish (so finish ≥ start and
     * Maximo won't clamp the window to start == end): WEEK → Sunday of that ISO week, MONTH → last day of
     * that month, DAY / OTHER / null → the same day (finish = start). Always ≥ {@code effectiveStart}.
     */
    static LocalDate periodEndDate(LocalDate effectiveStart, RecurrenceCadence cadence) {
        if (effectiveStart == null) return null;
        if (cadence == RecurrenceCadence.WEEK) return effectiveStart.with(ChronoField.DAY_OF_WEEK, 7); // Sunday
        if (cadence == RecurrenceCadence.BIWEEK) return effectiveStart.plusWeeks(2).minusDays(1);
        if (cadence == RecurrenceCadence.MONTH) return effectiveStart.with(TemporalAdjusters.lastDayOfMonth());
        if (cadence == RecurrenceCadence.QUARTER) return effectiveStart.plusMonths(3).minusDays(1);
        return effectiveStart;
    }

    private static List<ShiftEntry> nz(List<ShiftEntry> l) { return l == null ? List.of() : l; }

    private static LocalDate firstNonNullDate(String... isos) {
        for (String s : isos) {
            LocalDate d = RecurringPmService.parseDate(s);
            if (d != null) return d;
        }
        return null;
    }
}
