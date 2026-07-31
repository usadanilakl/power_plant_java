package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSignupDto;
import com.dk_power.power_plant_java.dto.schedule.CrewAssignmentDto;
import com.dk_power.power_plant_java.dto.schedule.CrewDto;
import com.dk_power.power_plant_java.dto.schedule.CrewRotationDto;
import com.dk_power.power_plant_java.dto.schedule.SchedulePositionDto;
import com.dk_power.power_plant_java.dto.schedule.OnCallRotationDto;
import com.dk_power.power_plant_java.dto.schedule.PtoRequestDto;
import com.dk_power.power_plant_java.dto.schedule.ScheduleEventDto;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.sevice.schedule.NgCoverageService;
import com.dk_power.power_plant_java.sevice.schedule.NgScheduleV2Service;
import com.dk_power.power_plant_java.sevice.schedule.PtoEmailIntakeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin-gated CRUD for the schedule v2 authoring model — positions, crew rotations, crews, staffing
 * assignments, events — plus coverage management and a manual materialise trigger. Secured to
 * {@code ROLE_ADMIN} at {@code /ng/admin/schedule-v2/**}. Responses use {@link NgApiResponse}.
 */
@RestController
@RequestMapping("/ng/admin/schedule-v2")
@RequiredArgsConstructor
@Slf4j
public class NgScheduleV2AdminController {

    private final NgScheduleV2Service service;
    private final NgCoverageService coverageService;
    private final PtoEmailIntakeService ptoIntakeService;

    // ---- Positions ----------------------------------------------------------

    @GetMapping("/positions")
    public ResponseEntity<NgApiResponse<List<SchedulePositionDto>>> listPositions() {
        return ResponseEntity.ok(new NgApiResponse<>(service.listPositions(), "Positions"));
    }

    @PostMapping("/positions")
    public ResponseEntity<NgApiResponse<SchedulePositionDto>> createPosition(@RequestBody SchedulePositionDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.savePosition(dto), "Position saved"));
    }

    @PutMapping("/positions/{id}")
    public ResponseEntity<NgApiResponse<SchedulePositionDto>> updatePosition(@PathVariable Long id, @RequestBody SchedulePositionDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.savePosition(dto), "Position saved"));
    }

    @DeleteMapping("/positions/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deletePosition(@PathVariable Long id) {
        boolean ok = service.deletePosition(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Rotations ----------------------------------------------------------

    @GetMapping("/rotations")
    public ResponseEntity<NgApiResponse<List<CrewRotationDto>>> listRotations() {
        return ResponseEntity.ok(new NgApiResponse<>(service.listRotations(), "Rotations"));
    }

    @PostMapping("/rotations")
    public ResponseEntity<NgApiResponse<CrewRotationDto>> createRotation(@RequestBody CrewRotationDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveRotation(dto), "Rotation saved"));
    }

    @PutMapping("/rotations/{id}")
    public ResponseEntity<NgApiResponse<CrewRotationDto>> updateRotation(@PathVariable Long id, @RequestBody CrewRotationDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveRotation(dto), "Rotation saved"));
    }

    @DeleteMapping("/rotations/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteRotation(@PathVariable Long id) {
        boolean ok = service.deleteRotation(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Crews --------------------------------------------------------------

    @GetMapping("/crews")
    public ResponseEntity<NgApiResponse<List<CrewDto>>> listCrews() {
        return ResponseEntity.ok(new NgApiResponse<>(service.listCrews(), "Crews"));
    }

    @PostMapping("/crews")
    public ResponseEntity<NgApiResponse<CrewDto>> createCrew(@RequestBody CrewDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveCrew(dto), "Crew saved"));
    }

    @PutMapping("/crews/{id}")
    public ResponseEntity<NgApiResponse<CrewDto>> updateCrew(@PathVariable Long id, @RequestBody CrewDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveCrew(dto), "Crew saved"));
    }

    @DeleteMapping("/crews/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteCrew(@PathVariable Long id) {
        boolean ok = service.deleteCrew(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- Staffing (assignments) ---------------------------------------------

    @GetMapping("/assignments")
    public ResponseEntity<NgApiResponse<List<CrewAssignmentDto>>> listAssignments(@RequestParam(required = false) Long crewId) {
        return ResponseEntity.ok(new NgApiResponse<>(service.listAssignments(crewId), "Assignments"));
    }

    @PostMapping("/assignments")
    public ResponseEntity<NgApiResponse<CrewAssignmentDto>> createAssignment(@RequestBody CrewAssignmentDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveAssignment(dto), "Assignment saved"));
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<NgApiResponse<CrewAssignmentDto>> updateAssignment(@PathVariable Long id, @RequestBody CrewAssignmentDto dto) {
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
        return ResponseEntity.ok(new NgApiResponse<>(service.listEvents(from, to), "Events"));
    }

    @PostMapping("/events")
    public ResponseEntity<NgApiResponse<ScheduleEventDto>> createEvent(@RequestBody ScheduleEventDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveEvent(dto), "Event saved"));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<NgApiResponse<ScheduleEventDto>> updateEvent(@PathVariable Long id, @RequestBody ScheduleEventDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveEvent(dto), "Event saved"));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteEvent(@PathVariable Long id) {
        boolean ok = service.deleteEvent(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Deleted" : "Not found"));
    }

    // ---- On-call rotation ---------------------------------------------------

    @GetMapping("/on-call")
    public ResponseEntity<NgApiResponse<List<OnCallRotationDto>>> listOnCall() {
        return ResponseEntity.ok(new NgApiResponse<>(service.listOnCall(), "On-call rotations"));
    }

    @PostMapping("/on-call")
    public ResponseEntity<NgApiResponse<OnCallRotationDto>> createOnCall(@RequestBody OnCallRotationDto dto) {
        dto.setId(null);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveOnCall(dto), "On-call saved"));
    }

    @PutMapping("/on-call/{id}")
    public ResponseEntity<NgApiResponse<OnCallRotationDto>> updateOnCall(@PathVariable Long id, @RequestBody OnCallRotationDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(new NgApiResponse<>(service.saveOnCall(dto), "On-call saved"));
    }

    @DeleteMapping("/on-call/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> deleteOnCall(@PathVariable Long id) {
        boolean ok = service.deleteOnCall(id);
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
        return ResponseEntity.ok(new NgApiResponse<>(Map.of("rowsWritten", written), "Materialised " + written + " day rows"));
    }

    /** One-time curated seed of staffing from the current SharePoint-derived roster (see service javadoc). */
    @PostMapping("/seed-initial")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> seedInitial() {
        return ResponseEntity.ok(new NgApiResponse<>(service.seedInitial(), "Seeded staffing from current schedule"));
    }

    /** Materialised schedule for a range — powers the builder's Schedule tab. */
    @GetMapping("/preview")
    public ResponseEntity<NgApiResponse<List<ShiftDayDto>>> preview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new NgApiResponse<>(service.schedulePreview(from, to), "Schedule preview"));
    }

    // ---- Coverage -----------------------------------------------------------

    @GetMapping("/coverage")
    public ResponseEntity<NgApiResponse<List<CoverageRequestDto>>> listCoverage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new NgApiResponse<>(coverageService.listCoverage(from, to), "Coverage requests"));
    }

    @PostMapping("/coverage")
    public ResponseEntity<NgApiResponse<CoverageRequestDto>> createCoverage(@RequestBody CoverageRequestDto dto) {
        return ResponseEntity.ok(new NgApiResponse<>(coverageService.createCoverage(dto), "Coverage created"));
    }

    @DeleteMapping("/coverage/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> cancelCoverage(@PathVariable Long id) {
        boolean ok = coverageService.cancelCoverage(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Cancelled" : "Not found"));
    }

    @GetMapping("/coverage/summary")
    public ResponseEntity<NgApiResponse<List<CoverageSeatSummaryDto>>> coverageSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new NgApiResponse<>(coverageService.seatSummary(from, to), "Coverage seat summary"));
    }

    @GetMapping("/coverage/{id}/signups")
    public ResponseEntity<NgApiResponse<List<CoverageSignupDto>>> listSignups(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(coverageService.listSignups(id), "Coverage signups"));
    }

    @PostMapping("/coverage/signups/{id}/approve")
    public ResponseEntity<NgApiResponse<Boolean>> approveSignup(@PathVariable Long id) {
        boolean ok = coverageService.approveSignup(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Approved" : "Not found"));
    }

    @PostMapping("/coverage/signups/{id}/reject")
    public ResponseEntity<NgApiResponse<Boolean>> rejectSignup(@PathVariable Long id) {
        boolean ok = coverageService.rejectSignup(id);
        return ResponseEntity.ok(new NgApiResponse<>(ok, ok ? "Rejected" : "Not found"));
    }

    // ---- PTO intake (Phase 4) -----------------------------------------------

    /** PTO requests, optionally filtered by status (e.g. {@code PENDING_MANUAL_REVIEW} for the review queue). */
    @GetMapping("/pto")
    public ResponseEntity<NgApiResponse<List<PtoRequestDto>>> listPto(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(new NgApiResponse<>(ptoIntakeService.listByStatus(status), "PTO requests"));
    }

    /** Map an unresolved PTO to a user (then it can be approved). */
    @PostMapping("/pto/{id}/assign")
    public ResponseEntity<NgApiResponse<PtoRequestDto>> assignPto(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(new NgApiResponse<>(ptoIntakeService.assignUser(id, userId), "User assigned"));
    }

    /** Approve a PTO → auto-create coverage for the vacated shifts, notify, re-materialise. */
    @PostMapping("/pto/{id}/approve")
    public ResponseEntity<NgApiResponse<PtoRequestDto>> approvePto(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(ptoIntakeService.approve(id), "PTO approved"));
    }

    @PostMapping("/pto/{id}/reject")
    public ResponseEntity<NgApiResponse<PtoRequestDto>> rejectPto(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(ptoIntakeService.reject(id), "PTO rejected"));
    }

    /** Surface validation failures (invalid dates, seat full, …) as 400 with a message, not 500. */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<NgApiResponse<Object>> handleBadRequest(RuntimeException e) {
        return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
    }
}
