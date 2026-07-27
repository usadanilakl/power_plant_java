package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * PWA-facing read-only schedule endpoints. Gated to plant-group roles via {@code @PreAuthorize}
 * — contractors deliberately do not see the plant schedule. Range queries are capped server-side
 * to prevent runaway pulls when the PWA is offline-caching aggressively.
 *
 * See {@code project/features/users/communication/pwa-step-5-wiring.md}.
 */
@RestController
@RequestMapping("/api/pwa/secured/schedule")
@RequiredArgsConstructor
@Slf4j
public class PwaScheduleController {

    /** Server-enforced maximum range width for {@link #range}. Prevents accidental year-long pulls. */
    private static final int MAX_RANGE_DAYS = 60;

    private final ShiftDayService shiftDayService;

    @GetMapping("/today")
public ResponseEntity<ShiftDayDto> today() {
        ShiftDayDto dto = shiftDayService.getByDate(LocalDate.now());
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @GetMapping("/range")
public ResponseEntity<?> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from)) {
            return ResponseEntity.badRequest().body(Map.of("error", "'to' must be on or after 'from'"));
        }
        long span = ChronoUnit.DAYS.between(from, to) + 1;
        if (span > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Range exceeds " + MAX_RANGE_DAYS + " days (requested " + span + ")"));
        }
        return ResponseEntity.ok(shiftDayService.getRange(from, to));
    }

    /**
     * Compact "who is on shift right now" list — Day/Night entries only, no PTO/training/OCM.
     * Cheaper than pulling the full {@link ShiftDayDto} client-side just to filter.
     */
    @GetMapping("/on-shift-now")
public ResponseEntity<List<ShiftEntry>> onShiftNow() {
        ShiftDayDto today = shiftDayService.getByDate(LocalDate.now());
        if (today == null) return ResponseEntity.ok(List.of());
        // 5am–5pm is Day; else Night. Matches Electron's PersonnelManager convention.
        int hour = java.time.LocalTime.now().getHour();
        boolean isDay = hour >= 5 && hour < 17;
        List<ShiftEntry> pool = isDay ? today.getDayShift() : today.getNightShift();
        return ResponseEntity.ok(pool == null ? List.of() : pool);
    }
}
