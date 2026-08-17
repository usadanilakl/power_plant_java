package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.ValueReferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/values")
@RequiredArgsConstructor
@RestrictedAllowed
public class NgValueController {
    private final NgValueService ngValueService;
    private final ValueReferenceService valueReferenceService;

    @GetMapping("/of-category/{alias}")
    public ResponseEntity<NgApiResponse<List<ValueDto>>> getNgValues(@PathVariable String alias) {
        try {
            List<ValueDto> list = ngValueService.getValuesByCategoryAlias(alias)
                    .stream()
                    .map(ngValueService::valueToDto)
                    .toList();

            if (list.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(list, "No values found for the given category", LocalDateTime.now()));
            }

            return ResponseEntity.ok(new NgApiResponse<>(list, "Success", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category alias: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching values: " + e.getMessage(), e);
        }
    }

    @PostMapping("/{category}/{value}")
    public ResponseEntity<NgApiResponse<ValueDto>> createValue(@PathVariable String category, @PathVariable String valueString) {
        Value value = ngValueService.createValue(category, valueString);
        return ResponseEntity.ok(new NgApiResponse<>(ngValueService.valueToDto(value), "Value created successfully", LocalDateTime.now()));
    }

    @PostMapping("/{category}")
    public CategoryDto createCategory(@PathVariable String category) {
        Category category1 = ngValueService.createCategory(category);
        return ngValueService.categoryToDto(category1);
    }

    @DeleteMapping("/{id}/{new-id}")
    public ResponseEntity<NgApiResponse<String>> deleteValue(@PathVariable Long id, @PathVariable Long newId) {
        ngValueService.moveItemsToNewValue(id, newId);
        ngValueService.deleteValue(id);
        return ResponseEntity.ok(new NgApiResponse<>(null, "Value deleted successfully", LocalDateTime.now()));
    }

    @PostMapping("/add-to-category-by-id/{categoryId}")
    public ResponseEntity<NgApiResponse<ValueDto>> addValueToCategoryById(@PathVariable Long categoryId, @RequestBody String value) {
        try {
            Value createdValue = ngValueService.createValue(categoryId, value);
            ValueDto valueDto = ngValueService.valueToDto(createdValue);
            return ResponseEntity.ok(new NgApiResponse<>(valueDto, "Value added successfully to category", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category ID or value: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while adding value to category: " + e.getMessage(), e);
        }
    }

    @PostMapping("/add-to-category-by-name")
    public ResponseEntity<NgApiResponse<ValueDto>> addValueToCategoryByName(@RequestBody Map<String, String> request) {
        try {
            Value createdValue = ngValueService.addValueToCategoryByAlias(request.get("category"), request.get("value"), request.get("valueAlias"));
            ValueDto valueDto = ngValueService.valueToDto(createdValue);
            return ResponseEntity.ok(new NgApiResponse<>(valueDto, "Value added successfully to category", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category name or value: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while adding value to category: " + e.getMessage(), e);
        }
    }

    @GetMapping("/all-values")
    public ResponseEntity<NgApiResponse<List<ValueDto>>> getAllValues() {
        try {
            List<ValueDto> allValues = ngValueService.getAllValues()
                    .stream()
                    .map(ngValueService::valueToDto)
                    .toList();

            if (allValues.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(allValues, "No values found", LocalDateTime.now()));
            }

            return ResponseEntity.ok(new NgApiResponse<>(allValues, "All values retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching all values: " + e.getMessage(), e);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<NgApiResponse<List<CategoryDto>>> getAllCategories() {
        try {
            List<CategoryDto> allCategories = ngValueService.getAllCategories()
                    .stream()
                    .map(ngValueService::categoryToDto)
                    .toList();

            if (allCategories.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(allCategories, "No categories found", LocalDateTime.now()));
            }

            return ResponseEntity.ok(new NgApiResponse<>(allCategories, "All categories retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching all categories: " + e.getMessage(), e);
        }
    }

    @PutMapping("/{valueId}")
    public ResponseEntity<NgApiResponse<ValueDto>> updateValue(@PathVariable Long valueId, @RequestBody Map<String, String> request) {
        try {
            String newName = request.get("name");
            String newAlias = request.get("alias");
            if (newName == null || newName.trim().isEmpty()) {
                throw new IllegalArgumentException("New name cannot be empty");
            }

            Value updatedValue = ngValueService.updateValueName(valueId, newName, newAlias);
            ValueDto valueDto = ngValueService.valueToDto(updatedValue);

            return ResponseEntity.ok(new NgApiResponse<>(valueDto, "Value updated successfully", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid value ID or name: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while updating the value: " + e.getMessage(), e);
        }
    }

    /**
     * Everything that references this Value, resolved to human labels and grouped by entity type.
     * Backs the admin Value dialog so an operator can see exactly what is in the way before
     * repointing or deleting.
     */
    @GetMapping("/{id}/references")
    public ResponseEntity<NgApiResponse<ValueReferenceService.ValueReferenceReport>> getValueReferences(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    valueReferenceService.findReferences(id), "Value references retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to load value references: " + e.getMessage(), e);
        }
    }

    /**
     * Reference count for every value, as {@code {valueId: count}} — one call backing the whole
     * list. Values with no references are omitted, so the client treats "missing" as 0.
     */
    @GetMapping("/reference-counts")
    public ResponseEntity<NgApiResponse<Map<Long, Integer>>> getValueReferenceCounts() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    valueReferenceService.referenceCounts(), "Reference counts retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to load reference counts: " + e.getMessage(), e);
        }
    }

    /** Move every reference from this Value onto another, leaving this one unreferenced. */
    @PostMapping("/{id}/repoint/{targetId}")
    public ResponseEntity<NgApiResponse<Integer>> repointValue(@PathVariable Long id, @PathVariable Long targetId) {
        try {
            int moved = valueReferenceService.repoint(id, targetId);
            return ResponseEntity.ok(new NgApiResponse<>(moved, "Repointed " + moved + " reference(s)", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to repoint value: " + e.getMessage(), e);
        }
    }

    /**
     * Soft-delete a Value that nothing references. Rejects with 409 while references remain — the
     * UI greys the button out, but the gate is enforced here so the endpoint is safe on its own.
     */
    @DeleteMapping("/{id}/safe")
    public ResponseEntity<NgApiResponse<String>> deleteValueIfUnreferenced(@PathVariable Long id) {
        try {
            valueReferenceService.deleteIfUnreferenced(id);
            return ResponseEntity.ok(new NgApiResponse<>("Deleted", "Value deleted", LocalDateTime.now()));
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to delete value: " + e.getMessage(), e);
        }
    }

    @PostMapping("/delete-and-transfer")
    public ResponseEntity<NgApiResponse<String>> deleteValueAndTransfer(@RequestBody Map<String, Long> request) {
        try {
            Long valueIdToDelete = request.get("valueIdToDelete");
            Long transferToValueId = request.get("transferToValueId");

            if (valueIdToDelete == null || transferToValueId == null) {
                throw new IllegalArgumentException("Both valueIdToDelete and transferToValueId must be provided");
            }

            ngValueService.moveItemsToNewValue(valueIdToDelete, transferToValueId);
            ngValueService.deleteValue(valueIdToDelete);

            return ResponseEntity.ok(new NgApiResponse<>(null, "Value deleted and items transferred successfully", LocalDateTime.now()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while deleting value and transferring items: " + e.getMessage(), e);
        }
    }
}


