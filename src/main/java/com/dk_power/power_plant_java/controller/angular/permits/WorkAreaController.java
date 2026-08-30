package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.PermitMapAssignDto;
import com.dk_power.power_plant_java.dto.permits.PermitMapDto;
import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgPermitMapService;
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
    private final NgPermitMapService permitMapService;

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

    /**
     * Everything the permits map view draws: the areas, and every open request / permit / LOTO
     * placed onto the areas it touches. One call rather than one per layer, so the layers cannot
     * disagree with each other while they land and the client never has to re-run the placement
     * rules itself.
     */
    @GetMapping("/permit-map")
    public ResponseEntity<NgApiResponse<PermitMapDto>> getPermitMap() {
        try {
            PermitMapDto result = permitMapService.build();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Permit map retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error building permit map: " + e.getMessage()));
        }
    }

    /**
     * Point selected records at a work area, from the map's "Not on the map" list.
     *
     * <p>Writes the {@code workArea} FK, so an item placed here is drawn from a recorded decision
     * afterwards rather than from a text guess. All-or-nothing: a stale reference rejects the whole
     * request rather than half-applying it.
     */
    @PostMapping("/permit-map/assign")
    public ResponseEntity<NgApiResponse<PermitMapAssignDto.Result>> assignPermitMapItems(
            @RequestBody PermitMapAssignDto.Request request) {
        try {
            PermitMapAssignDto.Result result = permitMapService.assign(request);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result,
                            "Placed " + result.getAssigned() + " item(s) in " + result.getWorkAreaName(),
                            LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error placing items: " + e.getMessage()));
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
