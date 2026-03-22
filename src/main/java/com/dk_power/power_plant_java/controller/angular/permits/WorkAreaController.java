package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/work-areas")
@RequiredArgsConstructor
public class WorkAreaController {

    private final NgWorkAreaService workAreaService;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<WorkAreaDto>>> getAll() {
        try {
            List<WorkAreaDto> areas = workAreaService.getAllDtoList();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(areas, "Work areas retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving work areas: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<WorkAreaDto>>> getAllRest() {
        return getAll();
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<WorkAreaDto>> getById(@PathVariable Long id) {
        try {
            WorkAreaDto area = workAreaService.getDtoByIdTyped(id);
            if (area == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(area, "Work area retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving work area: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<WorkAreaDto>> getByIdRest(@PathVariable Long id) {
        return getById(id);
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<WorkAreaDto>> save(@RequestBody WorkAreaDto dto) {
        try {
            WorkAreaDto saved = workAreaService.saveFromDto(dto);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(saved, "Work area saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error saving work area: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<WorkAreaDto>> update(@PathVariable Long id, @RequestBody WorkAreaDto dto) {
        dto.setId(id);
        return save(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> delete(@PathVariable Long id) {
        try {
            workAreaService.softDelete(id);
            return ResponseEntity.ok()
                    .body(new NgApiResponse<>("Deleted", "Work area deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error deleting work area: " + e.getMessage()));
        }
    }

    @GetMapping("/by-area-type/{typeId}")
    public ResponseEntity<NgApiResponse<List<WorkAreaDto>>> getByAreaType(@PathVariable Long typeId) {
        try {
            List<WorkAreaDto> areas = workAreaService.getByAreaType(typeId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(areas, "Work areas retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving work areas: " + e.getMessage()));
        }
    }

    @GetMapping("/with-permit-counts")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getWithPermitCounts() {
        try {
            List<Map<String, Object>> result = workAreaService.getAllWithPermitCounts();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Work areas with counts retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/permit-counts/{id}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getPermitCounts(@PathVariable Long id) {
        try {
            Map<String, Object> counts = workAreaService.getActivePermitCounts(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(counts, "Permit counts retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-map-image")
    public ResponseEntity<NgApiResponse<String>> uploadMapImage(@RequestPart("file") MultipartFile file) {
        try {
            String fileLink = workAreaService.uploadMapImage(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(fileLink, "Map image uploaded successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error uploading map image: " + e.getMessage()));
        }
    }

    @GetMapping("/map-image")
    public ResponseEntity<NgApiResponse<String>> getMapImage() {
        String path = workAreaService.getMapImagePath();
        if (path == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(path, "Map image path retrieved", LocalDateTime.now()));
    }
}
