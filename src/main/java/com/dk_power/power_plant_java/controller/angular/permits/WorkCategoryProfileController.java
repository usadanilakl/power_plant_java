package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WorkCategoryProfileDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkCategoryProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/work-category-profiles")
@RequiredArgsConstructor
public class WorkCategoryProfileController {

    private final NgWorkCategoryProfileService profileService;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<WorkCategoryProfileDto>>> getAll() {
        try {
            List<WorkCategoryProfileDto> profiles = profileService.getAllDtoList();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(profiles, "Work category profiles retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving work category profiles: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> getById(@PathVariable Long id) {
        try {
            WorkCategoryProfileDto profile = profileService.getDtoById(id);
            if (profile == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(profile, "Work category profile retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving work category profile: " + e.getMessage()));
        }
    }

    @GetMapping("/by-work-category/{categoryId}")
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> getByWorkCategory(@PathVariable Long categoryId) {
        try {
            WorkCategoryProfileDto profile = profileService.getByWorkCategoryId(categoryId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(profile, "Work category profile retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error retrieving profile: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> save(@RequestBody WorkCategoryProfileDto dto) {
        try {
            WorkCategoryProfileDto saved = profileService.saveFromDto(dto);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(saved, "Work category profile saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error saving work category profile: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> update(@PathVariable Long id, @RequestBody WorkCategoryProfileDto dto) {
        dto.setId(id);
        return save(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> delete(@PathVariable Long id) {
        try {
            profileService.softDelete(id);
            return ResponseEntity.ok()
                    .body(new NgApiResponse<>("Deleted", "Work category profile deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error deleting work category profile: " + e.getMessage()));
        }
    }
}
