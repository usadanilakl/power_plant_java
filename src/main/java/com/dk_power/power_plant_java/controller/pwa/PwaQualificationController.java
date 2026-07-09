package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDefinitionDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationPersonDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationSeedResult;
import com.dk_power.power_plant_java.sevice.pwa.PwaQualificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaQualificationController {

    private final PwaQualificationService qualificationService;

    @GetMapping("/qualifications/person/{userId}")
    public ResponseEntity<NgApiResponse<PwaQualificationPersonDto>> getPublicPersonQualifications(
            @PathVariable String userId) {
        try {
            PwaQualificationPersonDto person = qualificationService.getPersonQualifications(userId);
            if (person == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(new NgApiResponse<>(person, "Qualifications retrieved"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Public lookup failed for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Qualification lookup failed: " + e.getMessage()));
        }
    }

    @GetMapping("/secured/qualifications/people")
    public ResponseEntity<NgApiResponse<List<PwaQualificationPersonDto>>> getPeople() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.getPlantQualificationPeople(),
                    "Qualification people retrieved"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] People lookup failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(List.of(), "People lookup failed: " + e.getMessage()));
        }
    }

    @GetMapping("/secured/qualifications")
    public ResponseEntity<NgApiResponse<List<PwaQualificationDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.getAllQualifications(),
                    "Qualifications retrieved"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] List failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(List.of(), "List failed: " + e.getMessage()));
        }
    }

    @GetMapping("/secured/qualifications/definitions")
    public ResponseEntity<NgApiResponse<List<PwaQualificationDefinitionDto>>> getDefinitions() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.getQualificationDefinitions(),
                    "Qualification catalog retrieved"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Catalog list failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(List.of(), "Catalog failed: " + e.getMessage()));
        }
    }

    @PostMapping("/secured/qualifications")
    public ResponseEntity<NgApiResponse<PwaQualificationDto>> create(@RequestBody PwaQualificationDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.create(dto),
                    "Qualification created"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Create failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Create failed: " + e.getMessage()));
        }
    }

    @PutMapping("/secured/qualifications/{sharepointId}")
    public ResponseEntity<NgApiResponse<PwaQualificationDto>> update(
            @PathVariable String sharepointId,
            @RequestBody PwaQualificationDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.update(sharepointId, dto),
                    "Qualification updated"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Update failed for sharepointId={}: {}", sharepointId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/secured/qualifications/{sharepointId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> delete(@PathVariable String sharepointId) {
        try {
            qualificationService.delete(sharepointId);
            return ResponseEntity.ok(new NgApiResponse<>(Map.of("deleted", true), "Qualification deleted"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Delete failed for sharepointId={}: {}", sharepointId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(Map.of("deleted", false), "Delete failed: " + e.getMessage()));
        }
    }

    @PostMapping("/secured/qualifications/definitions")
    public ResponseEntity<NgApiResponse<PwaQualificationDefinitionDto>> createDefinition(
            @RequestBody PwaQualificationDefinitionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.createDefinition(dto),
                    "Qualification catalog item created"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Catalog create failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Catalog create failed: " + e.getMessage()));
        }
    }

    @PutMapping("/secured/qualifications/definitions/{sharepointId}")
    public ResponseEntity<NgApiResponse<PwaQualificationDefinitionDto>> updateDefinition(
            @PathVariable String sharepointId,
            @RequestBody PwaQualificationDefinitionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    qualificationService.updateDefinition(sharepointId, dto),
                    "Qualification catalog item updated"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Catalog update failed for sharepointId={}: {}", sharepointId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Catalog update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/secured/qualifications/definitions/{sharepointId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> deleteDefinition(@PathVariable String sharepointId) {
        try {
            qualificationService.deleteDefinition(sharepointId);
            return ResponseEntity.ok(new NgApiResponse<>(Map.of("deleted", true), "Qualification catalog item deleted"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Catalog delete failed for sharepointId={}: {}", sharepointId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(Map.of("deleted", false), "Catalog delete failed: " + e.getMessage()));
        }
    }

    @PostMapping("/secured/qualifications/provision-list")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> provisionList() {
        Map<String, Object> result = qualificationService.provisionQualificationLists();
        return ResponseEntity.ok(new NgApiResponse<>(result, "Qualification lists provisioned"));
    }

    @PostMapping("/secured/qualifications/seed-plant-users")
    public ResponseEntity<NgApiResponse<PwaQualificationSeedResult>> seedPlantUsers() {
        try {
            PwaQualificationSeedResult result = qualificationService.seedPlantUsers();
            return ResponseEntity.ok(new NgApiResponse<>(result, "Plant users seeded into SharePoint"));
        } catch (Exception e) {
            log.error("[PWA Qualifications] Seed failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Seed failed: " + e.getMessage()));
        }
    }
}
