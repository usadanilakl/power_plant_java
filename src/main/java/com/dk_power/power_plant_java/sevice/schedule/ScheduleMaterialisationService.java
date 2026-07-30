package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventFlag;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
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
 * from the v2 authoring model: {@link CrewAssignment} staffing (ROTATING via {@link Crew} +
 * {@link CrewRotation}, FIXED non-rotating, RELIEF coverage-only), approved {@link CoverageSignup}s,
 * approved {@link PtoRequest}s, ad-hoc {@link ScheduleDayOverride}s, and {@link ScheduleEvent}
 * annotations.
 *
 * <p><b>Placement order per day</b> (later wins): (1) staffing places each person from their
 * assignment; (2) approved coverage signups pull the coverer into the covered shift; (3) approved
 * PTO moves the person to the PTO bucket; (4) overrides have the final say. Events fold into
 * {@code eventFlagsJson}.
 *
 * <p><b>Coexistence-safe:</b> a day with no v2 opinion is left untouched. Writes are idempotent.
 * <b>Gated:</b> no-ops unless {@code schedule.v2.enabled=true} and {@code schedule.v2.rollback=false}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleMaterialisationService {

    public static final String SOURCE = "v2-materializer";
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

    public boolean isActive() {
        return v2Enabled && !v2Rollback;
    }

    @Transactional
    public int materializeDefaultHorizon() {
        LocalDate today = LocalDate.now();
        return materializeRange(today.minusDays(backfillDays), today.plusDays(horizonDays));
    }

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

        // 1) Staffing — place each person from their assignment.
        for (CrewAssignment a : assignments) {
            if (assignmentCovers(a, date)) placeAssignment(b, a, date, cellCache);
        }

        // 2) Approved coverage signups → pull the coverer into the covered shift.
        for (CoverageSignup s : daySignups) {
            User u = s.getUser();
            if (u == null) continue;
            ShiftEntry existing = b.extractUser(u.getId());
            ShiftEntry entry = existing != null ? existing : entryFor(u, "Cover", null);
            if (CoverageRequest.ShiftType.NIGHT.equals(s.getShift())) b.night.add(entry);
            else b.day.add(entry);
        }

        // 3) Approved PTO → move the person to the PTO bucket.
        for (PtoRequest p : ptos) {
            User u = p.getUser();
            if (u == null || p.getStartDate() == null || p.getEndDate() == null) continue;
            if (date.isBefore(p.getStartDate()) || date.isAfter(p.getEndDate())) continue;
            ShiftEntry existing = b.extractUser(u.getId());
            b.pto.add(existing != null ? existing : entryFor(u, null, null));
        }

        // 4) Ad-hoc overrides → final say.
        for (ScheduleDayOverride o : dayOverrides) applyOverride(b, o);

        b.dedupe();

        String eventFlagsJson = buildEventFlags(events, date);

        if (b.isEmpty() && eventFlagsJson == null) return false;

        return shiftDayService.applyMaterializedDay(date,
                b.day, b.night, b.unscheduled, b.pto, b.training,
                b.ocmName, b.ocmId, eventFlagsJson, SOURCE);
    }

    private void placeAssignment(DayBuckets b, CrewAssignment a, LocalDate date, Map<Long, List<PatternCell>> cellCache) {
        User u = a.getUser();
        if (u == null) return;
        String type = a.getAssignmentType();
        if (CrewAssignment.Type.RELIEF.equals(type)) return;   // coverage-only, never auto-scheduled

        String shift;
        String group;
        if (CrewAssignment.Type.FIXED.equals(type)) {
            if (a.getFixedShift() == null || !fixedDayMatches(a.getFixedDaysOfWeek(), date)) return;
            shift = a.getFixedShift();
            group = null;
        } else {
            // ROTATING (default): the whole crew shares the rotation's shift for this cycle day.
            Crew crew = a.getCrew();
            if (crew == null || Boolean.FALSE.equals(crew.getIsActive())) return;
            CrewRotation rot = crew.getRotation();
            if (rot == null) return;
            Integer len = rot.getPatternLengthDays();
            if (len == null || len <= 0) return;
            List<PatternCell> cells = cellCache.computeIfAbsent(
                    rot.getId() == null ? -1L : rot.getId(), k -> parseCells(rot.getRotationCells()));
            int offset = crew.getOffsetDays() == null ? 0 : crew.getOffsetDays();
            int cycleDay = SchedulePatternMath.cycleDay(date.toEpochDay(), offset, len);
            shift = SchedulePatternMath.shiftFor(cells, cycleDay);
            group = crew.getName();
        }
        placeByShift(b, shift, entryFor(u, group, a.getPosition()));
    }

    private void placeByShift(DayBuckets b, String shift, ShiftEntry entry) {
        if (shift == null) return;
        switch (shift) {
            case CrewRotation.Shift.DAY -> b.day.add(entry);
            case CrewRotation.Shift.NIGHT -> b.night.add(entry);
            case CrewRotation.Shift.OFF -> { /* off — place nowhere */ }
            default -> { /* unknown code — skip */ }
        }
    }

    private void applyOverride(DayBuckets b, ScheduleDayOverride o) {
        User u = o.getUser();
        String code = o.getShift();
        if (u == null || code == null) return;
        ShiftEntry existing = b.extractUser(u.getId());
        ShiftEntry entry = existing != null ? existing : entryFor(u, null, null);
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

    private ShiftEntry entryFor(User u, String group, String position) {
        return ShiftEntry.builder()
                .name(displayName(u))
                .group(group)
                .position(position)
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
        if (Boolean.FALSE.equals(a.getIsActive())) return false;
        if (a.getStartDate() != null && date.isBefore(a.getStartDate())) return false;
        if (a.getEndDate() != null && date.isAfter(a.getEndDate())) return false;
        return true;
    }

    /** Whether a FIXED assignment works on this date's weekday (empty CSV = every day). */
    private static boolean fixedDayMatches(String csv, LocalDate date) {
        if (csv == null || csv.isBlank()) return true;
        String dow = date.getDayOfWeek().name().substring(0, 3); // MON..SUN
        for (String tok : csv.split(",")) {
            String t = tok.trim();
            if (t.length() >= 3 && t.substring(0, 3).equalsIgnoreCase(dow)) return true;
        }
        return false;
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
            log.warn("[ScheduleV2] Bad rotationCells JSON: {}", e.getMessage());
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
