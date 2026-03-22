package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/work-area-shapes")
@RequiredArgsConstructor
public class WorkAreaMapShapeController {

    private final NgWorkAreaService workAreaService;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<WorkAreaMapShapeDto>>> getAll() {
        try {
            List<WorkAreaMapShapeDto> shapes = workAreaService.getAllShapes();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(shapes, "Map shapes retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving map shapes: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<WorkAreaMapShapeDto>>> getAllRest() {
        return getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<WorkAreaMapShapeDto>> getById(@PathVariable Long id) {
        try {
            WorkAreaMapShapeDto shape = workAreaService.getAllShapes().stream()
                    .filter(item -> id.equals(item.getId()))
                    .findFirst()
                    .orElse(null);
            if (shape == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(shape, "Map shape retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving map shape: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<WorkAreaMapShapeDto>> save(@RequestBody WorkAreaMapShapeDto dto) {
        try {
            WorkAreaMapShapeDto saved = workAreaService.saveShape(dto);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(saved, "Map shape saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error saving map shape: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<WorkAreaMapShapeDto>> update(@PathVariable Long id, @RequestBody WorkAreaMapShapeDto dto) {
        dto.setId(id);
        return save(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> delete(@PathVariable Long id) {
        try {
            workAreaService.deleteShape(id);
            return ResponseEntity.ok()
                    .body(new NgApiResponse<>("Deleted", "Map shape deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error deleting map shape: " + e.getMessage()));
        }
    }
}
