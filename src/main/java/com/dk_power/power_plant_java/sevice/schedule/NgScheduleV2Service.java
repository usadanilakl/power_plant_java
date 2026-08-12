package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CrewAssignmentDto;
import com.dk_power.power_plant_java.dto.schedule.CrewDto;
import com.dk_power.power_plant_java.dto.schedule.CrewRotationDto;
import com.dk_power.power_plant_java.dto.schedule.CrewShiftOverrideDto;
import com.dk_power.power_plant_java.entities.schedule.CrewShiftOverride;
import com.dk_power.power_plant_java.repository.schedule.CrewShiftOverrideRepo;
import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.SchedulePositionDto;
import com.dk_power.power_plant_java.dto.schedule.OnCallRotationDto;
import com.dk_power.power_plant_java.dto.schedule.ReliefRotationDto;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventDto;
import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.entities.schedule.SchedulePosition;
import com.dk_power.power_plant_java.entities.schedule.OnCallRotation;
import com.dk_power.power_plant_java.entities.schedule.ReliefRotation;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.SchedulePositionRepo;
import com.dk_power.power_plant_java.repository.schedule.OnCallRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.ReliefRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.dto.schedule.ScheduleDayOverrideDto;
import com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Schedule v2 admin CRUD for positions, crew rotations, crews, staffing assignments, and events.
 * Every mutation re-runs the {@link ScheduleMaterialisationService} over the default horizon (a
 * no-op while {@code schedule.v2.enabled} is off, so managers can stage without disturbing v1).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NgScheduleV2Service {

    private static final TypeReference<List<PatternCell>> CELL_LIST = new TypeReference<>() {};
    private static final TypeReference<List<Long>> LONG_LIST = new TypeReference<>() {};
    private static final TypeReference<Map<String, Long>> SLOT_MAP = new TypeReference<>() {};

    private final SchedulePositionRepo positionRepo;
    private final CrewRotationRepo rotationRepo;
    private final CrewRepo crewRepo;
    private final CrewAssignmentRepo assignmentRepo;
    private final ScheduleEventRepo eventRepo;
    private final ScheduleDayOverrideRepo overrideRepo;
    private final CrewShiftOverrideRepo crewShiftOverrideRepo;
    private final OnCallRotationRepo onCallRepo;
    private final ReliefRotationRepo reliefRepo;
    private final UserRepo userRepo;
    private final ScheduleMaterialisationService materialisation;
    private final ShiftDayService shiftDayService;
    private final ObjectMapper objectMapper;

    // ---- Positions ----------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SchedulePositionDto> listPositions() {
        return positionRepo.findAllByOrderBySortOrderAscNameAsc().stream().map(this::toDto).toList();
    }

    public SchedulePositionDto savePosition(SchedulePositionDto dto) {
        SchedulePosition p = dto.getId() != null
                ? positionRepo.findById(dto.getId()).orElseGet(SchedulePosition::new)
                : new SchedulePosition();
        p.setName(dto.getName());
        p.setAbbreviation(dto.getAbbreviation());
        p.setColor(dto.getColor());
        p.setSortOrder(dto.getSortOrder());
        p.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        return toDto(positionRepo.save(p));
    }

    public boolean deletePosition(Long id) {
        return positionRepo.findById(id).map(p -> { p.setDeleted(true); positionRepo.save(p); return true; }).orElse(false);
    }

    // ---- Rotations ----------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CrewRotationDto> listRotations() {
        return rotationRepo.findAll().stream().map(this::toDto).toList();
    }

    public CrewRotationDto saveRotation(CrewRotationDto dto) {
        CrewRotation r = dto.getId() != null
                ? rotationRepo.findById(dto.getId()).orElseGet(CrewRotation::new)
                : new CrewRotation();
        r.setName(dto.getName());
        r.setColor(dto.getColor());
        r.setPatternLengthDays(dto.getPatternLengthDays());
        r.setAnchorDate(dto.getAnchorDate());
        r.setRotationCells(writeCells(dto.getCells(), dto.getPatternLengthDays()));
        r.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        CrewRotation saved = rotationRepo.save(r);
        rematerialize();
        return toDto(saved);
    }

    public boolean deleteRotation(Long id) {
        return rotationRepo.findById(id).map(r -> { r.setDeleted(true); rotationRepo.save(r); rematerialize(); return true; }).orElse(false);
    }

    // ---- Crews --------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CrewDto> listCrews() {
        return crewRepo.findAll().stream().map(this::toDto).toList();
    }

    public CrewDto saveCrew(CrewDto dto) {
        Crew c = dto.getId() != null
                ? crewRepo.findById(dto.getId()).orElseGet(Crew::new)
                : new Crew();
        c.setName(dto.getName());
        c.setOffsetDays(dto.getOffsetDays() == null ? 0 : dto.getOffsetDays());
        c.setColor(dto.getColor());
        c.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        if (dto.getRotationId() != null) rotationRepo.findById(dto.getRotationId()).ifPresent(c::setRotation);
        else c.setRotation(null);
        CrewDto out = toDto(crewRepo.save(c));
        rematerialize();
        return out;
    }

    public boolean deleteCrew(Long id) {
        return crewRepo.findById(id).map(c -> { c.setDeleted(true); crewRepo.save(c); rematerialize(); return true; }).orElse(false);
    }

    // ---- Staffing (assignments) ---------------------------------------------

    @Transactional(readOnly = true)
    public List<CrewAssignmentDto> listAssignments(Long crewId) {
        List<CrewAssignment> rows = crewId != null ? assignmentRepo.findByCrew_Id(crewId) : assignmentRepo.findAll();
        return rows.stream().map(this::toDto).toList();
    }

    public CrewAssignmentDto saveAssignment(CrewAssignmentDto dto) {
        CrewAssignment a = dto.getId() != null
                ? assignmentRepo.findById(dto.getId()).orElseGet(CrewAssignment::new)
                : new CrewAssignment();
        if (dto.getUserId() != null) userRepo.findById(dto.getUserId()).ifPresent(a::setUser);
        String type = dto.getAssignmentType() == null ? CrewAssignment.Type.ROTATING : dto.getAssignmentType();
        a.setAssignmentType(type);
        // A crew only makes sense for ROTATING; clear it otherwise so it can't linger.
        if (CrewAssignment.Type.ROTATING.equals(type) && dto.getCrewId() != null) {
            crewRepo.findById(dto.getCrewId()).ifPresent(a::setCrew);
        } else {
            a.setCrew(null);
        }
        a.setPosition(dto.getPosition());
        a.setGroupLabel(dto.getGroupLabel());
        a.setFixedShift(dto.getFixedShift());
        a.setFixedDaysOfWeek(dto.getFixedDaysOfWeek());
        a.setStartDate(dto.getStartDate());
        a.setEndDate(dto.getEndDate());
        a.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        CrewAssignmentDto out = toDto(assignmentRepo.save(a));
        rematerialize();
        return out;
    }

    public boolean deleteAssignment(Long id) {
        return assignmentRepo.findById(id).map(a -> { a.setDeleted(true); assignmentRepo.save(a); rematerialize(); return true; }).orElse(false);
    }

    // ---- Events -------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ScheduleEventDto> listEvents(LocalDate from, LocalDate to) {
        List<ScheduleEvent> rows = (from != null && to != null) ? eventRepo.findOverlapping(from, to) : eventRepo.findAll();
        return rows.stream().map(this::toDto).toList();
    }

    public ScheduleEventDto saveEvent(ScheduleEventDto dto) {
        ScheduleEvent e = dto.getId() != null
                ? eventRepo.findById(dto.getId()).orElseGet(ScheduleEvent::new)
                : new ScheduleEvent();
        e.setEventType(dto.getEventType());
        e.setStartDate(dto.getStartDate());
        e.setEndDate(dto.getEndDate());
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        e.setColor(dto.getColor());
        e.setAppliesToShift(dto.getAppliesToShift());
        ScheduleEventDto out = toDto(eventRepo.save(e));
        rematerialize();
        return out;
    }

    public boolean deleteEvent(Long id) {
        return eventRepo.findById(id).map(e -> { e.setDeleted(true); eventRepo.save(e); rematerialize(); return true; }).orElse(false);
    }

    // ---- Day overrides (per-day manual adjustments) -------------------------

    @Transactional(readOnly = true)
    public List<ScheduleDayOverrideDto> listOverrides(LocalDate from, LocalDate to) {
        List<ScheduleDayOverride> rows = (from != null && to != null)
                ? overrideRepo.findByDateBetween(from, to) : overrideRepo.findAll();
        return rows.stream().map(this::toDto).toList();
    }

    public ScheduleDayOverrideDto saveOverride(ScheduleDayOverrideDto dto) {
        if (materialisation.isDateLocked(dto.getDate())) {
            throw new IllegalStateException("That day is locked (before the " + materialisation.earliestEditableDate()
                    + " edit cutoff) and can no longer be changed.");
        }
        ScheduleDayOverride o = null;
        if (dto.getId() != null) {
            o = overrideRepo.findById(dto.getId()).orElse(null);
        } else if (dto.getDate() != null && dto.getUserId() != null) {
            // Upsert by (date, user) so re-setting a person's override replaces rather than piling up rows.
            o = overrideRepo.findByDate(dto.getDate()).stream()
                    .filter(x -> x.getUser() != null && dto.getUserId().equals(x.getUser().getId()))
                    .findFirst().orElse(null);
        }
        if (o == null) o = new ScheduleDayOverride();
        o.setDate(dto.getDate());
        if (dto.getUserId() != null) userRepo.findById(dto.getUserId()).ifPresent(o::setUser);
        o.setShift(dto.getShift());
        o.setReason(dto.getReason());
        ScheduleDayOverrideDto out = toDto(overrideRepo.save(o));
        rematerialize();
        return out;
    }

    public boolean deleteOverride(Long id) {
        return overrideRepo.findById(id)
                .map(o -> { o.setDeleted(true); overrideRepo.save(o); rematerialize(); return true; })
                .orElse(false);
    }

    private ScheduleDayOverrideDto toDto(ScheduleDayOverride o) {
        return ScheduleDayOverrideDto.builder()
                .id(o.getId())
                .date(o.getDate())
                .userId(o.getUser() != null ? o.getUser().getId() : null)
                .userName(o.getUser() != null ? displayName(o.getUser()) : null)
                .shift(o.getShift())
                .reason(o.getReason())
                .build();
    }

    // ---- On-call rotation ---------------------------------------------------

    @Transactional(readOnly = true)
    // ---- Crew shift overrides (outage / campaign pins) -------------------------------------------

    /** All crew-shift overrides, or only those overlapping [from,to] when both are given. */
    public List<CrewShiftOverrideDto> listCrewShiftOverrides(LocalDate from, LocalDate to) {
        List<CrewShiftOverride> rows = (from != null && to != null)
                ? crewShiftOverrideRepo.findActiveOverlapping(from, to)
                : crewShiftOverrideRepo.findAll();
        return rows.stream().map(this::toDto).toList();
    }

    public CrewShiftOverrideDto saveCrewShiftOverride(CrewShiftOverrideDto dto) {
        CrewShiftOverride o = dto.getId() != null
                ? crewShiftOverrideRepo.findById(dto.getId()).orElseGet(CrewShiftOverride::new)
                : new CrewShiftOverride();
        o.setLabel(dto.getLabel());
        o.setStartDate(dto.getStartDate());
        o.setEndDate(dto.getEndDate());
        if (dto.getCrewId() != null) crewRepo.findById(dto.getCrewId()).ifPresent(o::setCrew);
        o.setShift(dto.getShift());
        o.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        CrewShiftOverrideDto out = toDto(crewShiftOverrideRepo.save(o));
        rematerialize();
        return out;
    }

    public boolean deleteCrewShiftOverride(Long id) {
        return crewShiftOverrideRepo.findById(id)
                .map(o -> { o.setDeleted(true); crewShiftOverrideRepo.save(o); rematerialize(); return true; })
                .orElse(false);
    }

    private CrewShiftOverrideDto toDto(CrewShiftOverride o) {
        Crew c = o.getCrew();
        return CrewShiftOverrideDto.builder()
                .id(o.getId()).label(o.getLabel())
                .startDate(o.getStartDate()).endDate(o.getEndDate())
                .crewId(c != null ? c.getId() : null)
                .crewName(c != null ? c.getName() : null)
                .shift(o.getShift()).isActive(o.getIsActive())
                .build();
    }

    public List<OnCallRotationDto> listOnCall() {
        return onCallRepo.findAll().stream().map(this::toDto).toList();
    }

    public OnCallRotationDto saveOnCall(OnCallRotationDto dto) {
        OnCallRotation r = dto.getId() != null
                ? onCallRepo.findById(dto.getId()).orElseGet(OnCallRotation::new)
                : new OnCallRotation();
        r.setName(dto.getName() == null || dto.getName().isBlank() ? "On-Call Managers" : dto.getName());
        r.setDaysPerTurn(dto.getDaysPerTurn() == null || dto.getDaysPerTurn() < 1 ? 7 : dto.getDaysPerTurn());
        r.setAnchorDate(dto.getAnchorDate());
        r.setMemberUserIdsJson(writeLongs(dto.getMemberUserIds()));
        r.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        OnCallRotationDto out = toDto(onCallRepo.save(r));
        rematerialize();
        return out;
    }

    public boolean deleteOnCall(Long id) {
        return onCallRepo.findById(id).map(r -> { r.setDeleted(true); onCallRepo.save(r); rematerialize(); return true; }).orElse(false);
    }

    // ---- Relief-swap rotation -----------------------------------------------

    @Transactional(readOnly = true)
    public List<ReliefRotationDto> listRelief() {
        return reliefRepo.findAll().stream().map(this::toDto).toList();
    }

    public ReliefRotationDto saveRelief(ReliefRotationDto dto) {
        ReliefRotation r = dto.getId() != null
                ? reliefRepo.findById(dto.getId()).orElseGet(ReliefRotation::new)
                : new ReliefRotation();
        r.setName(dto.getName() == null || dto.getName().isBlank() ? "Relief rotation" : dto.getName());
        r.setPosition(dto.getPosition());
        r.setPeriodMonths(dto.getPeriodMonths() == null || dto.getPeriodMonths() < 1 ? 3 : dto.getPeriodMonths());
        r.setAnchorDate(dto.getAnchorDate());
        r.setLineOrderJson(writeLongs(dto.getLineOrder()));
        r.setInitialSlotsJson(writeSlotMap(dto.getInitialSlots()));
        r.setReliefDaysOfWeek(dto.getReliefDaysOfWeek());
        r.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        ReliefRotationDto out = toDto(reliefRepo.save(r));
        rematerialize();
        return out;
    }

    public boolean deleteRelief(Long id) {
        return reliefRepo.findById(id).map(r -> { r.setDeleted(true); reliefRepo.save(r); rematerialize(); return true; }).orElse(false);
    }

    // ---- Misc ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Map<String, Object>> assignableUsers() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : userRepo.findByIsActiveTrue()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", displayName(u));
            out.add(m);
        }
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("active", materialisation.isActive());
        // Past-lock boundary: days before this are frozen (see schedule.v2.lock-before-days). The grid
        // greys them out and disables the override modal on those date headers.
        m.put("earliestEditable", materialisation.earliestEditableDate());
        return m;
    }

    /** One baked staffing row: userId + crew letter (or "REL") + role. */
    private record Seed(long userId, String crew, String role) {}

    /** One baked non-operator staff row: userId + group heading + position (from the personnel titles). */
    private record Support(long userId, String group, String position) {}

    /**
     * The two 28-day rotation grids (one shift per cycle-day). CD is the COMPLEMENT of AB — CD works
     * exactly when AB is off — which gives gap-free, overlap-free 24/7 with crews A/B on AB and C/D
     * on CD (day crew offset 0, night crew offset 14).
     */
    private static final String GRID_AB = "DDOODDDDDOOOOONNOONNNNNOOOOO"; // 2 on 2 off 5 on 5 off (+night half)
    private static final String GRID_CD = "OODDOOOOODDDDDOONNOOOOONNNNN"; // 2 off 2 on 5 off 5 on (+night half)

    /**
     * One-time curated seed of staffing from the current SharePoint-derived roster (baked from the
     * 2026-07-29 shift_days analysis): ROTATING assignments A/B/C/D with position by in-crew order
     * (Lead/CRO/AO), plus RELIEF for the relief operators. Goes through JPA so it syncs. Idempotent —
     * skips any user who already has an active assignment, so it's safe to re-run.
     */
    public Map<String, Object> seedInitial() {
        // Ensure the canonical 24/7 structure exists (idempotent): positions, the two complementary
        // rotations (AB + CD), and the 4 crews wired to them — A/B on AB, C/D on CD, day=offset 0,
        // night=offset 14. Re-running also corrects crews that were pointed at the wrong rotation/offset.
        ensurePosition("Lead", "Lead", 1);
        ensurePosition("Control Room Operator", "CRO", 2);
        ensurePosition("Auxiliary Operator", "AO", 3);
        CrewRotation rotAB = ensureRotation("2 on 2 off 5 on 5 off", GRID_AB, "#42A5F5");
        CrewRotation rotCD = ensureRotation("2 off 2 on 5 off 5 on", GRID_CD, "#66BB6A");
        ensureCrew("Crew A", rotAB, 0, "#42A5F5");
        ensureCrew("Crew B", rotAB, 14, "#26C6DA");
        ensureCrew("Crew C", rotCD, 0, "#FFA726");
        ensureCrew("Crew D", rotCD, 14, "#AB47BC");
        // On-call manager rotation — weekly, anchored 2026-05-01: Ken, Scott, Matt, Heather, Ryan, Austin.
        ensureOnCall("On-Call Managers", 7, LocalDate.of(2026, 5, 1),
                List.of(2000042237L, 2000042241L, 2000042239L, 2000042233L, 2000042240L, 52L));
        // Lead relief-swap (quarterly): succession John→Rigo→Danil→Andrew→Stu; current block Jul–Sep 2026
        // with Danil on relief. Crews at the Jul-1 anchor: A=Stu, B=John, C=Rigo, D=Andrew.
        // (AO lane is added once its succession order is confirmed.)
        ensureRelief("Lead relief", "Lead", 3, LocalDate.of(2026, 7, 1), "MON,TUE,WED,THU,FRI",
                List.of(2000042234L, 102L, 2L, 1L, 1702L),
                Map.of("REL", 2L, "A", 1702L, "B", 2000042234L, "C", 102L, "D", 1L));
        // AO relief-swap: succession Geo→Stroud→Anthony→Dustin L→(Juan, appended pending confirmation);
        // current block Jul–Sep 2026 with Anthony on relief. Crews at anchor: A=Stroud, B=Juan, C=Dustin L, D=Geo.
        ensureRelief("AO relief", resolvePositionName("AO"), 3, LocalDate.of(2026, 7, 1), "MON,TUE,WED,THU,FRI",
                List.of(2000042232L, 2000042226L, 2000042227L, 2000042230L, 2000042235L),
                Map.of("REL", 2000042227L, "A", 2000042226L, "B", 2000042235L, "C", 2000042230L, "D", 2000042232L));

        List<Seed> roster = List.of(
                new Seed(1702L, "A", "LEAD"), new Seed(2000042243L, "A", "CRO"), new Seed(2000042226L, "A", "AO"),
                new Seed(2000042234L, "B", "LEAD"), new Seed(2000042236L, "B", "CRO"), new Seed(2000042235L, "B", "AO"),
                new Seed(102L, "C", "LEAD"), new Seed(2000042225L, "C", "CRO"), new Seed(2000042230L, "C", "AO"),
                new Seed(1L, "D", "LEAD"), new Seed(2000042231L, "D", "CRO"), new Seed(2000042232L, "D", "AO"),
                new Seed(2L, "REL", "LEAD"), new Seed(2000042227L, "REL", "AO"));

        java.util.Map<String, com.dk_power.power_plant_java.entities.schedule.Crew> crewByLetter = new java.util.HashMap<>();
        for (var c : crewRepo.findAll()) {
            String n = c.getName() == null ? "" : c.getName().trim();
            if (!n.isEmpty()) crewByLetter.putIfAbsent(n.substring(n.length() - 1).toUpperCase(), c);
        }
        String leadPos = resolvePositionName("LEAD"), croPos = resolvePositionName("CRO"), aoPos = resolvePositionName("AO");
        List<CrewAssignment> existing = assignmentRepo.findAll();

        int created = 0, skipped = 0;
        List<String> notes = new ArrayList<>();
        for (Seed s : roster) {
            User u = userRepo.findById(s.userId()).orElse(null);
            if (u == null) { notes.add("user " + s.userId() + " not found — skipped"); skipped++; continue; }
            boolean already = existing.stream().anyMatch(a -> a.getUser() != null
                    && a.getUser().getId() != null && a.getUser().getId() == s.userId()
                    && Boolean.TRUE.equals(a.getIsActive()));
            if (already) { skipped++; continue; }

            CrewAssignment a = new CrewAssignment();
            a.setUser(u);
            a.setIsActive(true);
            if ("REL".equals(s.crew())) {
                // Relief operators work a fixed DAY shift (non-rotating): one Lead + one AO.
                a.setAssignmentType(CrewAssignment.Type.FIXED);
                a.setFixedShift(CrewRotation.Shift.DAY);
                a.setPosition("LEAD".equals(s.role()) ? leadPos : aoPos);
            } else {
                var crew = crewByLetter.get(s.crew());
                if (crew == null) { notes.add("crew " + s.crew() + " not found — skipped " + s.userId()); skipped++; continue; }
                a.setAssignmentType(CrewAssignment.Type.ROTATING);
                a.setCrew(crew);
                a.setPosition("LEAD".equals(s.role()) ? leadPos : "CRO".equals(s.role()) ? croPos : aoPos);
            }
            assignmentRepo.save(a);
            created++;
        }

        // ── Non-operator staff, from the SharePoint personnel titles ──────────────────────────
        // Correct the earlier fuzzy mis-match: schedule "Eugene" = Yevhen Mykhailenko (a CRO), NOT
        // Dustin Sero (a Mechanic). Move the Crew D CRO seat to Yevhen so Dustin can join Maintenance.
        // Re-read so this also fires on a fresh seed (where the operator loop just created the row).
        for (CrewAssignment a : assignmentRepo.findAll()) {
            if (a.getUser() != null && a.getUser().getId() != null && a.getUser().getId() == 2000042231L
                    && CrewAssignment.Type.ROTATING.equals(a.getAssignmentType())
                    && Boolean.TRUE.equals(a.getIsActive())) {
                userRepo.findById(2000042246L).ifPresent(a::setUser);
                assignmentRepo.save(a);
                notes.add("Crew D CRO corrected: Dustin Sero → Eugene Mykhailenko");
            }
        }

        // Yevhen Mykhailenko now goes by the American form "Eugene" — reflect it so the schedule shows
        // the name he uses. (A future SharePoint personnel re-sync re-asserts whatever the sheet says.)
        userRepo.findById(2000042246L).ifPresent(e -> {
            e.setFirstName("Eugene");
            e.setName("Eugene Mykhailenko");
            e.setScheduleName("Eugene");
            userRepo.save(e);
        });

        // Positions for the support crafts / staff titles.
        ensurePosition("Mechanic", "Mech", 4);
        ensurePosition("I&C", "I&C", 5);
        ensurePosition("Admin", "Admin", 8);
        ensurePosition("Operations Manager", "OpsM", 9);
        ensurePosition("Plant Manager", "PM", 10);
        ensurePosition("Maintenance Manager", "MntM", 11);
        ensurePosition("Maintenance Planner", "MntP", 12);
        ensurePosition("Plant Engineer", "PE", 13);
        ensurePosition("EH&S", "EHS", 14);

        // Fixed day-shift staff, 4×10 (Mon–Thu default; flip a person to Tue–Fri in Staffing for a
        // Monday off). Maintenance = mechanics + I&C; Management = the salaried day staff. Vacations
        // flow in as PTO; a HOLIDAY-week rule (Mon–Fri minus the holiday) is a follow-on.
        List<Support> support = List.of(
                new Support(2000042231L, "Maintenance", "Mechanic"),      // Dustin Sero
                new Support(2000042238L, "Maintenance", "Mechanic"),      // Kody Ziegler
                new Support(2000042228L, "Maintenance", "I&C"),           // Brandon Barrow
                new Support(2000042229L, "Maintenance", "I&C"),           // Cory Fuhrmann
                new Support(2000042244L, "Maintenance", "I&C"),           // Tyler Johnson
                new Support(2000042245L, "Maintenance", "I&C"),           // William Genz
                new Support(52L, "Management", "Operations Manager"),         // Austin Ouellette (now Ops Mgr)
                new Support(2000042241L, "Management", "Plant Manager"),      // Scott Freese
                new Support(2000042240L, "Management", "Maintenance Manager"), // Ryan Sedler
                new Support(2000042237L, "Management", "Maintenance Planner"), // Ken Bassett
                new Support(2000042239L, "Management", "Plant Engineer"),      // Matt Wrightsman
                new Support(2000042233L, "Management", "EH&S"),              // Heather Sincak
                new Support(2000042242L, "Management", "Admin"));            // Sherrie Geslak

        List<CrewAssignment> after = assignmentRepo.findAll();   // re-read: the CRO fix moved a row
        for (Support s : support) {
            User u = userRepo.findById(s.userId()).orElse(null);
            if (u == null) { notes.add("user " + s.userId() + " not found — skipped"); skipped++; continue; }
            boolean already = after.stream().anyMatch(a -> a.getUser() != null
                    && a.getUser().getId() != null && a.getUser().getId() == s.userId()
                    && Boolean.TRUE.equals(a.getIsActive()));
            if (already) { skipped++; continue; }
            CrewAssignment a = new CrewAssignment();
            a.setUser(u);
            a.setIsActive(true);
            a.setAssignmentType(CrewAssignment.Type.FIXED);
            a.setFixedShift(CrewRotation.Shift.DAY);
            a.setFixedDaysOfWeek("MON,TUE,WED,THU");
            a.setGroupLabel(s.group());
            a.setPosition(s.position());
            assignmentRepo.save(a);
            created++;
        }

        rematerialize();
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("created", created);
        res.put("skipped", skipped);
        res.put("notes", notes);
        return res;
    }

    /** Resolve a stored position name for a role from the configured positions (by name/abbrev, then sortOrder). */
    private String resolvePositionName(String role) {
        List<SchedulePosition> ps = positionRepo.findAll();
        for (SchedulePosition p : ps) {
            String nm = (p.getName() == null ? "" : p.getName()).toLowerCase();
            String ab = (p.getAbbreviation() == null ? "" : p.getAbbreviation()).toUpperCase();
            if ("LEAD".equals(role) && (nm.contains("lead") || "LEAD".equals(ab))) return p.getName();
            if ("CRO".equals(role) && (nm.contains("control room") || "CRO".equals(ab))) return p.getName();
            if ("AO".equals(role) && (nm.contains("auxiliary") || "AO".equals(ab))) return p.getName();
        }
        ps.sort(java.util.Comparator.comparing(p -> p.getSortOrder() == null ? 99 : p.getSortOrder()));
        int idx = "LEAD".equals(role) ? 0 : "CRO".equals(role) ? 1 : 2;
        return idx < ps.size() ? ps.get(idx).getName() : role;
    }

    private SchedulePosition ensurePosition(String name, String abbr, int sortOrder) {
        SchedulePosition p = positionRepo.findAll().stream()
                .filter(x -> name.equalsIgnoreCase(x.getName())).findFirst().orElseGet(SchedulePosition::new);
        p.setName(name);
        p.setAbbreviation(abbr);
        p.setSortOrder(sortOrder);
        p.setIsActive(true);
        return positionRepo.save(p);
    }

    private CrewRotation ensureRotation(String name, String grid, String color) {
        CrewRotation r = rotationRepo.findAll().stream()
                .filter(x -> name.equalsIgnoreCase(x.getName())).findFirst().orElseGet(CrewRotation::new);
        r.setName(name);
        if (r.getColor() == null) r.setColor(color);
        r.setPatternLengthDays(grid.length());
        r.setRotationCells(gridToCells(grid));
        r.setIsActive(true);
        return rotationRepo.save(r);
    }

    /** Find a crew by exact name or trailing letter, then wire it to the rotation/offset. */
    private Crew ensureCrew(String name, CrewRotation rot, int offset, String color) {
        String letter = name.substring(name.length() - 1).toUpperCase();
        Crew c = crewRepo.findAll().stream().filter(x -> {
            String n = x.getName() == null ? "" : x.getName().trim();
            return name.equalsIgnoreCase(n)
                    || (!n.isEmpty() && n.substring(n.length() - 1).equalsIgnoreCase(letter));
        }).findFirst().orElseGet(Crew::new);
        c.setName(name);
        c.setRotation(rot);
        c.setOffsetDays(offset);
        if (c.getColor() == null) c.setColor(color);
        c.setIsActive(true);
        return crewRepo.save(c);
    }

    private String gridToCells(String grid) {
        List<PatternCell> cells = new ArrayList<>();
        for (int i = 0; i < grid.length(); i++) {
            cells.add(PatternCell.builder().dayIndex(i).shift(String.valueOf(grid.charAt(i))).build());
        }
        try {
            return objectMapper.writeValueAsString(cells);
        } catch (Exception e) {
            log.error("[ScheduleV2] Failed to serialize rotation grid: {}", e.getMessage());
            return null;
        }
    }

    private void ensureOnCall(String name, int daysPerTurn, LocalDate anchor, List<Long> members) {
        OnCallRotation r = onCallRepo.findAll().stream()
                .filter(x -> name.equalsIgnoreCase(x.getName())).findFirst().orElseGet(OnCallRotation::new);
        r.setName(name);
        r.setDaysPerTurn(daysPerTurn);
        r.setAnchorDate(anchor);
        r.setMemberUserIdsJson(writeLongs(members));
        r.setIsActive(true);
        onCallRepo.save(r);
    }

    /** Idempotent seed of a relief-swap lane by name. */
    private void ensureRelief(String name, String position, int periodMonths, LocalDate anchor,
                              String reliefDays, List<Long> lineOrder, Map<String, Long> initialSlots) {
        ReliefRotation r = reliefRepo.findAll().stream()
                .filter(x -> name.equalsIgnoreCase(x.getName())).findFirst().orElseGet(ReliefRotation::new);
        r.setName(name);
        r.setPosition(position);
        r.setPeriodMonths(periodMonths);
        r.setAnchorDate(anchor);
        r.setReliefDaysOfWeek(reliefDays);
        r.setLineOrderJson(writeLongs(lineOrder));
        r.setInitialSlotsJson(writeSlotMap(initialSlots));
        r.setIsActive(true);
        reliefRepo.save(r);
    }

    public int materializeNow(LocalDate from, LocalDate to) {
        return materialisation.materializeRange(from, to);
    }

    /** The materialised schedule for a range — the rendered ShiftDay rows the Schedule tab shows. */
    @Transactional(readOnly = true)
    public List<ShiftDayDto> schedulePreview(LocalDate from, LocalDate to) {
        return shiftDayService.getRange(from, to);
    }

    private void rematerialize() {
        // Runs in THIS transaction so the materialised ShiftDay commits together with the authoring
        // save. materializeRange never throws (it catches internally, see ScheduleMaterialisationService)
        // — critical, because a nested @Transactional that throws marks the shared transaction
        // rollback-only even when the caller catches it, which would fail the save itself.
        materialisation.materializeDefaultHorizon();
    }

    // ---- mappers ------------------------------------------------------------

    private SchedulePositionDto toDto(SchedulePosition p) {
        return SchedulePositionDto.builder()
                .id(p.getId()).name(p.getName()).abbreviation(p.getAbbreviation())
                .color(p.getColor()).sortOrder(p.getSortOrder()).isActive(p.getIsActive())
                .build();
    }

    private CrewRotationDto toDto(CrewRotation r) {
        return CrewRotationDto.builder()
                .id(r.getId()).name(r.getName()).color(r.getColor())
                .patternLengthDays(r.getPatternLengthDays())
                .anchorDate(r.getAnchorDate())
                .cells(readCells(r.getRotationCells()))
                .isActive(r.getIsActive())
                .build();
    }

    private CrewDto toDto(Crew c) {
        CrewRotation rot = c.getRotation();
        return CrewDto.builder()
                .id(c.getId()).name(c.getName())
                .rotationId(rot != null ? rot.getId() : null)
                .rotationName(rot != null ? rot.getName() : null)
                .offsetDays(c.getOffsetDays()).color(c.getColor()).isActive(c.getIsActive())
                .build();
    }

    private CrewAssignmentDto toDto(CrewAssignment a) {
        User u = a.getUser();
        Crew c = a.getCrew();
        return CrewAssignmentDto.builder()
                .id(a.getId())
                .userId(u != null ? u.getId() : null)
                .userName(u != null ? displayName(u) : null)
                .crewId(c != null ? c.getId() : null)
                .crewName(c != null ? c.getName() : null)
                .position(a.getPosition())
                .groupLabel(a.getGroupLabel())
                .assignmentType(a.getAssignmentType())
                .fixedShift(a.getFixedShift())
                .fixedDaysOfWeek(a.getFixedDaysOfWeek())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .isActive(a.getIsActive())
                .build();
    }

    private ScheduleEventDto toDto(ScheduleEvent e) {
        return ScheduleEventDto.builder()
                .id(e.getId()).eventType(e.getEventType())
                .startDate(e.getStartDate()).endDate(e.getEndDate())
                .title(e.getTitle()).description(e.getDescription())
                .color(e.getColor()).appliesToShift(e.getAppliesToShift())
                .build();
    }

    private String writeCells(List<PatternCell> cells, Integer length) {
        if (cells == null || cells.isEmpty()) return null;
        int max = length == null ? Integer.MAX_VALUE : length;
        List<PatternCell> kept = cells.stream()
                .filter(c -> c.getDayIndex() != null && c.getDayIndex() >= 0 && c.getDayIndex() < max
                        && c.getShift() != null && !c.getShift().isBlank())
                .toList();
        if (kept.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(kept);
        } catch (Exception e) {
            log.error("[ScheduleV2] Failed to serialize rotation cells: {}", e.getMessage());
            return null;
        }
    }

    private List<PatternCell> readCells(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, CELL_LIST);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Failed to parse rotation cells: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private OnCallRotationDto toDto(OnCallRotation r) {
        List<Long> ids = readLongs(r.getMemberUserIdsJson());
        List<String> names = ids.stream()
                .map(id -> userRepo.findById(id).map(this::displayName).orElse("User " + id))
                .toList();
        return OnCallRotationDto.builder()
                .id(r.getId()).name(r.getName()).daysPerTurn(r.getDaysPerTurn())
                .anchorDate(r.getAnchorDate()).memberUserIds(ids).memberNames(names)
                .isActive(r.getIsActive())
                .build();
    }

    private String writeLongs(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (Exception e) {
            log.error("[ScheduleV2] Failed to serialize on-call members: {}", e.getMessage());
            return null;
        }
    }

    private List<Long> readLongs(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, LONG_LIST);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Failed to parse on-call members: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private ReliefRotationDto toDto(ReliefRotation r) {
        List<Long> line = readLongs(r.getLineOrderJson());
        Map<String, Long> slots = readSlotMap(r.getInitialSlotsJson());
        List<String> lineNames = line.stream()
                .map(id -> userRepo.findById(id).map(this::displayName).orElse("User " + id)).toList();
        return ReliefRotationDto.builder()
                .id(r.getId()).name(r.getName()).position(r.getPosition())
                .periodMonths(r.getPeriodMonths()).anchorDate(r.getAnchorDate())
                .lineOrder(line).lineNames(lineNames).initialSlots(slots)
                .reliefDaysOfWeek(r.getReliefDaysOfWeek()).isActive(r.getIsActive())
                .build();
    }

    private String writeSlotMap(Map<String, Long> slots) {
        if (slots == null || slots.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(slots);
        } catch (Exception e) {
            log.error("[ScheduleV2] Failed to serialize relief slots: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Long> readSlotMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, SLOT_MAP);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Failed to parse relief slots: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String displayName(User u) {
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }
}
