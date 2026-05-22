package com.dk_power.power_plant_java.controller.angular.rounds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.rounds.RoundsReportDto;
import com.dk_power.power_plant_java.sevice.angular.rounds.NgRoundsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Receives and serves scraped WebView AMS "Rounds" report snapshots.
 * POST is used by the desktop scraper (localhost-only — see SecurityConfigSpring).
 */
@RestController
@RequestMapping("/ng/rounds")
@RequiredArgsConstructor
public class NgRoundsController {

    private final NgRoundsService ngRoundsService;

    /** Receives a scraped Rounds report snapshot from the desktop scraper. */
    @PostMapping("/report")
    public ResponseEntity<NgApiResponse<RoundsReportDto>> saveReport(@RequestBody RoundsReportDto dto) {
        try {
            RoundsReportDto saved = ngRoundsService.saveSnapshot(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(saved, "Rounds report saved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Most recent stored Rounds report, including the full table. */
    @GetMapping("/latest")
    public ResponseEntity<NgApiResponse<RoundsReportDto>> getLatest() {
        try {
            RoundsReportDto latest = ngRoundsService.getLatest();
            String message = latest != null ? "Latest rounds report" : "No rounds reports stored";
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(latest, message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** A specific stored report by id, including the full table. */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<RoundsReportDto>> getById(@PathVariable Long id) {
        try {
            RoundsReportDto dto = ngRoundsService.getById(id);
            String message = dto != null ? "Rounds report" : "Report not found";
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(dto, message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Recent stored reports as lightweight metadata (no table payload). */
    @GetMapping("/list")
    public ResponseEntity<NgApiResponse<List<RoundsReportDto>>> getList() {
        try {
            List<RoundsReportDto> recent = ngRoundsService.getRecent();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(recent, "Recent rounds reports"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
