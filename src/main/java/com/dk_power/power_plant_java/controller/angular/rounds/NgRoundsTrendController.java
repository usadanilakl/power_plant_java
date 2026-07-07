package com.dk_power.power_plant_java.controller.angular.rounds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.rounds.TrendQueryDto;
import com.dk_power.power_plant_java.dto.rounds.TrendSeriesDto;
import com.dk_power.power_plant_java.dto.rounds.TrendSeriesMetaDto;
import com.dk_power.power_plant_java.sevice.angular.rounds.NgRoundsService;
import com.dk_power.power_plant_java.sevice.angular.rounds.RoundsReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Serves the WebView AMS trend tool. Lives under {@code /ng/rounds/} so it is
 * covered by the existing localhost-permitAll matcher (the desktop renderer
 * reaches it through the Electron main process on the same machine).
 */
@RestController
@RequestMapping("/ng/rounds/trend")
@RequiredArgsConstructor
public class NgRoundsTrendController {

    private final RoundsReadingService roundsReadingService;
    private final NgRoundsService ngRoundsService;

    /** Available numeric questions (with stored readings), grouped-ready for the picker. */
    @GetMapping("/series")
    public ResponseEntity<NgApiResponse<List<TrendSeriesMetaDto>>> series() {
        try {
            List<TrendSeriesMetaDto> series = roundsReadingService.listSeries();
            return ok(series, "Available trend series");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Chart-ready series for the requested keys over an optional time window. */
    @PostMapping("/data")
    public ResponseEntity<NgApiResponse<List<TrendSeriesDto>>> data(@RequestBody TrendQueryDto query) {
        try {
            if (query.getKeys() == null || query.getKeys().isEmpty()) {
                return ok(List.of(), "No keys requested");
            }
            LocalDateTime from = parse(query.getFrom(), LocalDateTime.now().minusYears(2));
            LocalDateTime to = parse(query.getTo(), LocalDateTime.now().plusDays(1));
            List<TrendSeriesDto> series = roundsReadingService.getTrend(query.getKeys(), from, to);
            return ok(series, "Trend data");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Rebuild the reading projection from all stored snapshots (backfill / after sync). */
    @PostMapping("/rebuild")
    public ResponseEntity<NgApiResponse<Integer>> rebuild() {
        try {
            int n = ngRoundsService.rebuildTrendReadings();
            return ok(n, "Rebuilt " + n + " trend readings");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private static LocalDateTime parse(String iso, LocalDateTime fallback) {
        if (iso == null || iso.isBlank()) return fallback;
        try {
            return LocalDateTime.parse(iso.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private static <T> ResponseEntity<NgApiResponse<T>> ok(T body, String msg) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(body, msg));
    }
}
