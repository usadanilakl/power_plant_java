package com.dk_power.power_plant_java.controller.angular.diagrams;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.diagrams.DiagramConnectionDto;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/diagram-connections")
@RequiredArgsConstructor
public class NgDiagramConnectionController {

    private final NgDiagramConnectionService service;

    @GetMapping("/by-diagram/{diagramId}")
    public ResponseEntity<NgApiResponse<List<DiagramConnectionDto>>> getByDiagram(@PathVariable Long diagramId) {
        try {
            List<DiagramConnectionDto> items = service.getByDiagramId(diagramId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Connections retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/bulk-save/{diagramId}")
    public ResponseEntity<NgApiResponse<List<DiagramConnectionDto>>> bulkSave(
            @PathVariable Long diagramId,
            @RequestBody List<DiagramConnectionDto> dtos) {
        try {
            List<DiagramConnectionDto> saved = service.bulkSave(diagramId, dtos);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(saved, "Connections saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<DiagramConnectionDto>> update(
            @PathVariable Long id,
            @RequestBody DiagramConnectionDto dto) {
        try {
            DiagramConnectionDto updated = service.updateConnection(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Connection updated successfully", LocalDateTime.now()));
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
                .body(new NgApiResponse<>(null, "Connection deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
