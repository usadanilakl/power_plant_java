package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventFlag;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewPattern;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Schedule v2 — regenerates the materialised {@code ShiftDay} rows (the surface all consumers read)
 * from the v2 authoring model: {@link CrewPattern} + {@link CrewAssignment} rotations, approved
 * {@link CoverageSignup}s, approved {@link PtoRequest}s, ad-hoc {@link ScheduleDayOverride}s, and
 * {@link ScheduleEvent} day annotations.
 *
 * <p><b>Application order per day</b> (later stages win): (1) crew pattern places each assigned
 * person into a shift from the role × day grid; (2) approved coverage signups pull the coverer into
 * the covered shift; (3) approved PTO moves the person to the PTO bucket; (4) ad-hoc overrides have
 * the final say. Overlapping events are folded into {@code eventFlagsJson}.
 *
 * <p><b>Coexistence-safe:</b> a day for which v2 computes nothing (no assignments/events/etc.) is
 * left <i>untouched</i> — the materialiser never blanks a ShiftDay it has no opinion on, so any v1
 * (SharePoint-parsed) row survives until real v2 data covers that date. Writes are idempotent:
 * {@link ShiftDayService#applyMaterializedDay} short-circuits unchanged rows so no FieldChange is
 * emitted.
 *
 * <p><b>Gated:</b> no-ops entirely unless {@code schedule.v2.enabled=true} and
 * {@code schedule.v2.rollback=false}. With the flag off, v1 keeps owning ShiftDay.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleMaterialisationService {

    /** {@code ShiftDay.source} stamped on materialised rows — distinguishes them from v1 imports. */
    public static final String SOURCE = "v2-materializer";

    /** Hard cap on a single materialise call to bound the transaction; larger ranges are clamped. */
    private static final int MAX_RANGE_DAYS = 800;

    private static final TypeReference<List<PatternCell>> CELL_LIST = new TypeReference<>() {};

    private final CrewAssignmentRepo assignmentRepo;
    private final ScheduleEventRepo eventRepo;
    private final PtoRequestRepo ptoRepo;
    private final CoverageSignupRepo signupRepo;
    private final ScheduleDayOverrideRepo overrideRepo;
    private final ShiftDayService shiftDayService;
    private final ObjectMapper objectMapper;

    @Value("${schedule.v2.enabled:false}")
    private boolean v2Enabled;
    @Value("${schedule.v2.rollback:false}")
    private boolean v2Rollback;
    @Value("${schedule.v2.horizon-days:180}")
    private int horizonDays;
    @Value("${schedule.v2.backfill-days:7}")
    private int backfillDays;

    /** True when v2 owns ShiftDay materialisation (flag on and not rolled back). */
    public boolean isActive() {
        return v2Enabled && !v2Rollback;
    }

    /**
     * Materialise a rolling window around today ({@code -backfillDays .. +horizonDays}). The default
     * trigger for admin CRUD, which usually can't cheaply compute the exact affected range.
     */
    @Transactional
    public int materializeDefaultHorizon() {
        LocalDate today = LocalDate.now();
        return materializeRange(today.minusDays(backfillDays), today.plusDays(horizonDays));
    }

    /**
     * Regenerate every {@code ShiftDay} in {@code [from, to]} from the v2 model.
     *
     * @return the number of day rows actually written (dirty/new); unchanged rows are skipped.
     */
    @Transactional
    public int materializeRange(LocalDate from, LocalDate to) {
        if (!isActive()) {
            log.debug("[ScheduleV2] Materialisation skipped (enabled={}, rollback={})", v2Enabled, v2Rollback);
            return 0;
        }
        if (from == null || to == null || to.isBefore(from)) return 0;
        long span = ChronoUnit.DAYS.between(from, to) + 1;
        if (span > MAX_RANGE_DAYS) {
            log.warn("[ScheduleV2] Range {}..{} spans {} days (> {} cap); clamping 'to'.",
                    from, to, span, MAX_RANGE_DAYS);
            to = from.plusDays(MAX_RANGE_DAYS - 1);
        }

        // Preload every input across the whole range so per-day work is in-memory (no N queries).
        List<CrewAssignment> assignments = assignmentRepo.findActiveOverlapping(from, to);
        List<ScheduleEvent> events = eventRepo.findOverlapping(from, to);
        List<PtoRequest> ptos = ptoRepo.findApprovedOverlapping(from, to);
        List<ScheduleDayOverride> overrides = overrideRepo.findByDateBetween(from, to);
        List<CoverageSignup> signups = signupRepo.findByDateBetweenAndStatus(from, to, CoverageSignup.Status.APPROVED);

        Map<LocalDate, List<ScheduleDayOverride>> overridesByDate = new HashMap<>();
        for (ScheduleDayOverride o : overrides) {
            if (o.getDate() != null) overridesByDate.computeIfAbsent(o.getDate(), k -> new ArrayList<>()).add(o);
        }
        Map<LocalDate, List<CoverageSignup>> signupsByDate = new HashMap<>();
        for (CoverageSignup s : signups) {
            if (s.getDate() != null) signupsByDate.computeIfAbsent(s.getDate(), k -> new ArrayList<>()).add(s);
        }
        Map<Long, List<PatternCell>> cellCache = new HashMap<>();

        int written = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (materializeDay(d, assignments, events, ptos,
                    overridesByDate.getOrDefault(d, List.of()),
                    signupsByDate.getOrDefault(d, List.of()),
                    cellCache)) {
                written++;
            }
        }
        log.info("[ScheduleV2] Materialised {}..{}: {} day rows changed "
                        + "({} assignments, {} events, {} PTO, {} overrides, {} signups)",
                from, to, written, assignments.size(), events.size(), ptos.size(), overrides.size(), signups.size());
        return written;
    }

    private boolean materializeDay(LocalDate date,
                                   List<CrewAssignment> assignments,
                                   List<ScheduleEvent> events,
                                   List<PtoRequest> ptos,
                                   List<ScheduleDayOverride> dayOverrides,
                                   List<CoverageSignup> daySignups,
                                   Map<Long, List<PatternCell>> cellCache) {
        DayBuckets b = new DayBuckets();

        // 1) Crew pattern → base placement.
        for (CrewAssignment a : assignments) {
            if (!assignmentCovers(a, date)) continue;
            CrewPattern crew = a.getCrew();
            User u = a.getUser();
            if (crew == null || u == null || Boolean.FALSE.equals(crew.getIsActive())) continue;
            Integer len = crew.getPatternLengthDays();
            if (len == null || len <= 0) continue;
            List<PatternCell> cells = cellCache.computeIfAbsent(
                    crew.getId() == null ? -1L : crew.getId(), k -> parseCells(crew.getPatternCells()));
            int offset = a.getPatternOffsetDays() == null ? 0 : a.getPatternOffsetDays();
            int cycleDay = SchedulePatternMath.cycleDay(date.toEpochDay(), offset, len);
            String shift = SchedulePatternMath.shiftFor(cells, cycleDay, a.getRole());
            placeByPatternShift(b, shift, entryFor(u, crew.getName()));
        }

        // 2) Approved coverage signups → pull the coverer into the covered shift.
        for (CoverageSignup s : daySignups) {
            User u = s.getUser();
            if (u == null) continue;
            ShiftEntry existing = b.extractUser(u.getId());
            ShiftEntry entry = existing != null ? existing : entryFor(u, "Cover");
            if (CoverageRequest.ShiftType.NIGHT.equals(s.getShift())) b.night.add(entry);
            else b.day.add(entry);
        }

        // 3) Approved PTO → move the person to the PTO bucket (preserving their crew group if placed).
        for (PtoRequest p : ptos) {
            User u = p.getUser();
            if (u == null || p.getStartDate() == null || p.getEndDate() == null) continue;
            if (date.isBefore(p.getStartDate()) || date.isAfter(p.getEndDate())) continue;
            ShiftEntry existing = b.extractUser(u.getId());
            b.pto.add(existing != null ? existing : entryFor(u, null));
        }

        // 4) Ad-hoc overrides → final say.
        for (ScheduleDayOverride o : dayOverrides) applyOverride(b, o);

        b.dedupe();

        String eventFlagsJson = buildEventFlags(events, date);

        if (b.isEmpty() && eventFlagsJson == null) {
            // No v2 opinion for this day — leave any existing (v1 or prior-v2) row untouched.
            return false;
        }

        return shiftDayService.applyMaterializedDay(date,
                b.day, b.night, b.unscheduled, b.pto, b.training,
                b.ocmName, b.ocmId, eventFlagsJson, SOURCE);
    }

    private void placeByPatternShift(DayBuckets b, String shift, ShiftEntry entry) {
        if (shift == null) return;
        switch (shift) {
            case CrewPattern.Shift.DAY -> b.day.add(entry);
            case CrewPattern.Shift.NIGHT -> b.night.add(entry);
            case CrewPattern.Shift.RELIEF -> b.unscheduled.add(entry); // relief = available/floating pool
            case CrewPattern.Shift.OFF -> { /* off — place nowhere */ }
            default -> { /* unknown code — skip */ }
        }
    }

    private void applyOverride(DayBuckets b, ScheduleDayOverride o) {
        User u = o.getUser();
        String code = o.getShift();
        if (u == null || code == null) return;
        ShiftEntry existing = b.extractUser(u.getId());
        ShiftEntry entry = existing != null ? existing : entryFor(u, null);
        switch (code) {
            case ScheduleDayOverride.Code.DAY -> b.day.add(entry);
            case ScheduleDayOverride.Code.NIGHT -> b.night.add(entry);
            case ScheduleDayOverride.Code.PTO -> b.pto.add(entry);
            case ScheduleDayOverride.Code.TRAINING -> b.training.add(entry);
            case ScheduleDayOverride.Code.LIGHT_DUTY -> b.unscheduled.add(entry);
            case ScheduleDayOverride.Code.ON_CALL_MANAGER -> { b.ocmName = entry.getName(); b.ocmId = u.getId(); }
            case ScheduleDayOverride.Code.OFF -> { /* extracted above; stays off */ }
            default -> { /* unknown code — leave off */ }
        }
    }

    private ShiftEntry entryFor(User u, String group) {
        return ShiftEntry.builder()
                .name(displayName(u))
                .group(group)
                .userId(u.getId())
                .build();
    }

    private String displayName(User u) {
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }

    private String buildEventFlags(List<ScheduleEvent> events, LocalDate date) {
        List<ScheduleEventFlag> flags = new ArrayList<>();
        for (ScheduleEvent e : events) {
            if (!eventCovers(e, date)) continue;
            flags.add(ScheduleEventFlag.builder()
                    .eventType(e.getEventType())
                    .title(e.getTitle())
                    .color(resolveColor(e))
                    .appliesToShift(e.getAppliesToShift())
                    .build());
        }
        if (flags.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(flags);
        } catch (Exception ex) {
            log.warn("[ScheduleV2] Failed to serialize event flags for {}: {}", date, ex.getMessage());
            return null;
        }
    }

    private static boolean assignmentCovers(CrewAssignment a, LocalDate date) {
        if (a.getStartDate() != null && date.isBefore(a.getStartDate())) return false;
        if (a.getEndDate() != null && date.isAfter(a.getEndDate())) return false;
        return true;
    }

    private static boolean eventCovers(ScheduleEvent e, LocalDate date) {
        if (e.getStartDate() == null || date.isBefore(e.getStartDate())) return false;
        LocalDate end = e.getEndDate() != null ? e.getEndDate() : e.getStartDate();
        return !date.isAfter(end);
    }

    private String resolveColor(ScheduleEvent e) {
        if (e.getColor() != null && !e.getColor().isBlank()) return e.getColor();
        return defaultColor(e.getEventType());
    }

    private static String defaultColor(String type) {
        if (type == null) return "#90A4AE";
        return switch (type) {
            case ScheduleEvent.Type.HOLIDAY -> "#EF5350";
            case ScheduleEvent.Type.MEETING -> "#42A5F5";
            case ScheduleEvent.Type.LEADS_MEETING -> "#26C6DA";
            case ScheduleEvent.Type.PAY_PERIOD_START -> "#66BB6A";
            case ScheduleEvent.Type.OUTAGE -> "#FFA726";
            case ScheduleEvent.Type.TRAINING_MANDATORY -> "#AB47BC";
            default -> "#90A4AE";
        };
    }

    private List<PatternCell> parseCells(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, CELL_LIST);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Bad patternCells JSON: {}", e.getMessage());
            return List.of();
        }
    }

    /** Per-day working set. Each person appears at most once per bucket after {@link #dedupe()}. */
    private static final class DayBuckets {
        final List<ShiftEntry> day = new ArrayList<>();
        final List<ShiftEntry> night = new ArrayList<>();
        final List<ShiftEntry> unscheduled = new ArrayList<>();
        final List<ShiftEntry> pto = new ArrayList<>();
        final List<ShiftEntry> training = new ArrayList<>();
        String ocmName;
        Long ocmId;

        private List<List<ShiftEntry>> shiftLists() {
            return List.of(day, night, unscheduled, pto, training);
        }

        /** Remove and return the entry for a user across all shift lists (first match), or null. */
        ShiftEntry extractUser(Long userId) {
            if (userId == null) return null;
            for (List<ShiftEntry> list : shiftLists()) {
                Iterator<ShiftEntry> it = list.iterator();
                while (it.hasNext()) {
                    ShiftEntry e = it.next();
                    if (userId.equals(e.getUserId())) {
                        it.remove();
                        return e;
                    }
                }
            }
            return null;
        }

        void dedupe() {
            for (List<ShiftEntry> list : shiftLists()) {
                Set<String> seen = new HashSet<>();
                list.removeIf(e -> {
                    String key = e.getUserId() != null ? "u:" + e.getUserId() : "n:" + e.getName();
                    return !seen.add(key);
                });
            }
        }

        boolean isEmpty() {
            return day.isEmpty() && night.isEmpty() && unscheduled.isEmpty()
                    && pto.isEmpty() && training.isEmpty() && ocmName == null && ocmId == null;
        }
    }
}
