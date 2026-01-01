package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RequestMapping("/ng/loto-standards")
@Component
@RestController
@RequiredArgsConstructor
public class NgLotoStandardController {
    private final NgLotoStandardService lotoStandardService;

    /**
     * Get paginated LOTO standards
     */
    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoStandardDto>>> getPaginatedLotoStandards(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoStandardDto> paginatedStandards = lotoStandardService.findAllPaginated(
                    PageRequest.of(page - 1, pageSize)
            );
            NgApiResponse<Page<LotoStandardDto>> response = new NgApiResponse<>(
                    paginatedStandards,
                    "LOTO standards retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get single LOTO standard by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> getLotoStandardById(@PathVariable String id) {
        try {
            LotoStandardDto standard = lotoStandardService.getDtoById(id);
            if (standard == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoStandardDto> response = new NgApiResponse<>(
                    standard,
                    "LOTO standard retrieved successfully",
                    LocalDateTime.now()
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Search LOTO standards with criteria
     */
    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoStandardDto>>> searchLotoStandards(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoStandardDto> searchResults = null;

            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "name";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";

                searchResults = lotoStandardService.complexSearch(
                        criteria,
                        page - 1,
                        pageSize,
                        sortColumn,
                        sortDirection,
                        true
                );
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "name";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";

                searchResults = lotoStandardService.complexSearch(
                        criteria,
                        page - 1,
                        pageSize,
                        sortColumn,
                        sortDirection,
                        true
                );
            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
                searchResults = lotoStandardService.complexSearch(
                        criteria,
                        page - 1,
                        pageSize,
                        criteria.getSortColumn(),
                        sortDirection,
                        true
                );
            }

            NgApiResponse<Page<LotoStandardDto>> response = new NgApiResponse<>(
                    searchResults,
                    "Search completed successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Create new LOTO standard
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<LotoStandardDto>> createLotoStandard(@RequestBody LotoStandardIdDto standard) {
        try {
            LotoStandardDto created = lotoStandardService.createStandard(standard);
            NgApiResponse<LotoStandardDto> response = new NgApiResponse<>(
                    created,
                    "LOTO standard created successfully",
                    LocalDateTime.now()
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Update existing LOTO standard
     */
    @PutMapping
    public ResponseEntity<NgApiResponse<LotoStandardDto>> updateLotoStandard(@RequestBody LotoStandardIdDto standard) {
        try {
            LotoStandardDto updated = lotoStandardService.updateStandard(standard);
            NgApiResponse<LotoStandardDto> response = new NgApiResponse<>(
                    updated,
                    "LOTO standard updated successfully",
                    LocalDateTime.now()
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Delete LOTO standard by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteLotoStandard(@PathVariable String id) {
        try {
            lotoStandardService.deleteById(id);
            NgApiResponse<Void> response = new NgApiResponse<>(
                    null,
                    "LOTO standard deleted successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get unique values for a column with filtering
     */
    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
            @PathVariable String column,
            @RequestBody SearchCriteria searchCriteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "false") boolean andLogicEnabled
    ) {
        try {
            Page<String> uniqueValues = lotoStandardService.getFilteredUniqueValuesOfColumn(
                    column,
                    searchCriteria,
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

    /**
     * Get grouped LOTO standards
     */
    @GetMapping("/grouped")
    public ResponseEntity<NgApiResponse<Map<String, List<LotoStandardDto>>>> getGroupedLotoStandards(
            @RequestParam String groupBy) {
        try {
            Map<String, List<LotoStandardDto>> grouped = lotoStandardService.getGroupedLotoStandards(groupBy);
            NgApiResponse<Map<String, List<LotoStandardDto>>> response = new NgApiResponse<>(
                    grouped,
                    "Successfully retrieved grouped LOTO standards"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get all LOTO standards (legacy endpoint)
     */
    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<LotoStandardDto>>> getAllLotoStandards() {
        try {
            List<LotoStandardDto> standards = lotoStandardService.getAllDtos();
            return ResponseEntity.ok(new NgApiResponse<>(standards, "LOTO standards retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error retrieving LOTO standards: " + e.getMessage()));
        }
    }

    /**
     * Add LOTO point to standard
     */
    @PostMapping("/{id}/add-loto-point/{lotoStandardId}")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> addLotoPointToStandard(
            @PathVariable Long id,
            @PathVariable String lotoStandardId) {
        try {
            LotoStandardDto saved = lotoStandardService.addLotoPointToStandard(id, lotoStandardId);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "LOTO point added to standard successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error adding LOTO point to standard: " + e.getMessage()));
        }
    }

    /**
     * Remove LOTO point from standard
     */
    @DeleteMapping("/{id}/remove-loto-point/{lotoStandardId}")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> removeLotoPointFromStandard(
            @PathVariable Long id,
            @PathVariable String lotoStandardId) {
        try {
            LotoStandardDto saved = lotoStandardService.removeLotoPointToStandard(id, lotoStandardId);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "LOTO point removed from standard successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error removing LOTO point from standard: " + e.getMessage()));
        }
    }

    /**
     * Get related files from all LOTO points in standard
     */
    @GetMapping("/{lotoStandardId}/related-files")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getRelatedFiles(@PathVariable Long lotoStandardId) {
        try {
            List<FileDto> relatedFiles = lotoStandardService.getRelatedFiles(lotoStandardId);
            return ResponseEntity.ok(new NgApiResponse<>(relatedFiles, "Related files retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error retrieving related files: " + e.getMessage()));
        }
    }

    /**
     * Reorder LOTO points in standard
     */
    @PutMapping("/{currentStandardId}/reorder-loto-points")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> reorderLotoPoints(
            @PathVariable Long currentStandardId,
            @RequestBody List<Long> lotoPoints) {
        try {
            LotoStandardDto reorderedStandard = lotoStandardService.reorderLotoPoints(currentStandardId, lotoPoints);
            return ResponseEntity.ok(new NgApiResponse<>(reorderedStandard, "LOTO points reordered successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error reordering LOTO points: " + e.getMessage()));
        }
    }
}
