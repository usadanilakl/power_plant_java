package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.schedule.CrewAssignmentDto;
import com.dk_power.power_plant_java.dto.schedule.CrewPatternDto;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventDto;
import com.dk_power.power_plant_java.sevice.schedule.NgScheduleV2Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin-gated CRUD for the schedule v2 authoring model (crew patterns, assignments, events) plus a
 * manual materialise trigger. Secured to {@code ROLE_ADMIN} in {@code SecurityConfigSpring} at
 * {@code /ng/admin/schedule-v2/**}. All responses use the standard {@link NgApiResponse} wrapper.
 *
 * <p>Every mutating endpoint re-materialises the default horizon inside the service — a no-op while
 * {@code schedule.v2.enabled=false}, so this UI is safe to use for staging before cutover.
 */
@RestController
@RequestMapping("/ng/admin/schedule-v2")
@RequiredArgsConstructor
@Slf4j
public class NgScheduleV2AdminController {

    private final NgScheduleV2Service service;

    // ---- Crew patterns ------------------------------------------------------

    @GetMapping("/patterns")
    public ResponseEntity<NgApiResponse<List<CrewPatternDto>>> listPatterns() {
        return ResponseEntity.ok(new NgApiResponse<>(service.listPatterns(), "Crew patterns"));
    }

    @GetMapping("/patterns/{id}")
    public ResponseEntity<NgApiResponse<CrewPatternDto>> getPattern(@PathVariable Long id) {
        CrewPatternDto dto = service.getPattern(id);
        return dto == null
                ? ResponseEntity.ok(new NgApiResponse<>(null, "Not found"))
                : ResponseEntity.ok(new NgApiResponse<>(dto, "Crew pattern"));
    }

    @PostMapping("/patterns")
    public ResponseEntity<NgApiResponse<CrewPatternDto>> createPattern(@RequestBody CrewPatternDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.savePattern(dto), "Crew pattern saved"));
    }

    @PutMapping("/patterns/{id}")
    public ResponseEntity<NgApiResponse<CrewPatternDto>> updatePattern(
            @PathVariable Long id, @RequestBody CrewPatternDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.savePattern(dto), "Crew pattern saved"));
    }

    @DeleteMapping("/patterns/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deletePattern(@PathVariable Long id) {
        boolean ok = service.deletePattern(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Crew assignments ---------------------------------------------------

    @GetMapping("/assignments")
    public ResponseEntity<NgApiResponse<List<CrewAssignmentDto>>> listAssignments(
            @RequestParam(required = false) Long crewId) {
        return ResponseEntity.ok(new NgApiResponse<>(service.listAssignments(crewId), "Crew assignments"));
    }

    @PostMapping("/assignments")
    public ResponseEntity<NgApiResponse<CrewAssignmentDto>> createAssignment(@RequestBody CrewAssignmentDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveAssignment(dto), "Assignment saved"));
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<NgApiResponse<CrewAssignmentDto>> updateAssignment(
            @PathVariable Long id, @RequestBody CrewAssignmentDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveAssignment(dto), "Assignment saved"));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteAssignment(@PathVariable Long id) {
        boolean ok = service.deleteAssignment(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Events -------------------------------------------------------------

    @GetMapping("/events")
    public ResponseEntity<NgApiResponse<List<ScheduleEventDto>>> listEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new NgApiResponse<>(service.listEvents(from, to), "Schedule events"));
    }

    @PostMapping("/events")
    public ResponseEntity<NgApiResponse<ScheduleEventDto>> createEvent(@RequestBody ScheduleEventDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveEvent(dto), "Event saved"));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<NgApiResponse<ScheduleEventDto>> updateEvent(
            @PathVariable Long id, @RequestBody ScheduleEventDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveEvent(dto), "Event saved"));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteEvent(@PathVariable Long id) {
        boolean ok = service.deleteEvent(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Misc ---------------------------------------------------------------

    @GetMapping("/assignable-users")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> assignableUsers() {
        return ResponseEntity.ok(new NgApiResponse<>(service.assignableUsers(), "Assignable users"));
    }

    @GetMapping("/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(new NgApiResponse<>(service.status(), "Schedule v2 status"));
    }

    @PostMapping("/materialize")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> materialize(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        int written = service.materializeNow(from, to);
        return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("rowsWritten", written), "Materialised " + written + " day rows"));
    }
}
