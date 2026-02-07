package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.categories.*;
import com.dk_power.power_plant_java.sevice.angular.CategoryValueManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/cv-manager")
@RequiredArgsConstructor
public class CategoryValueManagerController {

    private final CategoryValueManagerService managerService;

    // ==================== CATEGORY ENDPOINTS ====================

    /**
     * Get all categories with value counts.
     */
    @GetMapping("/categories")
    public ResponseEntity<NgApiResponse<List<CategoryWithCountDto>>> getAllCategories() {
        try {
            List<CategoryWithCountDto> categories = managerService.getAllCategoriesWithCounts();
            return ResponseEntity.ok(new NgApiResponse<>(categories, "Success"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error retrieving categories: " + e.getMessage(), e);
        }
    }

    /**
     * Create a new category.
     */
    @PostMapping("/categories")
    public ResponseEntity<NgApiResponse<CategoryDto>> createCategory(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String alias = request.get("alias");

            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
            }

            CategoryDto created = managerService.createCategory(name, alias);
            return ResponseEntity.ok(new NgApiResponse<>(created, "Category created successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error creating category: " + e.getMessage(), e);
        }
    }

    /**
     * Update a category.
     */
    @PutMapping("/categories/{id}")
    public ResponseEntity<NgApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String alias = request.get("alias");

            CategoryDto updated = managerService.updateCategory(id, name, alias);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "Category updated successfully"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error updating category: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a category. If it has values, transferToCategoryId must be provided.
     */
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteCategory(
            @PathVariable Long id,
            @RequestParam(required = false) Long transferToCategoryId) {
        try {
            managerService.deleteCategory(id, transferToCategoryId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Category deleted successfully"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting category: " + e.getMessage(), e);
        }
    }

    /**
     * Check if a category can be deleted.
     */
    @GetMapping("/categories/{id}/can-delete")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> canDeleteCategory(@PathVariable Long id) {
        try {
            Map<String, Object> result = managerService.canDeleteCategory(id);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Success"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error checking category: " + e.getMessage(), e);
        }
    }

    /**
     * Find duplicate categories.
     */
    @GetMapping("/categories/duplicates")
    public ResponseEntity<NgApiResponse<List<DuplicateCategoryDto>>> findDuplicateCategories() {
        try {
            List<DuplicateCategoryDto> duplicates = managerService.findDuplicateCategories();
            return ResponseEntity.ok(new NgApiResponse<>(duplicates,
                duplicates.isEmpty() ? "No duplicates found" : "Found " + duplicates.size() + " duplicate groups"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error finding duplicates: " + e.getMessage(), e);
        }
    }

    /**
     * Merge duplicate categories.
     */
    @PostMapping("/categories/merge")
    public ResponseEntity<NgApiResponse<CategoryDto>> mergeCategories(@RequestBody MergeRequestDto request) {
        try {
            if (request.getKeepId() == null || request.getDuplicateIds() == null || request.getDuplicateIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "keepId and duplicateIds are required");
            }

            CategoryDto result = managerService.mergeCategories(request.getKeepId(), request.getDuplicateIds());
            return ResponseEntity.ok(new NgApiResponse<>(result, "Categories merged successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error merging categories: " + e.getMessage(), e);
        }
    }

    // ==================== VALUE ENDPOINTS ====================

    /**
     * Get all values, optionally filtered by category.
     */
    @GetMapping("/values")
    public ResponseEntity<NgApiResponse<List<ValueDto>>> getAllValues(
            @RequestParam(required = false) Long categoryId) {
        try {
            List<ValueDto> values = managerService.getAllValues(categoryId);
            return ResponseEntity.ok(new NgApiResponse<>(values, "Success"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error retrieving values: " + e.getMessage(), e);
        }
    }

    /**
     * Create a new value in a category.
     */
    @PostMapping("/values")
    public ResponseEntity<NgApiResponse<ValueDto>> createValue(@RequestBody Map<String, Object> request) {
        try {
            Long categoryId = request.get("categoryId") != null
                ? ((Number) request.get("categoryId")).longValue()
                : null;
            String name = (String) request.get("name");
            String alias = (String) request.get("alias");

            if (categoryId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "categoryId is required");
            }
            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Value name is required");
            }

            ValueDto created = managerService.createValue(categoryId, name, alias);
            return ResponseEntity.ok(new NgApiResponse<>(created, "Value created successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error creating value: " + e.getMessage(), e);
        }
    }

    /**
     * Update a value's name and/or alias.
     */
    @PutMapping("/values/{id}")
    public ResponseEntity<NgApiResponse<ValueDto>> updateValue(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String alias = request.get("alias");

            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Value name is required");
            }

            ValueDto updated = managerService.updateValue(id, name, alias);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "Value updated successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error updating value: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a value. If it has references, transferToValueId should be provided.
     */
    @DeleteMapping("/values/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteValue(
            @PathVariable Long id,
            @RequestParam(required = false) Long transferToValueId) {
        try {
            managerService.deleteValue(id, transferToValueId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Value deleted successfully"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting value: " + e.getMessage(), e);
        }
    }

    /**
     * Get dependencies for a value.
     */
    @GetMapping("/values/{id}/dependencies")
    public ResponseEntity<NgApiResponse<ValueWithDependenciesDto>> getValueDependencies(@PathVariable Long id) {
        try {
            ValueWithDependenciesDto result = managerService.getValueDependencies(id);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Success"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error getting dependencies: " + e.getMessage(), e);
        }
    }

    /**
     * Find duplicate values, optionally filtered by category.
     */
    @GetMapping("/values/duplicates")
    public ResponseEntity<NgApiResponse<List<DuplicateValueDto>>> findDuplicateValues(
            @RequestParam(required = false) Long categoryId) {
        try {
            List<DuplicateValueDto> duplicates = managerService.findDuplicateValues(categoryId);
            return ResponseEntity.ok(new NgApiResponse<>(duplicates,
                duplicates.isEmpty() ? "No duplicates found" : "Found " + duplicates.size() + " duplicate groups"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error finding duplicates: " + e.getMessage(), e);
        }
    }

    /**
     * Merge duplicate values.
     */
    @PostMapping("/values/merge")
    public ResponseEntity<NgApiResponse<ValueDto>> mergeValues(@RequestBody MergeRequestDto request) {
        try {
            if (request.getKeepId() == null || request.getDuplicateIds() == null || request.getDuplicateIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "keepId and duplicateIds are required");
            }

            ValueDto result = managerService.mergeValues(request.getKeepId(), request.getDuplicateIds());
            return ResponseEntity.ok(new NgApiResponse<>(result, "Values merged successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error merging values: " + e.getMessage(), e);
        }
    }

    /**
     * Move a value to a different category.
     */
    @PostMapping("/values/move")
    public ResponseEntity<NgApiResponse<ValueDto>> moveValueToCategory(@RequestBody Map<String, Long> request) {
        try {
            Long valueId = request.get("valueId");
            Long targetCategoryId = request.get("targetCategoryId");

            if (valueId == null || targetCategoryId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "valueId and targetCategoryId are required");
            }

            ValueDto result = managerService.moveValueToCategory(valueId, targetCategoryId);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Value moved successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error moving value: " + e.getMessage(), e);
        }
    }
}
