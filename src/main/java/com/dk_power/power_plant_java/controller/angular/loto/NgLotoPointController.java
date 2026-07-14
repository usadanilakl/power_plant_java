package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.*;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgZeroEnergyService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/ng/loto-points")
@RequiredArgsConstructor
// off-LAN: LOTO editor/standards need loto-points. Class-level (not Plant-restricted) because /ng/loto-points
// is also used on-LAN by equipment-editor / tag-number / 3d-model / file-editor — a Plant-role rule would break those.
@com.dk_power.power_plant_java.config.security.RestrictedAllowed
public class NgLotoPointController {
    private final NgLotoPointService ngLotoPointService;
    private final NgZeroEnergyService ngZeroEnergyService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
            Page<LotoPointDto> paginatedFiles = ngLotoPointService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList(
                            "id", "tagNumber", "unit", "description", "specificLocation", "isoPos.name",
                            "isoPos.id", "normPos.name", "normPos.id", "eqType.name", "eqType.id",
                            "location.name", "location.id", "zeroEnergy.id", "zeroEnergy.method",
                            "equipmentIds", "characteristicsJson",
                            "processingStatus.id", "processingStatus.name", "processingStatus.alias",
                            // drives the bulk-edit "apply to counterparts?" prompt - without it
                            // every cold-loaded row looks counterpart-less
                            "counterpartId",
                            "isLabeled", "isLockable"
                    )),
                    PageRequest.of(page - 1, pageSize)
            ).map(ngLotoPointService::toDto);
            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(paginatedFiles, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoPointDto>> getFileById(@PathVariable Long id) {
        try {
            LotoPointDto lotoPointDto = ngLotoPointService.findDtoById(id).orElse(null);
            if (lotoPointDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(lotoPointDto, "File retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Set or clear the 3D model file on one or more LOTO points.
     * Lightweight — only touches the modelFile FK, no equipment/ZE processing.
     * Body: { "lotoPointIds": [1,2,3], "modelFileId": 42 }  (0 = clear)
     */
    @PutMapping("/set-model-file")
    public ResponseEntity<NgApiResponse<String>> setModelFile(@RequestBody Map<String, Object> body) {
        try {
            List<Number> ids = ((List<?>) body.get("lotoPointIds"))
                    .stream().map(o -> (Number) o).toList();
            Number mfId = (Number) body.get("modelFileId");
            ngLotoPointService.setModelFileOnPoints(
                    ids.stream().map(Number::longValue).toList(),
                    mfId != null ? mfId.longValue() : 0L
            );
            return ResponseEntity.ok(new NgApiResponse<>(
                    "Updated " + ids.size() + " LOTO points", "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** LOTO points linked to a given 3D model file (FileObject ID). */
    @GetMapping("/by-model-file/{fileId}")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> getByModelFile(@PathVariable Long fileId) {
        try {
            List<LotoPointDto> dtos = ngLotoPointService.findByModelFileId(fileId);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoPointDto> searchResults = null;

            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                // Use client-provided sort if available, otherwise default to tagNumber/asc
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";


                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                // Use client-provided sort if available, otherwise default to tagNumber/asc
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";

                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
                // Handle explicit sorting case
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
                searchResults = ngLotoPointService.complexSearch(
                        criteria,
                        page - 1,
                        pageSize,
                        criteria.getSortColumn(),
                        sortDirection,
                        true
                );
            }

            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

//    @PostMapping("/search")
//    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchFiles(
//            @RequestBody SearchCriteria criteria,
//            @RequestParam(defaultValue = "1") int page,
//            @RequestParam(defaultValue = "50") int pageSize) {
//        try {
//            Page<LotoPointDto> searchResults = null;
//
//            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
//                // Use client-provided sort if available, otherwise default to tagNumber/asc
//                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//
//
//                searchResults = ngLotoPointService.fuzziSearch(criteria, page, pageSize, sortColumn, sortDirection, true);
//            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
//                // Use client-provided sort if available, otherwise default to tagNumber/asc
//                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//
//                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
//            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
//                // Handle explicit sorting case
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//                searchResults = ngLotoPointService.complexSearch(
//                        criteria,
//                        page - 1,
//                        pageSize,
//                        criteria.getSortColumn(),
//                        sortDirection,
//                        true
//                );
//            }
//
//            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
//            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//        }
//    }

    @PostMapping("/search-by-base-tag-number")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchByBaseTagNumber(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            if (!SearchCriteria.SearchType.GLOBAL.equals(criteria.getType())) {
                throw new IllegalArgumentException("Invalid search type. Only global search is supported for base tag number.");
            }
            if (criteria.getQuery() == null || criteria.getQuery().isEmpty()) {
                throw new IllegalArgumentException("Base tag number is required for global search.");
            }
            String baseTagNumber = NgEquipmentService.getTagNumberBase(criteria.getQuery());
            if (baseTagNumber == null || baseTagNumber.isEmpty()) {
                baseTagNumber = criteria.getQuery();
            }
            Page<LotoPointDto> searchResults = ngLotoPointService.complexSearch(baseTagNumber, page - 1, pageSize);

            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/related-images")
    public ResponseEntity<NgApiResponse<List<String>>> getRelatedImages(@PathVariable Long id) {
        try {
            List<String> relatedImages = ngLotoPointService.getRelatedImages(id);
            NgApiResponse<List<String>> response = new NgApiResponse<>(relatedImages, "Related images retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/related-files")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getRelatedFiles(@PathVariable Long id) {
        try {
            List<FileDto> relatedImages = ngLotoPointService.getRelatedFiles(id);
            NgApiResponse<List<FileDto>> response = new NgApiResponse<>(relatedImages, "Related file retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping(value = "/tagging", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NgApiResponse<LotoPointDto>> updateLotoPoint(@RequestBody Map<String, Object> tagData) {
        try {
            // Validate input
            Long id = Long.valueOf(tagData.get("id").toString());
            if (id == null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "LotoPoint ID is required"));
            }

            // Find the existing LotoPoint
            LotoPointDto existingLotoPoint = ngLotoPointService.findDtoById(id)
                    .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + id));

            // Update only the specified fields
            if (tagData.containsKey("tagNumber")) {
                existingLotoPoint.setTagNumber((String) tagData.get("tagNumber"));
            }
            if (tagData.containsKey("description")) {
                existingLotoPoint.setDescription((String) tagData.get("description"));
            }
            if (tagData.containsKey("specificLocation")) {
                existingLotoPoint.setSpecificLocation((String) tagData.get("specificLocation"));
            }

            // Save the updated LotoPoint
            LotoPointDto updatedLotoPoint = ngLotoPointService.toDto(ngLotoPointService.save(existingLotoPoint));

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(updatedLotoPoint, "LotoPoint updated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<LotoPointDto>> updateLotoPoint(@RequestBody LotoPointIdDto lotoPoint) {
        try {
//            if (lotoPoint.getId() == null || lotoPoint.getId() == 0) {
//                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "LotoPoint ID is required"));
//            }

//            LotoPoint lp = ngLotoPointService.convertIdDtoToEntity(lotoPoint);

            // processLotoPoint already handles saving the LotoPoint and all equipment relationships
            LotoPoint lp = ngLotoPointService.processLotoPoint(lotoPoint);

            LotoPointDto updatedLotoPoint = ngLotoPointService.toDto(lp);

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(updatedLotoPoint, "LotoPoint updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<LotoPointDto>> createLotoPoint(@RequestBody LotoPointIdDto lotoPoint) {
        try {
            // processLotoPoint already handles saving the LotoPoint and all equipment relationships
            LotoPoint lp = ngLotoPointService.processLotoPoint(lotoPoint);
            LotoPointDto createdLotoPoint = ngLotoPointService.toDto(lp);

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(createdLotoPoint, "LotoPoint created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/tag-number/{system}")
    public ResponseEntity<NgApiResponse<String>> createNewTagNumber(@PathVariable String system) {
        try {
            String newTagNumber = ngLotoPointService.generateTagNumber(system);
            NgApiResponse<String> response = new NgApiResponse<>(newTagNumber, "New tag number generated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/unique-values/{column}")
    public ResponseEntity<NgApiResponse<List<String>>> getUniqueValuesOfColumn(@PathVariable String column) {
        try {
            List<String> uniqueValues = ngLotoPointService.getUniqueValuesOfColumn(column);
            NgApiResponse<List<String>> response = new NgApiResponse<>(uniqueValues, "Unique values retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

//@PostMapping("/unique-values/{column}/filtered")
//public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
//        @PathVariable String column,
//        @RequestBody Map<String, String> filters,
//        @RequestParam(defaultValue = "1") int page,
//        @RequestParam(defaultValue = "50") int pageSize,
//        @RequestParam(defaultValue = "true") boolean andLogicEnabled
//) {
//    try {
//        Page<String> uniqueValues = ngLotoPointService.getFilteredUniqueValuesOfColumn(
//                column,
//                filters,
//                page,
//                pageSize,
//                andLogicEnabled
//        );
//
//        NgApiResponse<Page<String>> response = new NgApiResponse<>(
//                uniqueValues,
//                "Filtered unique values retrieved successfully"
//        );
//        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//    } catch (IllegalArgumentException e) {
//        return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//    } catch (Exception e) {
//        e.printStackTrace();
//        return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//    }
//}

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
            @PathVariable String column,
            @RequestBody SearchCriteria searchCriterica,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "false") boolean andLogicEnabled
    ) {
        try {
            Page<String> uniqueValues = ngLotoPointService.getFilteredUniqueValuesOfColumn2(
                    column,
                    searchCriterica,
                    page,
                    pageSize,
                    andLogicEnabled
            );

            NgApiResponse<Page<String>> response = new NgApiResponse<>(
                    uniqueValues,
                    "Filtered unique values retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/grouped")
    public ResponseEntity<NgApiResponse<Map<String, List<LotoPointDto>>>> getGroupedLotoPoints(
            @RequestParam String groupBy) {
        try {
            Map<String, List<LotoPointDto>> grouped = ngLotoPointService.getGroupedLotoPoints(groupBy);
            NgApiResponse<Map<String, List<LotoPointDto>>> response = new NgApiResponse<>(
                    grouped,
                    "Successfully retrieved grouped LOTO points"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<NgApiResponse<List<LotoPointSummaryDto>>> getLotoPointSummaries() {
        try {
            List<LotoPointSummaryDto> summaries = ngLotoPointService.getAllSummaries();
            NgApiResponse<List<LotoPointSummaryDto>> response = new NgApiResponse<>(
                    summaries,
                    "Successfully retrieved LOTO point summaries"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Returns how many LotoPoints reference the given ZeroEnergy record.
     */
    @GetMapping("/zero-energy/{id}/usage-count")
    public ResponseEntity<NgApiResponse<Long>> getZeroEnergyUsageCount(@PathVariable Long id) {
        try {
            long count = ngZeroEnergyService.getUsageCount(id);
            return ResponseEntity.ok(new NgApiResponse<>(count, "Usage count retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Migration endpoint to populate the method field for all existing ZeroEnergy records.
     * This should be called once after deploying the change to persist the method field.
     */
    @PostMapping("/migrate-zero-energy-methods")
    public ResponseEntity<NgApiResponse<Integer>> migrateZeroEnergyMethods() {
        try {
            int updatedCount = ngZeroEnergyService.migrateMethodFields();
            NgApiResponse<Integer> response = new NgApiResponse<>(
                    updatedCount,
                    "Successfully migrated " + updatedCount + " ZeroEnergy records"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * One-time migration: un-share ZeroEnergy so each LOTO point owns its own row. Run once on the
     * hub after deploying the per-point change; changes propagate to desktops via sync. Idempotent.
     */
    @PostMapping("/unshare-zero-energy")
    public ResponseEntity<NgApiResponse<Integer>> unshareZeroEnergy() {
        try {
            int forked = ngZeroEnergyService.unshareAllZeroEnergy();
            NgApiResponse<Integer> response = new NgApiResponse<>(
                    forked,
                    "Un-shared ZeroEnergy: created " + forked + " per-point copies"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Read-only ZeroEnergy health summary for the admin diagnostic view. */
    @GetMapping("/zero-energy/health")
    public ResponseEntity<NgApiResponse<java.util.Map<String, Object>>> zeroEnergyHealth() {
        try {
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(ngZeroEnergyService.getZeroEnergyHealth(), "OK"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Delete ZeroEnergy rows no longer referenced by any LOTO point. */
    @PostMapping("/zero-energy/cleanup-orphans")
    public ResponseEntity<NgApiResponse<Integer>> cleanupZeroEnergyOrphans() {
        try {
            int deleted = ngZeroEnergyService.cleanupOrphans();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(deleted, "Deleted " + deleted + " orphaned ZeroEnergy row(s)"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get the unit counterpart for a LOTO point.
     * For tag numbers starting with 01 or 02, finds or generates the counterpart.
     * Response includes:
     * - counterpart: LotoPointDto (existing or pre-populated suggestion)
     * - isNew: boolean indicating if the counterpart needs to be created
     * - sourceUnit: the source unit prefix (01 or 02)
     * - targetUnit: the target unit prefix (02 or 01)
     */
    @GetMapping("/{id}/counterpart")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getUnitCounterpart(@PathVariable Long id) {
        try {
            Map<String, Object> counterpartData = ngLotoPointService.findUnitCounterpart(id);

            if (counterpartData == null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                        .body(new NgApiResponse<>(null, "LOTO point is not unit-specific (tag must start with 01 or 02)"));
            }

            NgApiResponse<Map<String, Object>> response = new NgApiResponse<>(
                    counterpartData,
                    "Unit counterpart retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get unit counterpart by tag number (for new LOTO points being created).
     * Used when creating a new LOTO point to check if a counterpart exists.
     */
    @GetMapping("/counterpart-by-tag")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getCounterpartByTagNumber(
            @RequestParam String tagNumber) {
        try {
            Map<String, Object> counterpartData = ngLotoPointService.findCounterpartByTagNumber(tagNumber);

            if (counterpartData == null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                        .body(new NgApiResponse<>(null, "Tag number is not unit-specific (must start with 01 or 02)"));
            }

            NgApiResponse<Map<String, Object>> response = new NgApiResponse<>(
                    counterpartData,
                    "Unit counterpart retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get counterpart by ID directly (when counterpartId is already known).
     */
    @GetMapping("/counterpart/{counterpartId}")
    public ResponseEntity<NgApiResponse<LotoPointDto>> getCounterpartById(@PathVariable Long counterpartId) {
        try {
            LotoPointDto counterpart = ngLotoPointService.getCounterpartById(counterpartId);

            if (counterpart == null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                        .body(new NgApiResponse<>(null, "Counterpart not found"));
            }

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(
                    counterpart,
                    "Counterpart retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Link two LOTO points as counterparts (bidirectional).
     * Sets counterpartId on both points.
     */
    @PostMapping("/link-counterparts")
    public ResponseEntity<NgApiResponse<String>> linkCounterparts(
            @RequestParam Long point1Id,
            @RequestParam Long point2Id) {
        try {
            ngLotoPointService.linkCounterparts(point1Id, point2Id);
            NgApiResponse<String> response = new NgApiResponse<>(
                    "success",
                    "LOTO points linked successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Unlink counterpart relationship (bidirectional).
     * Removes counterpartId from both points.
     */
    @PostMapping("/{id}/unlink-counterpart")
    public ResponseEntity<NgApiResponse<String>> unlinkCounterpart(@PathVariable Long id) {
        try {
            ngLotoPointService.unlinkCounterparts(id);
            NgApiResponse<String> response = new NgApiResponse<>(
                    "success",
                    "Counterpart relationship removed successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Delete a LOTO point safely.
     * - Deletes all associated equipment (and handles their file relationships)
     * - Handles counterpart relationship (delete or unlink based on deleteCounterpart param)
     * - Soft deletes the LOTO point
     *
     * @param id The LOTO point ID to delete
     * @param deleteCounterpart If true, also deletes the counterpart LOTO point (default: false)
     * @return The deleted LOTO point DTO
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoPointDto>> deleteLotoPoint(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deleteCounterpart) {
        try {
            LotoPointDto deletedLotoPoint = ngLotoPointService.deleteLotoPointSafely(id, deleteCounterpart);
            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(
                    deletedLotoPoint,
                    "LOTO point deleted successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Look up counterpart equipment for ZeroEnergy transfer.
     *
     * Transfer logic for zeroEnergy templateEquipment:
     * For each source equipment ID:
     * 1. Find the equipment entity
     * 2. Get the first LOTO point from that equipment
     * 3. Find the LOTO point's counterpart for the other unit
     * 4. Get the first equipment from that counterpart's equipment list
     * 5. Return full EquipmentDto
     *
     * @param requestBody Contains sourceEquipmentIds (list of equipment IDs) and sourceUnit ("01" or "02")
     * @return List of counterpart EquipmentDto objects
     */
    @PostMapping("/lookup-counterpart-equipment")
    public ResponseEntity<NgApiResponse<List<EquipmentDto>>> lookupCounterpartEquipment(
            @RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            List<?> sourceIdsRaw = (List<?>) requestBody.get("sourceEquipmentIds");
            String sourceUnit = (String) requestBody.get("sourceUnit");

            if (sourceUnit == null || (!sourceUnit.equals("01") && !sourceUnit.equals("02"))) {
                return ResponseEntity.badRequest().body(
                        new NgApiResponse<>(null, "sourceUnit must be '01' or '02'"));
            }

            // Convert Number list to Long list (handles both Integer and Long from JSON)
            List<Long> sourceEquipmentIds = sourceIdsRaw != null
                    ? sourceIdsRaw.stream()
                        .filter(id -> id instanceof Number)
                        .map(id -> ((Number) id).longValue())
                        .toList()
                    : new ArrayList<>();

            List<EquipmentDto> counterpartEquipment = ngZeroEnergyService.lookupCounterpartEquipment(
                    sourceEquipmentIds, sourceUnit);

            NgApiResponse<List<EquipmentDto>> response = new NgApiResponse<>(
                    counterpartEquipment,
                    "Counterpart equipment retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Look up counterpart LOTO points for ZeroEnergy transfer.
     *
     * Transfer logic:
     * For each source LOTO point ID:
     * 1. Find the LOTO point entity
     * 2. Find the LOTO point's counterpart for the other unit
     * 3. Return full LotoPointDto
     *
     * @param requestBody Contains sourceLotoPointIds (list of LOTO point IDs) and sourceUnit ("01" or "02")
     * @return List of counterpart LotoPointDto objects
     */
    @PostMapping("/lookup-counterpart-loto-points")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> lookupCounterpartLotoPoints(
            @RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            List<?> sourceIdsRaw = (List<?>) requestBody.get("sourceLotoPointIds");
            String sourceUnit = (String) requestBody.get("sourceUnit");

            if (sourceUnit == null || (!sourceUnit.equals("01") && !sourceUnit.equals("02"))) {
                return ResponseEntity.badRequest().body(
                        new NgApiResponse<>(null, "sourceUnit must be '01' or '02'"));
            }

            // Convert Number list to Long list (handles both Integer and Long from JSON)
            List<Long> sourceLotoPointIds = sourceIdsRaw != null
                    ? sourceIdsRaw.stream()
                        .filter(id -> id instanceof Number)
                        .map(id -> ((Number) id).longValue())
                        .toList()
                    : new ArrayList<>();

            List<LotoPointDto> counterpartLotoPoints = ngLotoPointService.lookupCounterpartLotoPoints(
                    sourceLotoPointIds, sourceUnit);

            NgApiResponse<List<LotoPointDto>> response = new NgApiResponse<>(
                    counterpartLotoPoints,
                    "Counterpart LOTO points retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/bulk-search")
    public ResponseEntity<NgApiResponse<BulkSearchResultDto>> bulkSearch(
            @RequestBody Map<String, String> request) {
        try {
            String searchText = request.get("text");
            if (searchText == null || searchText.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Search text is required"));
            }
            BulkSearchResultDto result = ngLotoPointService.bulkSearchByText(searchText);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Bulk search completed"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
