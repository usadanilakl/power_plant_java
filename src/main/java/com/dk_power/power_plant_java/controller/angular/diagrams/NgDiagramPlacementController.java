package com.dk_power.power_plant_java.controller.angular.diagrams;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.diagrams.DiagramPlacementDto;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramPlacementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/diagram-placements")
@RequiredArgsConstructor
public class NgDiagramPlacementController {

    private final NgDiagramPlacementService service;

    @GetMapping("/by-diagram/{diagramId}")
    public ResponseEntity<NgApiResponse<List<DiagramPlacementDto>>> getByDiagram(@PathVariable Long diagramId) {
        try {
            List<DiagramPlacementDto> items = service.getByDiagramId(diagramId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Placements retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/bulk-save/{diagramId}")
    public ResponseEntity<NgApiResponse<List<DiagramPlacementDto>>> bulkSave(
            @PathVariable Long diagramId,
            @RequestBody List<DiagramPlacementDto> dtos) {
        try {
            List<DiagramPlacementDto> saved = service.bulkSave(diagramId, dtos);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(saved, "Placements saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<DiagramPlacementDto>> update(
            @PathVariable Long id,
            @RequestBody DiagramPlacementDto dto) {
        try {
            DiagramPlacementDto updated = service.updatePlacement(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Placement updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable String id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Placement deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
