package com.dk_power.power_plant_java.controller.angular.diagrams;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/diagrams")
@RequiredArgsConstructor
public class NgDiagramController {

    private final NgDiagramService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<DiagramDto>>> getAll() {
        try {
            List<DiagramDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Diagrams retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<DiagramDto>> getById(@PathVariable String id) {
        try {
            DiagramDto dto = service.getDiagramById(id);
            if (dto == null) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "Diagram not found", LocalDateTime.now()));
            }
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Diagram retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/by-context-file/{fileId}")
    public ResponseEntity<NgApiResponse<List<DiagramDto>>> getByContextFile(@PathVariable Long fileId) {
        try {
            List<DiagramDto> items = service.getByContextFileId(fileId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Context diagrams retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<DiagramDto>> create(@RequestBody DiagramDto dto) {
        try {
            DiagramDto created = service.createDiagram(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Diagram created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/seed/feedwater-control-test")
    public ResponseEntity<NgApiResponse<DiagramDto>> seedFeedwaterControlTest() {
        try {
            DiagramDto seeded = service.seedFeedwaterControlScenario();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(seeded, "Feedwater control test diagram seeded successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/seed/seal-oil-system")
    public ResponseEntity<NgApiResponse<DiagramDto>> seedSealOilSystem() {
        try {
            DiagramDto seeded = service.seedSealOilScenario();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(seeded, "Seal oil system diagram seeded successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<DiagramDto>> update(@PathVariable String id, @RequestBody DiagramDto dto) {
        try {
            DiagramDto updated = service.updateDiagram(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Diagram updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/migrate/{id}")
    public ResponseEntity<NgApiResponse<Boolean>> migrate(@PathVariable Long id) {
        try {
            boolean migrated = service.migrateDiagramToEntities(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(migrated, migrated ? "Diagram migrated" : "Nothing to migrate", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/migrate-all")
    public ResponseEntity<NgApiResponse<Integer>> migrateAll() {
        try {
            int count = service.migrateAllDiagrams();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(count, count + " diagrams migrated", LocalDateTime.now()));
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
                .body(new NgApiResponse<>(null, "Diagram deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
