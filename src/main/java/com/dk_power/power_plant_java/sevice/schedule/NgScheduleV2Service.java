package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CrewAssignmentDto;
import com.dk_power.power_plant_java.dto.schedule.CrewPatternDto;
import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventDto;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewPattern;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewPatternRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
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
 * Schedule v2 admin CRUD for crew patterns, assignments, and events. Every mutation re-runs the
 * {@link ScheduleMaterialisationService} over the default horizon so materialised {@code ShiftDay}
 * rows track the authoring model — a no-op when the {@code schedule.v2.enabled} flag is off, so
 * managers can author/stage patterns without disturbing the live v1 schedule.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NgScheduleV2Service {

    private static final TypeReference<List<PatternCell>> CELL_LIST = new TypeReference<>() {};

    private final CrewPatternRepo patternRepo;
    private final CrewAssignmentRepo assignmentRepo;
    private final ScheduleEventRepo eventRepo;
    private final UserRepo userRepo;
    private final ScheduleMaterialisationService materialisation;
    private final ObjectMapper objectMapper;

    // ---- Crew patterns ------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CrewPatternDto> listPatterns() {
        return patternRepo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CrewPatternDto getPattern(Long id) {
        return patternRepo.findById(id).map(this::toDto).orElse(null);
    }

    public CrewPatternDto savePattern(CrewPatternDto dto) {
        CrewPattern p = dto.getId() != null
                ? patternRepo.findById(dto.getId()).orElseGet(CrewPattern::new)
                : new CrewPattern();
        p.setName(dto.getName());
        p.setColor(dto.getColor());
        p.setPatternLengthDays(dto.getPatternLengthDays());
        p.setPatternCells(writeCells(dto.getCells()));
        p.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        CrewPattern saved = patternRepo.save(p);
        rematerialize();
        return toDto(saved);
    }

    public boolean deletePattern(Long id) {
        return patternRepo.findById(id).map(p -> {
            p.setDeleted(true);
            patternRepo.save(p);
            rematerialize();
            return true;
        }).orElse(false);
    }

    // ---- Crew assignments ---------------------------------------------------

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
        if (dto.getCrewId() != null) patternRepo.findById(dto.getCrewId()).ifPresent(a::setCrew);
        a.setRole(dto.getRole());
        a.setStartDate(dto.getStartDate());
        a.setEndDate(dto.getEndDate());
        a.setPatternOffsetDays(dto.getPatternOffsetDays() == null ? 0 : dto.getPatternOffsetDays());
        a.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        CrewAssignment saved = assignmentRepo.save(a);
        rematerialize();
        return toDto(saved);
    }

    public boolean deleteAssignment(Long id) {
        return assignmentRepo.findById(id).map(a -> {
            a.setDeleted(true);
            assignmentRepo.save(a);
            rematerialize();
            return true;
        }).orElse(false);
    }

    // ---- Events -------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ScheduleEventDto> listEvents(LocalDate from, LocalDate to) {
        List<ScheduleEvent> rows = (from != null && to != null)
                ? eventRepo.findOverlapping(from, to)
                : eventRepo.findAll();
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
        ScheduleEvent saved = eventRepo.save(e);
        rematerialize();
        return toDto(saved);
    }

    public boolean deleteEvent(Long id) {
        return eventRepo.findById(id).map(e -> {
            e.setDeleted(true);
            eventRepo.save(e);
            rematerialize();
            return true;
        }).orElse(false);
    }

    // ---- Misc ---------------------------------------------------------------

    /** Minimal [{id, name}] list of active users for the assignment picker. */
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

    /** Materialiser feature-flag state for the admin UI to surface (enabled / rollback / active). */
    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("active", materialisation.isActive());
        return m;
    }

    /** Manual materialise trigger for the admin "regenerate" action. */
    public int materializeNow(LocalDate from, LocalDate to) {
        return materialisation.materializeRange(from, to);
    }

    private void rematerialize() {
        try {
            materialisation.materializeDefaultHorizon();
        } catch (Exception e) {
            // Authoring must succeed even if materialisation hiccups; the next edit (or manual
            // "regenerate") re-runs it. Log loud so it isn't silently lost.
            log.warn("[ScheduleV2] Materialisation after edit failed (authoring committed): {}", e.getMessage());
        }
    }

    // ---- mappers ------------------------------------------------------------

    private CrewPatternDto toDto(CrewPattern p) {
        return CrewPatternDto.builder()
                .id(p.getId())
                .name(p.getName())
                .color(p.getColor())
                .patternLengthDays(p.getPatternLengthDays())
                .cells(readCells(p.getPatternCells()))
                .isActive(p.getIsActive())
                .build();
    }

    private CrewAssignmentDto toDto(CrewAssignment a) {
        User u = a.getUser();
        CrewPattern c = a.getCrew();
        return CrewAssignmentDto.builder()
                .id(a.getId())
                .userId(u != null ? u.getId() : null)
                .userName(u != null ? displayName(u) : null)
                .crewId(c != null ? c.getId() : null)
                .crewName(c != null ? c.getName() : null)
                .role(a.getRole())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .patternOffsetDays(a.getPatternOffsetDays())
                .isActive(a.getIsActive())
                .build();
    }

    private ScheduleEventDto toDto(ScheduleEvent e) {
        return ScheduleEventDto.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .title(e.getTitle())
                .description(e.getDescription())
                .color(e.getColor())
                .appliesToShift(e.getAppliesToShift())
                .build();
    }

    private String writeCells(List<PatternCell> cells) {
        if (cells == null || cells.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(cells);
        } catch (Exception e) {
            log.error("[ScheduleV2] Failed to serialize pattern cells: {}", e.getMessage());
            return null;
        }
    }

    private List<PatternCell> readCells(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, CELL_LIST);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Failed to parse pattern cells: {}", e.getMessage());
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
