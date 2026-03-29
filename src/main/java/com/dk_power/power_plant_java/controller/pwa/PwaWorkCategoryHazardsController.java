package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WorkCategoryProfileDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkCategoryProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pwa/work-category-hazards")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaWorkCategoryHazardsController {

    private final NgWorkCategoryProfileService profileService;

    @GetMapping("/all")
    public ResponseEntity<NgApiResponse<List<WorkCategoryProfileDto>>> getAll() {
        try {
            List<WorkCategoryProfileDto> profiles = profileService.getAllDtoList();
            return ResponseEntity.ok(new NgApiResponse<>(profiles, "Work category hazard profiles retrieved"));
        } catch (Exception e) {
            log.error("[PWA] Failed to get work category hazard profiles: {}", e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No profiles found"));
        }
    }

    @GetMapping("/by-category-id/{categoryId}")
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> getByCategoryId(@PathVariable Long categoryId) {
        try {
            WorkCategoryProfileDto profile = profileService.getByWorkCategoryId(categoryId);
            return ResponseEntity.ok(new NgApiResponse<>(profile, "Profile retrieved"));
        } catch (Exception e) {
            log.error("[PWA] Failed to get profile for category {}: {}", categoryId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Profile not found"));
        }
    }

    @GetMapping("/by-category-name/{name}")
    public ResponseEntity<NgApiResponse<WorkCategoryProfileDto>> getByCategoryName(@PathVariable String name) {
        try {
            WorkCategoryProfileDto profile = profileService.getByWorkCategoryName(name);
            return ResponseEntity.ok(new NgApiResponse<>(profile, "Profile retrieved"));
        } catch (Exception e) {
            log.error("[PWA] Failed to get profile for category '{}': {}", name, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Profile not found"));
        }
    }
}
