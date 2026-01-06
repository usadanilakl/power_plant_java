package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.sevice.angular.RfValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Refactored Value Controller for modern Angular frontend
 * Provides RESTful API endpoints for value management
 * Base URL: /ng/rf-values
 */
@RestController
@RequestMapping("/ng/rf-values")
@RequiredArgsConstructor
public class RfValueController {
    private final RfValueService rfValueService;

    // ==================== VALUE CRUD ENDPOINTS ====================

    /**
     * Create a new value in a category
     * POST /ng/rf-values
     * Body: { categoryAlias, valueName, valueAlias }
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<ValueDto>> createValue(@RequestBody Map<String, String> request) {
        try {
            String categoryAlias = request.get("categoryAlias");
            String valueName = request.get("valueName");
            String valueAlias = request.get("valueAlias");

            if (categoryAlias == null || categoryAlias.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Category alias is required"));
            }
            if (valueName == null || valueName.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Value name is required"));
            }

            ValueDto created = rfValueService.createValue(categoryAlias, valueName, valueAlias);
            return ResponseEntity.ok(new NgApiResponse<>(created, "Value created successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error creating value: " + e.getMessage()));
        }
    }

    /**
     * Update an existing value
     * PUT /ng/rf-values/{valueId}
     * Body: { name, alias }
     */
    @PutMapping("/{valueId}")
    public ResponseEntity<NgApiResponse<ValueDto>> updateValue(
            @PathVariable Long valueId,
            @RequestBody Map<String, String> request) {
        try {
            String newName = request.get("name");
            String newAlias = request.get("alias");

            if (newName == null || newName.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Value name is required"));
            }

            ValueDto updated = rfValueService.updateValue(valueId, newName, newAlias);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "Value updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error updating value: " + e.getMessage()));
        }
    }

    /**
     * Delete a value
     * DELETE /ng/rf-values/{valueId}
     * Optional query param: transferToValueId
     */
    @DeleteMapping("/{valueId}")
    public ResponseEntity<NgApiResponse<Void>> deleteValue(
            @PathVariable Long valueId,
            @RequestParam(required = false) Long transferToValueId) {
        try {
            rfValueService.deleteValue(valueId, transferToValueId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Value deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error deleting value: " + errorMsg));
        }
    }

    /**
     * Get a specific value by ID
     * GET /ng/rf-values/{valueId}
     */
    @GetMapping("/{valueId}")
    public ResponseEntity<NgApiResponse<ValueDto>> getValueById(@PathVariable Long valueId) {
        try {
            ValueDto value = rfValueService.getValueById(valueId);
            return ResponseEntity.ok(new NgApiResponse<>(value, "Value retrieved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving value: " + e.getMessage()));
        }
    }

    /**
     * Get all values for a category
     * GET /ng/rf-values/category/{categoryAlias}
     */
    @GetMapping("/category/{categoryAlias}")
    public ResponseEntity<NgApiResponse<List<ValueDto>>> getValuesByCategory(
            @PathVariable String categoryAlias) {
        try {
            List<ValueDto> values = rfValueService.getValuesByCategory(categoryAlias);
            return ResponseEntity.ok(new NgApiResponse<>(values, "Values retrieved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving values: " + e.getMessage()));
        }
    }

    /**
     * Get all values across all categories
     * GET /ng/rf-values/all
     */
    @GetMapping("/all")
    public ResponseEntity<NgApiResponse<List<ValueDto>>> getAllValues() {
        try {
            List<ValueDto> values = rfValueService.getAllValues();
            return ResponseEntity.ok(new NgApiResponse<>(values, "All values retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving values: " + e.getMessage()));
        }
    }

    // ==================== CATEGORY ENDPOINTS ====================

    /**
     * Get all categories
     * GET /ng/rf-values/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<NgApiResponse<List<CategoryDto>>> getAllCategories() {
        try {
            List<CategoryDto> categories = rfValueService.getAllCategories();
            return ResponseEntity.ok(new NgApiResponse<>(categories, "Categories retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving categories: " + e.getMessage()));
        }
    }

    /**
     * Get values for multiple categories at once
     * POST /ng/rf-values/categories/bulk
     * Body: { categoryAliases: string[] }
     */
    @PostMapping("/categories/bulk")
    public ResponseEntity<NgApiResponse<Map<String, List<ValueDto>>>> getValuesByCategories(
            @RequestBody Map<String, List<String>> request) {
        try {
            List<String> categoryAliases = request.get("categoryAliases");
            if (categoryAliases == null || categoryAliases.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Category aliases are required"));
            }

            Map<String, List<ValueDto>> valuesByCategory = rfValueService.getValuesByCategories(categoryAliases);
            return ResponseEntity.ok(new NgApiResponse<>(valuesByCategory, "Values retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving values: " + e.getMessage()));
        }
    }

    // ==================== VALIDATION ENDPOINTS ====================

    /**
     * Check if a value can be deleted (has no dependencies)
     * GET /ng/rf-values/{valueId}/can-delete
     */
    @GetMapping("/{valueId}/can-delete")
    public ResponseEntity<NgApiResponse<Boolean>> canDeleteValue(@PathVariable Long valueId) {
        try {
            boolean canDelete = rfValueService.canDeleteValue(valueId);
            return ResponseEntity.ok(new NgApiResponse<>(canDelete, "Validation complete"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error checking value dependencies: " + e.getMessage()));
        }
    }

    /**
     * Get dependency count for a value
     * GET /ng/rf-values/{valueId}/dependencies
     */
    @GetMapping("/{valueId}/dependencies")
    public ResponseEntity<NgApiResponse<Map<String, Long>>> getValueDependencies(@PathVariable Long valueId) {
        try {
            Map<String, Long> dependencies = rfValueService.getValueDependencies(valueId);
            return ResponseEntity.ok(new NgApiResponse<>(dependencies, "Dependencies retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Error retrieving dependencies: " + e.getMessage()));
        }
    }
}
