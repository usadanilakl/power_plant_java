package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CrewAssignmentDto;
import com.dk_power.power_plant_java.dto.schedule.CrewDto;
import com.dk_power.power_plant_java.dto.schedule.CrewRotationDto;
import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.SchedulePositionDto;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventDto;
import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.entities.schedule.SchedulePosition;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.SchedulePositionRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
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

    private final SchedulePositionRepo positionRepo;
    private final CrewRotationRepo rotationRepo;
    private final CrewRepo crewRepo;
    private final CrewAssignmentRepo assignmentRepo;
    private final ScheduleEventRepo eventRepo;
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
        return m;
    }

    /** One baked staffing row: userId + crew letter (or "REL") + role. */
    private record Seed(long userId, String crew, String role) {}

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

    public int materializeNow(LocalDate from, LocalDate to) {
        return materialisation.materializeRange(from, to);
    }

    /** The materialised schedule for a range — the rendered ShiftDay rows the Schedule tab shows. */
    @Transactional(readOnly = true)
    public List<ShiftDayDto> schedulePreview(LocalDate from, LocalDate to) {
        return shiftDayService.getRange(from, to);
    }

    private void rematerialize() {
        try {
            materialisation.materializeDefaultHorizon();
        } catch (Exception e) {
            log.warn("[ScheduleV2] Materialisation after edit failed (authoring committed): {}", e.getMessage());
        }
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

    private String displayName(User u) {
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }
}
