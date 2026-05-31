package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.users.ScheduleImportRequest;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/ng/schedule")
@RequiredArgsConstructor
@Slf4j
public class NgScheduleController {

    private final ShiftDayService shiftDayService;

    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> sync(@RequestBody ScheduleImportRequest request) {
        try {
            int rows = shiftDayService.importSchedule(request);
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("rowsWritten", rows, "source", request.getSource()),
                    "Schedule imported"));
        } catch (Exception e) {
            log.error("[Schedule] Import failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/by-date")
    public ResponseEntity<NgApiResponse<ShiftDayDto>> byDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ShiftDayDto dto = shiftDayService.getByDate(date);
        return dto == null
                ? ResponseEntity.ok(new NgApiResponse<>(null, "No schedule for date"))
                : ResponseEntity.ok(new NgApiResponse<>(dto, "Schedule retrieved"));
    }

    @GetMapping("/range")
    public ResponseEntity<NgApiResponse<List<ShiftDayDto>>> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<ShiftDayDto> rows = shiftDayService.getRange(from, to);
        return ResponseEntity.ok(new NgApiResponse<>(rows, "Schedule range retrieved"));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<NgApiResponse<List<ShiftDayDto>>> year(@PathVariable int year) {
        List<ShiftDayDto> rows = shiftDayService.getYear(year);
        return ResponseEntity.ok(new NgApiResponse<>(rows, "Schedule year retrieved"));
    }

    @GetMapping("/unresolved")
    public ResponseEntity<NgApiResponse<Set<String>>> unresolved(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Set<String> names = shiftDayService.unresolvedNames(from, to);
        return ResponseEntity.ok(new NgApiResponse<>(names, "Unresolved names"));
    }
}
