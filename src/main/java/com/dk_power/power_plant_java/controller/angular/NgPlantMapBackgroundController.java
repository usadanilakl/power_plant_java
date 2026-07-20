package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.sevice.physical.NgPlantMapBackgroundService;
import com.dk_power.power_plant_java.sevice.physical.NgPlantMapBackgroundService.BackgroundResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * The 2D plant map's reference/underlay image — persisted as a synced file (see {@link NgPlantMapBackgroundService}).
 * Keyed by the diagram id; a GET lazily pulls the bytes onto this device if a peer uploaded them.
 */
@RestController
@RequestMapping("/ng/plant-map")
@RequiredArgsConstructor
@Slf4j
public class NgPlantMapBackgroundController {

    private final NgPlantMapBackgroundService service;

    @PostMapping("/{diagramId}/background")
    public ResponseEntity<NgApiResponse<BackgroundResult>> upload(
            @PathVariable long diagramId, @RequestPart("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.upload(diagramId, file), "Background saved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[PlantMapBg] upload failed for diagram {}", diagramId, e);
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Returns the background's URL + dimensions, or 204 when the diagram has none. */
    @GetMapping("/{diagramId}/background")
    public ResponseEntity<NgApiResponse<BackgroundResult>> get(@PathVariable long diagramId) {
        try {
            BackgroundResult r = service.get(diagramId);
            return r == null ? ResponseEntity.noContent().build()
                             : ResponseEntity.ok(new NgApiResponse<>(r, "Background found"));
        } catch (Exception e) {
            log.error("[PlantMapBg] get failed for diagram {}", diagramId, e);
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{diagramId}/background")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable long diagramId) {
        service.delete(diagramId);
        return ResponseEntity.ok(new NgApiResponse<>(null, "Background removed"));
    }
}
