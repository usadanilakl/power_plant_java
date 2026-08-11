package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventFlag;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.entities.schedule.CrewShiftOverride;
import com.dk_power.power_plant_java.entities.schedule.OnCallRotation;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.schedule.ReliefRotation;
import com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewShiftOverrideRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.ReliefRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.repository.schedule.OnCallRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
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
    /** Plant-local timezone — "today"/holiday-week boundaries must match plant time, not the hub JVM's zone. */
    private static final ZoneId PLANT_ZONE = ZoneId.of("America/Chicago");
    private static final TypeReference<List<PatternCell>> CELL_LIST = new TypeReference<>() {};
    private static final TypeReference<List<Long>> LONG_LIST = new TypeReference<>() {};
    private static final TypeReference<Map<String, Long>> SLOT_MAP = new TypeReference<>() {};

    private final CrewAssignmentRepo assignmentRepo;
    private final ScheduleEventRepo eventRepo;
    private final PtoRequestRepo ptoRepo;
    private final CoverageSignupRepo signupRepo;
    private final ScheduleDayOverrideRepo overrideRepo;
    private final CrewShiftOverrideRepo crewShiftOverrideRepo;
    private final OnCallRotationRepo onCallRepo;
    private final ReliefRotationRepo reliefRepo;
    private final CrewRepo crewRepo;
    private final UserRepo userRepo;
    private final ShiftDayService shiftDayService;
    private final ObjectMapper objectMapper;
    private final SyncConfig syncConfig;

    @Value("${schedule.v2.enabled:false}")
    private boolean v2Enabled;
    @Value("${schedule.v2.rollback:false}")
    private boolean v2Rollback;
    @Value("${schedule.v2.horizon-days:180}")
    private int horizonDays;
    @Value("${schedule.v2.backfill-days:7}")
    private int backfillDays;
    @Value("${schedule.v2.lock-before-days:3}")
    private int lockBeforeDays;

    public boolean isActive() {
        return v2Enabled && !v2Rollback;
    }

    /**
     * The earliest date that may still be authored or (re)materialised. Days strictly before this are
     * FROZEN — the materialiser never rewrites them and authoring refuses to target them — so history
     * reflects what actually happened. Grace window = {@code schedule.v2.lock-before-days} (default 3).
     */
    public LocalDate earliestEditableDate() {
        return LocalDate.now(PLANT_ZONE).minusDays(Math.max(0, lockBeforeDays));
    }

    /** Whether {@code date} is frozen (in the locked past) and must not be authored or re-materialised. */
    public boolean isDateLocked(LocalDate date) {
        return date != null && date.isBefore(earliestEditableDate());
    }

    /**
     * Whether this node should run materialisation at all: the hub always does; a standalone/dev
     * instance that is NOT actively syncing up to a hub also does (so single-node dev/testing — and a
     * box with sync toggled off — keeps working); a subordinate desktop that is actively syncing to a
     * hub does NOT — the hub is authoritative and pushes ShiftDay down via CRDT, so a desktop
     * re-materialising the same range would just fight the hub's version.
     *
     * <p>Uses {@code isServerSyncEnabled()} (actively syncing = configured AND enabled), not merely
     * {@code isServerSyncConfigured()} (URL present), so turning sync off makes a node standalone again.
     */
    private boolean shouldMaterialiseOnThisNode() {
        return syncConfig.isHubMode() || !syncConfig.isServerSyncEnabled();
    }

    @Transactional
    public int materializeDefaultHorizon() {
        LocalDate today = LocalDate.now(PLANT_ZONE);
        return materializeRange(today.minusDays(backfillDays), today.plusDays(horizonDays));
    }

    /**
     * Daily roll-forward so the far horizon edge and holiday-week detection stay fresh without
     * requiring a user-triggered edit or a restart. Hub-gated the same way as every other entry
     * point — {@link #materializeRange} itself no-ops on a subordinate desktop with a configured
     * upstream hub, so this is safe to schedule everywhere.
     */
    @Scheduled(cron = "${schedule.v2.daily-refresh-cron:0 15 4 * * *}", zone = "America/Chicago")
    @Transactional   // scheduler → proxy → this method opens the session; the inner materialize* calls
                     // are self-invocations (proxy bypassed) so they rely on THIS tx for lazy loads.
    public void dailyRollForward() {
        int written = materializeDefaultHorizon();
        if (written > 0) {
            log.info("[ScheduleV2] Daily roll-forward materialised {} day row(s) changed", written);
        }
    }

    /**
     * Frequent hub-side refresh so schedule-authoring that arrives via SYNC — a manager creating an
     * assignment/override/coverage need, or approving a coverage signup, on a DESKTOP or the PWA — is
     * reflected in ShiftDay without waiting for the 4:15 AM roll-forward. The materialiser only runs on
     * a node's OWN service-layer edits (admin saves, coverage mutations); a change applied through
     * sync-apply never calls it, and a subordinate desktop's own edit no-ops under the hub-gate. So on
     * the hub a desktop/PWA-origin edit would otherwise lag ShiftDay by up to a day (only the manager's
     * signup-status change would sync; the coverer wouldn't appear in the shift grid until 4:15 AM).
     *
     * <p>Idle-cheap: {@link #materializeRange} writes only rows whose content actually changed, so a
     * tick with no upstream authoring produces zero ShiftDay writes and zero sync traffic — the only
     * cost is one horizon read + the in-memory recompute. <b>Hub-only</b> (desktops never materialise;
     * standalone/dev nodes already rematerialise locally on their own edits, so neither needs this).
     * Interval via {@code schedule.v2.hub-refresh-interval-ms} (default 10 min); raise it very high to
     * effectively disable.
     */
    @Scheduled(fixedDelayString = "${schedule.v2.hub-refresh-interval-ms:600000}",
               initialDelayString = "${schedule.v2.hub-refresh-interval-ms:600000}")
    @Transactional   // see dailyRollForward: opens the session the self-invoked materialize* calls need.
    public void hubSyncRefresh() {
        if (!isActive() || !syncConfig.isHubMode()) return;   // hub only; skip work + log spam elsewhere
        int written = materializeDefaultHorizon();
        if (written > 0) {
            log.info("[ScheduleV2] Hub sync-refresh rematerialised {} day row(s) — picked up authoring "
                    + "that arrived via sync (desktop/PWA-origin edit)", written);
        }
    }

    @Transactional
    public int materializeRange(LocalDate from, LocalDate to) {
        if (!isActive()) {
            log.debug("[ScheduleV2] Materialisation skipped (enabled={}, rollback={})", v2Enabled, v2Rollback);
            return 0;
        }
        if (!shouldMaterialiseOnThisNode()) {
            log.info("[ScheduleV2] Materialisation skipped — subordinate desktop with a configured "
                    + "upstream hub owns this range ({}..{}); the hub materialises and pushes down via sync.",
                    from, to);
            return 0;
        }
        if (from == null || to == null || to.isBefore(from)) return 0;
        // Past-lock: never (re)write frozen days — clamp the window up to the earliest editable date so
        // history is immutable regardless of which materialise path (edit, roll-forward, manual) got here.
        LocalDate lockFloor = earliestEditableDate();
        if (from.isBefore(lockFloor)) from = lockFloor;
        if (to.isBefore(from)) return 0;   // whole requested range is frozen
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
        // Outage / campaign pins: temporary per-crew fixed shift over a window (crewId -> its overrides).
        List<CrewShiftOverride> crewShiftOverrides = crewShiftOverrideRepo.findActiveOverlapping(from, to);
        Map<Long, List<CrewShiftOverride>> crewOverridesByCrew = new HashMap<>();
        for (CrewShiftOverride o : crewShiftOverrides) {
            if (o.getCrew() != null && o.getCrew().getId() != null) {
                crewOverridesByCrew.computeIfAbsent(o.getCrew().getId(), k -> new ArrayList<>()).add(o);
            }
        }

        Map<LocalDate, List<ScheduleDayOverride>> overridesByDate = new HashMap<>();
        for (ScheduleDayOverride o : overrides) {
            if (o.getDate() != null) overridesByDate.computeIfAbsent(o.getDate(), k -> new ArrayList<>()).add(o);
        }
        Map<LocalDate, List<CoverageSignup>> signupsByDate = new HashMap<>();
        for (CoverageSignup s : signups) {
            if (s.getDate() != null) signupsByDate.computeIfAbsent(s.getDate(), k -> new ArrayList<>()).add(s);
        }
        Map<Long, List<PatternCell>> cellCache = new HashMap<>();
        OnCallCtx onCall = loadOnCall();
        ReliefCtx relief = loadRelief();
        // Holidays drive the holiday-week (4x10 -> 8x5) switch for a whole Mon-Sun week, which can
        // start before `from` or end after `to` — widen the fetch so a boundary day still sees it.
        List<ScheduleEvent> holidayWindowEvents = eventRepo.findOverlapping(from.minusDays(6), to.plusDays(6));
        Set<LocalDate> holidays = collectHolidays(holidayWindowEvents);

        // Preload the whole range's existing rows once so the per-day apply issues zero SELECTs.
        Map<LocalDate, ShiftDay> existingByDate = shiftDayService.preloadRange(from, to);

        int written = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (materializeDay(d, assignments, events, ptos,
                    overridesByDate.getOrDefault(d, List.of()),
                    signupsByDate.getOrDefault(d, List.of()),
                    cellCache, onCall, relief, holidays, existingByDate, crewOverridesByCrew)) {
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
                                   Map<Long, List<PatternCell>> cellCache,
                                   OnCallCtx onCall,
                                   ReliefCtx relief,
                                   Set<LocalDate> holidays,
                                   Map<LocalDate, ShiftDay> existingByDate,
                                   Map<Long, List<CrewShiftOverride>> crewOverrides) {
        DayBuckets b = new DayBuckets();

        // 0) On-call manager for the day (an override with code OCM can still replace it below).
        applyOnCall(b, date, onCall);

        // 0.5) Relief-swap rotation — place each lane's members on their current crew (or day-relief).
        //      Returns only the ids relief ACTUALLY placed today (current slot occupants), not the
        //      whole succession line — a lineOrder member waiting for their turn must still fall
        //      through to their normal crew placement below.
        Set<Long> reliefPlacedToday = applyRelief(b, date, relief, cellCache, holidays, crewOverrides);

        // 1) Staffing — place each person from their assignment, EXCEPT anyone the relief rotation
        //    actually placed above (their static crew assignment is overridden while active).
        for (CrewAssignment a : assignments) {
            User au = a.getUser();
            if (au != null && au.getId() != null && reliefPlacedToday.contains(au.getId())) continue;
            if (assignmentCovers(a, date)) placeAssignment(b, a, date, cellCache, holidays, crewOverrides);
        }

        // 2) Approved coverage signups → pull the coverer into the covered shift.
        for (CoverageSignup s : daySignups) {
            User u = s.getUser();
            if (u == null) continue;
            ShiftEntry existing = b.extractUser(u.getId());
            // Label a fresh coverage entry with the seat being filled (e.g. "AO") so the grids can
            // show what role the coverer is covering; someone already placed keeps their own role.
            String coverPos = s.getCoverageRequest() != null ? s.getCoverageRequest().getPosition() : null;
            ShiftEntry entry = existing != null ? existing : entryFor(u, "Cover", coverPos);
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
        ShiftDay existing = existingByDate.get(date);

        boolean clearingV2OwnedDay = false;
        if (b.isEmpty() && eventFlagsJson == null) {
            // Coexistence-safe: a day with no v2 opinion AND no v2-owned row is left untouched. But a
            // day that USED to have v2-placed staffing (source==SOURCE) and now computes to nothing
            // (assignment ended, coverage/PTO/override removed, etc.) must still be written empty so
            // the removal propagates via CRDT sync + the Supabase mirror instead of stranding stale
            // data on that row.
            if (existing == null || !SOURCE.equals(existing.getSource())) return false;
            clearingV2OwnedDay = true;
        }

        boolean wrote = shiftDayService.applyMaterializedDay(date,
                b.day, b.night, b.unscheduled, b.pto, b.training,
                b.ocmName, b.ocmId, eventFlagsJson, SOURCE, existing);
        // Log only on the actual clear transition, not every horizon pass over an already-empty row.
        if (wrote && clearingV2OwnedDay) {
            log.info("[ScheduleV2] {}: v2-owned row cleared (now computes empty)", date);
        }
        return wrote;
    }

    private void placeAssignment(DayBuckets b, CrewAssignment a, LocalDate date,
                                 Map<Long, List<PatternCell>> cellCache, Set<LocalDate> holidays,
                                 Map<Long, List<CrewShiftOverride>> crewOverrides) {
        User u = a.getUser();
        if (u == null) return;
        String shift = resolveShift(a, date, cellCache, holidays, crewOverrides);
        if (shift == null) return;
        String group = CrewAssignment.Type.FIXED.equals(a.getAssignmentType())
                ? a.getGroupLabel()
                : crewGroupCode(a.getCrew());
        // Extract-then-place: a user with two active assignments resolving to different shifts (e.g.
        // ROTATING on crew A = DAY today + FIXED = NIGHT today) must land in exactly one bucket, not
        // both. Whichever assignment is processed last in this day's loop wins; log the conflict so
        // it's visible (it almost always means overlapping/duplicate assignments need cleanup).
        ShiftEntry displaced = b.extractUser(u.getId());
        if (displaced != null) {
            log.warn("[ScheduleV2] {}: user {} double-booked by assignment #{} (was placed as group={}) — "
                            + "keeping the later placement (group={}, shift={})",
                    date, u.getId(), a.getId(), displaced.getGroup(), group, shift);
        }
        placeByShift(b, shift, entryFor(u, group, a.getPosition()));
    }

    /**
     * Short group code for a crew ("Crew A" → "A"). Consumers order the roster by this code (the PWA
     * month view + the v1-era A/B/C/D/Rel/OCM convention), so emit the code, not the full crew label —
     * otherwise "Crew A" doesn't match "A" and rows fall through to an alphabetical sort.
     */
    private static String crewGroupCode(Crew crew) {
        if (crew == null || crew.getName() == null) return null;
        String n = crew.getName().trim();
        return n.regionMatches(true, 0, "Crew ", 0, 5) ? n.substring(5).trim() : n;
    }

    /**
     * The shift code a single assignment yields on a date: {@code DAY}/{@code NIGHT}/{@code OFF} for
     * ROTATING (via crew rotation) and FIXED, or {@code null} for RELIEF / inactive / unschedulable.
     */
    private String resolveShift(CrewAssignment a, LocalDate date, Map<Long, List<PatternCell>> cellCache,
                                Set<LocalDate> holidays, Map<Long, List<CrewShiftOverride>> crewOverrides) {
        String type = a.getAssignmentType();
        if (CrewAssignment.Type.RELIEF.equals(type)) return null;   // coverage-only, never auto-scheduled
        if (CrewAssignment.Type.FIXED.equals(type)) {
            if (a.getFixedShift() == null) return null;
            return fixedDayWorked(a.getFixedDaysOfWeek(), date, holidays) ? a.getFixedShift() : null;
        }
        // ROTATING (default): the whole crew shares the rotation's shift for this cycle day.
        return crewShiftFor(a.getCrew(), date, cellCache, crewOverrides);
    }

    /**
     * Whether a fixed day-staff member works on this date. Normally follows their {@code fixedDaysOfWeek}
     * (4×10). But during a <b>holiday week</b> (any HOLIDAY event falls in the Mon–Sun week) they switch
     * to 8-hour Mon–Fri, minus the holiday itself (paid off). The holiday date is always off.
     */
    private static boolean fixedDayWorked(String daysCsv, LocalDate date, Set<LocalDate> holidays) {
        if (holidays != null && holidays.contains(date)) return false;   // paid holiday off
        if (isHolidayWeek(date, holidays)) {
            return date.getDayOfWeek().getValue() <= 5;                  // Mon–Fri (8h) that week
        }
        return fixedDayMatches(daysCsv, date);
    }

    /** Does the Mon–Sun week containing {@code date} include any holiday? */
    private static boolean isHolidayWeek(LocalDate date, Set<LocalDate> holidays) {
        if (holidays == null || holidays.isEmpty()) return false;
        LocalDate monday = date.minusDays(date.getDayOfWeek().getValue() - 1);
        for (int i = 0; i < 7; i++) if (holidays.contains(monday.plusDays(i))) return true;
        return false;
    }

    /** All dates covered by HOLIDAY events in the range (drives the holiday-week 8×5 switch). */
    private static Set<LocalDate> collectHolidays(List<ScheduleEvent> events) {
        Set<LocalDate> out = new HashSet<>();
        for (ScheduleEvent e : events) {
            if (!ScheduleEvent.Type.HOLIDAY.equals(e.getEventType()) || e.getStartDate() == null) continue;
            LocalDate end = e.getEndDate() != null ? e.getEndDate() : e.getStartDate();
            for (LocalDate d = e.getStartDate(); !d.isAfter(end); d = d.plusDays(1)) out.add(d);
        }
        return out;
    }

    /** The shift code (D/N/O or null) a crew yields on a date from its rotation cells at its offset. */
    /** The active outage/campaign pin for a crew on a date ({@code D}/{@code N}/{@code OFF}), or null. */
    private static String pinnedCrewShift(Crew crew, LocalDate date,
                                          Map<Long, List<CrewShiftOverride>> crewOverrides) {
        if (crewOverrides == null || crew == null || crew.getId() == null) return null;
        List<CrewShiftOverride> list = crewOverrides.get(crew.getId());
        if (list == null) return null;
        for (CrewShiftOverride o : list) {
            if (o.getStartDate() == null || o.getEndDate() == null || o.getShift() == null) continue;
            if (!date.isBefore(o.getStartDate()) && !date.isAfter(o.getEndDate())) return o.getShift();
        }
        return null;
    }

    private String crewShiftFor(Crew crew, LocalDate date, Map<Long, List<PatternCell>> cellCache,
                                Map<Long, List<CrewShiftOverride>> crewOverrides) {
        if (crew == null || Boolean.FALSE.equals(crew.getIsActive())) return null;
        // Outage / campaign pin: a temporary per-crew fixed shift for a window overrides the rotation
        // (e.g. crews A+B hold nights for a 3-week outage — no switching). The rotation resumes
        // automatically after the window (cycle math is absolute-epoch-anchored). OFF drops the crew.
        String pinned = pinnedCrewShift(crew, date, crewOverrides);
        if (pinned != null) return CrewShiftOverride.Shift.OFF.equals(pinned) ? null : pinned;
        CrewRotation rot = crew.getRotation();
        if (rot == null) return null;
        Integer len = rot.getPatternLengthDays();
        if (len == null || len <= 0) return null;
        List<PatternCell> cells = cellCache.computeIfAbsent(
                rot.getId() == null ? -1L : rot.getId(), k -> parseCells(rot.getRotationCells()));
        int offset = crew.getOffsetDays() == null ? 0 : crew.getOffsetDays();
        // Phase the cycle to the rotation's start date (dayIndex 0 = anchorDate); null = epoch day 0.
        long anchor = rot.getAnchorDate() != null ? rot.getAnchorDate().toEpochDay() : 0L;
        int cycleDay = SchedulePatternMath.cycleDay(date.toEpochDay() - anchor, offset, len);
        return SchedulePatternMath.shiftFor(cells, cycleDay);
    }

    /**
     * The working shift ({@code DAY}/{@code NIGHT}) a user is scheduled for on a date via their active
     * crew assignment(s), or {@code null} if off / unassigned. Used by PTO intake to target coverage
     * only at the shifts actually being vacated. Ignores coverage/PTO/overrides — this is the base
     * rotation placement, which is exactly what a PTO leaves to be covered.
     */
    @Transactional(readOnly = true)
    public String scheduledShiftForUser(Long userId, LocalDate date) {
        if (userId == null || date == null) return null;
        Map<Long, List<PatternCell>> cache = new HashMap<>();
        // Honour an active outage pin so a coverage base-shift check matches the outage schedule.
        Map<Long, List<CrewShiftOverride>> crewOverrides = new HashMap<>();
        for (CrewShiftOverride o : crewShiftOverrideRepo.findActiveOverlapping(date, date)) {
            if (o.getCrew() != null && o.getCrew().getId() != null) {
                crewOverrides.computeIfAbsent(o.getCrew().getId(), k -> new ArrayList<>()).add(o);
            }
        }
        for (CrewAssignment a : assignmentRepo.findActiveOverlapping(date, date)) {
            User u = a.getUser();
            if (u == null || !userId.equals(u.getId()) || !assignmentCovers(a, date)) continue;
            String shift = resolveShift(a, date, cache, Set.of(), crewOverrides);   // base placement; holidays irrelevant for coverage
            if (CrewRotation.Shift.DAY.equals(shift) || CrewRotation.Shift.NIGHT.equals(shift)) return shift;
        }
        return null;
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

    /** Load the active on-call rotation + resolve its members' display names once per run. */
    private OnCallCtx loadOnCall() {
        OnCallRotation rot = onCallRepo.findByIsActiveTrue().stream().findFirst().orElse(null);
        if (rot == null) return new OnCallCtx(null, List.of(), Map.of());
        List<Long> members = parseLongs(rot.getMemberUserIdsJson());
        List<Long> distinctIds = members.stream().filter(java.util.Objects::nonNull).distinct().toList();
        Map<Long, String> names = new HashMap<>();
        for (User u : userRepo.findAllById(distinctIds)) {
            names.put(u.getId(), displayName(u));
        }
        return new OnCallCtx(rot, members, names);
    }

    /** Set the day's on-call manager: member index = floor((date-anchor)/daysPerTurn) mod size. */
    private void applyOnCall(DayBuckets b, LocalDate date, OnCallCtx onCall) {
        if (onCall == null || onCall.rot() == null || onCall.members().isEmpty()) return;
        Integer dpt = onCall.rot().getDaysPerTurn();
        LocalDate anchor = onCall.rot().getAnchorDate();
        if (dpt == null || dpt <= 0 || anchor == null) return;
        long turn = Math.floorDiv(date.toEpochDay() - anchor.toEpochDay(), (long) dpt);
        int idx = (int) Math.floorMod(turn, (long) onCall.members().size());
        Long uid = onCall.members().get(idx);
        if (uid == null) return;
        b.ocmId = uid;
        b.ocmName = onCall.names().getOrDefault(uid, "User " + uid);
    }

    private List<Long> parseLongs(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, LONG_LIST);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Bad on-call member JSON: {}", e.getMessage());
            return List.of();
        }
    }

    /** Preloaded on-call context for a run: the active rotation + ordered member ids + display names. */
    private record OnCallCtx(OnCallRotation rot, List<Long> members, Map<Long, String> names) {}

    // ---- relief-swap rotation ----------------------------------------------

    /** Preload active relief-swap lanes (parsed succession + anchor slot map), member Users, crews by letter. */
    private ReliefCtx loadRelief() {
        List<ReliefRotation> active = reliefRepo.findByIsActiveTrue();
        List<ReliefLane> lanes = new ArrayList<>();
        Set<Long> memberIds = new HashSet<>();
        for (ReliefRotation r : active) {
            List<Long> line = parseLongs(r.getLineOrderJson());
            Map<String, Long> slots = parseSlotMap(r.getInitialSlotsJson());
            if (line.isEmpty() || slots.isEmpty() || r.getAnchorDate() == null) continue;
            int pm = r.getPeriodMonths() == null || r.getPeriodMonths() < 1 ? 3 : r.getPeriodMonths();
            String pos = r.getPosition() == null ? "" : r.getPosition();
            lanes.add(new ReliefLane(pos, r.getAnchorDate(), pm, r.getReliefDaysOfWeek(), line, slots));
            memberIds.addAll(line);
            memberIds.addAll(slots.values());
        }
        memberIds.remove(null);
        Map<String, Crew> crewsByLetter = new HashMap<>();
        if (!lanes.isEmpty()) {
            for (Crew c : crewRepo.findAll()) {
                String n = c.getName() == null ? "" : c.getName().trim();
                if (!n.isEmpty()) crewsByLetter.putIfAbsent(n.substring(n.length() - 1).toUpperCase(), c);
            }
        }
        Map<Long, User> members = new HashMap<>();
        for (User u : userRepo.findAllById(memberIds)) members.put(u.getId(), u);
        return new ReliefCtx(lanes, crewsByLetter, members);
    }

    /**
     * Place each relief-lane member for the date: the current relief person on day-relief, everyone
     * else on their current crew's shift (group = crew letter).
     *
     * @return the ids relief ACTUALLY placed today (current slot occupants only) — used by the caller
     *         to suppress just those users' normal crew-assignment placement. A lineOrder member who
     *         hasn't rotated into a tracked slot yet is NOT in this set, so they fall through to their
     *         normal crew placement instead of vanishing from the schedule entirely.
     */
    private Set<Long> applyRelief(DayBuckets b, LocalDate date, ReliefCtx ctx,
                                  Map<Long, List<PatternCell>> cellCache, Set<LocalDate> holidays,
                                  Map<Long, List<CrewShiftOverride>> crewOverrides) {
        if (ctx == null || ctx.lanes().isEmpty()) return Set.of();
        Set<Long> placedToday = new HashSet<>();
        for (ReliefLane lane : ctx.lanes()) {
            Map<Long, String> state = reliefStateAt(lane, date);
            for (Map.Entry<Long, String> e : state.entrySet()) {
                User u = ctx.members().get(e.getKey());
                if (u == null) continue;
                String slot = e.getValue();
                if ("REL".equals(slot)) {
                    placedToday.add(e.getKey());
                    // Relief works its day pattern; holiday-week rule applies (off on the holiday itself).
                    if (fixedDayWorked(lane.reliefDays(), date, holidays)) b.day.add(entryFor(u, "Rel", lane.position()));
                } else {
                    Crew crew = ctx.crewsByLetter().get(slot);
                    if (crew == null) {
                        log.warn("[ScheduleV2] {}: relief lane '{}' slot '{}' has no matching crew — "
                                + "user {} left to their normal crew assignment", date, lane.position(), slot, e.getKey());
                        continue;   // not placed by relief — let them fall through to their own assignment
                    }
                    placedToday.add(e.getKey());
                    placeByShift(b, crewShiftFor(crew, date, cellCache, crewOverrides), entryFor(u, slot, lane.position()));
                }
            }
        }
        return placedToday;
    }

    /**
     * Simulate the swaps from the anchor to {@code date}: each period the relief person swaps places
     * with the next person in the succession line (the incoming relief leaves their crew slot, the
     * outgoing relief takes it). Returns the current {@code userId -> slot} (REL / A / B / C / D).
     */
    private Map<Long, String> reliefStateAt(ReliefLane lane, LocalDate date) {
        int q = quartersBetween(lane.anchor(), date, lane.periodMonths());
        return SchedulePatternMath.reliefSlots(lane.lineOrder(), lane.initialSlots(), q);
    }

    /**
     * Whole periods elapsed from anchor to date, counted as the number of {@code k} for which
     * {@code anchor.plusMonths(k * periodMonths)} does not fall after {@code date} — i.e. the swap
     * boundary lands on the anchor's day-of-month each period, not on the 1st of the boundary month.
     * A pure year*12+month diff (the previous implementation) ignores the anchor's day-of-month
     * entirely, so it flips the swap up to a whole period early for any anchor day after the 1st.
     * Clamped to 0 before the anchor.
     */
    private static int quartersBetween(LocalDate anchor, LocalDate date, int periodMonths) {
        int pm = Math.max(1, periodMonths);
        if (date.isBefore(anchor)) return 0;
        // Cheap starting estimate from the month diff, then correct to the exact boundary — plusMonths
        // clamps at short month-ends (e.g. anchor on the 31st), so the estimate can be off by one.
        int monthsDiff = (date.getYear() * 12 + date.getMonthValue()) - (anchor.getYear() * 12 + anchor.getMonthValue());
        int k = Math.max(0, monthsDiff / pm);
        while (!anchor.plusMonths((long) (k + 1) * pm).isAfter(date)) k++;
        while (k > 0 && anchor.plusMonths((long) k * pm).isAfter(date)) k--;
        return k;
    }

    private Map<String, Long> parseSlotMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, SLOT_MAP);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Bad relief slot JSON: {}", e.getMessage());
            return Map.of();
        }
    }

    /** A preloaded relief lane: position label + anchor/period + succession line + anchor slot map. */
    private record ReliefLane(String position, LocalDate anchor, int periodMonths, String reliefDays,
                              List<Long> lineOrder, Map<String, Long> initialSlots) {}

    /** Preloaded relief context for a run: the active lanes + crews-by-letter + member Users. */
    private record ReliefCtx(List<ReliefLane> lanes, Map<String, Crew> crewsByLetter,
                             Map<Long, User> members) {}

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
