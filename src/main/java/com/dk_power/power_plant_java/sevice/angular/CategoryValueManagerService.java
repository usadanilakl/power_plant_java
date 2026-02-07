package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.categories.*;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CategoryValueManagerService {

    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final NgValueService ngValueService;
    private final NgEquipmentService equipmentService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;
    private final ServiceFacade serviceFacade;
    private final EntityTableRegistry entityTableRegistry;

    @PersistenceContext
    private EntityManager entityManager;

    // ==================== CATEGORY OPERATIONS ====================

    /**
     * Get all categories with their value counts.
     */
    public List<CategoryWithCountDto> getAllCategoriesWithCounts() {
        return categoryRepo.findAll().stream()
            .map(cat -> new CategoryWithCountDto(
                cat.getId(),
                cat.getName(),
                cat.getAlias(),
                cat.getValues() != null ? cat.getValues().size() : 0
            ))
            .sorted(Comparator.comparing(CategoryWithCountDto::getName, String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());
    }

    /**
     * Create a new category. Delegates to NgValueService.createCategory() which
     * already checks for duplicates.
     */
    public CategoryDto createCategory(String name, String alias) {
        if (alias == null || alias.isBlank()) {
            alias = Util.toCamelCase(name);
        }

        // Check if category already exists
        List<Category> existingByAlias = categoryRepo.findByAlias(alias);
        if (!existingByAlias.isEmpty()) {
            throw new RuntimeException("Category with alias '" + alias + "' already exists");
        }

        List<Category> existingByName = categoryRepo.findByNameIgnoreCase(name);
        if (!existingByName.isEmpty()) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }

        Category category = new Category(name);
        category.setAlias(alias);
        Category saved = categoryRepo.save(category);
        return ngValueService.categoryToDto(saved);
    }

    /**
     * Update category name and/or alias.
     */
    public CategoryDto updateCategory(Long id, String newName, String newAlias) {
        Category category = categoryRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Check for conflicts with other categories
        if (newName != null && !newName.equals(category.getName())) {
            List<Category> conflicts = categoryRepo.findByNameIgnoreCase(newName);
            conflicts.removeIf(c -> c.getId().equals(id));
            if (!conflicts.isEmpty()) {
                throw new RuntimeException("Another category with name '" + newName + "' already exists");
            }
            category.setName(newName);
        }

        if (newAlias != null && !newAlias.equals(category.getAlias())) {
            List<Category> conflictByAlias = categoryRepo.findByAlias(newAlias);
            conflictByAlias.removeIf(c -> c.getId().equals(id));
            if (!conflictByAlias.isEmpty()) {
                throw new RuntimeException("Another category with alias '" + newAlias + "' already exists");
            }
            category.setAlias(newAlias);
        }

        Category saved = categoryRepo.save(category);
        return ngValueService.categoryToDto(saved);
    }

    /**
     * Check if a category can be deleted (has no values).
     */
    public Map<String, Object> canDeleteCategory(Long categoryId) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        int valueCount = category.getValues() != null ? category.getValues().size() : 0;
        return Map.of(
            "canDelete", valueCount == 0,
            "valueCount", valueCount,
            "requiresTransfer", valueCount > 0
        );
    }

    /**
     * Delete a category. If it has values, they must be transferred first.
     */
    public void deleteCategory(Long categoryId, Long transferToCategoryId) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        int valueCount = category.getValues() != null ? category.getValues().size() : 0;

        if (valueCount > 0) {
            if (transferToCategoryId == null) {
                throw new RuntimeException("Category has " + valueCount + " values - must specify transfer target");
            }
            if (transferToCategoryId.equals(categoryId)) {
                throw new RuntimeException("Cannot transfer values to the same category");
            }
            transferAllValues(categoryId, transferToCategoryId);
        }

        category.setDeleted(true);
        categoryRepo.save(category);
        log.info("Deleted category: {} (ID={})", category.getName(), categoryId);
    }

    /**
     * Find duplicate categories (same name, case-insensitive).
     */
    @SuppressWarnings("unchecked")
    public List<DuplicateCategoryDto> findDuplicateCategories() {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT LOWER(name) as lname, COUNT(*) as cnt FROM category " +
            "WHERE deleted = false GROUP BY LOWER(name) HAVING COUNT(*) > 1")
            .getResultList();

        List<DuplicateCategoryDto> result = new ArrayList<>();
        for (Object[] row : duplicates) {
            String name = (String) row[0];
            List<Category> cats = categoryRepo.findByNameIgnoreCase(name);
            List<CategoryDto> catDtos = cats.stream()
                .map(ngValueService::categoryToDto)
                .collect(Collectors.toList());
            result.add(new DuplicateCategoryDto(name, catDtos));
        }
        return result;
    }

    /**
     * Merge duplicate categories into one. The keepId category is preserved,
     * all values from duplicate categories are transferred to it, and duplicates
     * are soft-deleted.
     */
    public CategoryDto mergeCategories(Long keepId, List<Long> duplicateIds) {
        Category keepCategory = categoryRepo.findById(keepId)
            .orElseThrow(() -> new RuntimeException("Keep category not found with id: " + keepId));

        for (Long dupId : duplicateIds) {
            if (dupId.equals(keepId)) continue;

            Category duplicate = categoryRepo.findById(dupId).orElse(null);
            if (duplicate == null || duplicate.getDeleted()) continue;

            // Transfer all values from duplicate to keepCategory
            if (duplicate.getValues() != null) {
                for (Value value : new ArrayList<>(duplicate.getValues())) {
                    value.setCategory(keepCategory);
                    valueRepo.save(value);
                }
            }

            // Soft-delete the duplicate
            duplicate.setDeleted(true);
            categoryRepo.save(duplicate);
            log.info("Merged category '{}' (ID={}) into '{}' (ID={})",
                duplicate.getName(), dupId, keepCategory.getName(), keepId);
        }

        return ngValueService.categoryToDto(keepCategory);
    }

    // ==================== VALUE OPERATIONS ====================

    /**
     * Get all values, optionally filtered by category.
     */
    public List<ValueDto> getAllValues(Long categoryId) {
        List<Value> values;
        if (categoryId != null) {
            Category category = categoryRepo.findById(categoryId).orElse(null);
            if (category == null) {
                return List.of();
            }
            values = new ArrayList<>(category.getValues());
        } else {
            values = valueRepo.findAll();
        }

        return values.stream()
            .map(ngValueService::valueToDto)
            .sorted(Comparator.comparing(ValueDto::getName, String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());
    }

    /**
     * Create a new value in a category.
     */
    public ValueDto createValue(Long categoryId, String name, String alias) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        // Check for duplicate within category
        Value existing = category.getValueByName(name);
        if (existing != null) {
            throw new RuntimeException("Value '" + name + "' already exists in category '" + category.getName() + "'");
        }

        Value value = new Value(name, alias);
        value.setCategory(category);
        Value saved = valueRepo.save(value);
        return ngValueService.valueToDto(saved);
    }

    /**
     * Update a value's name and/or alias.
     * Delegates to NgValueService.updateValueName() which handles file relocation
     * for Vendor/FileType categories.
     */
    public ValueDto updateValue(Long id, String newName, String newAlias) {
        Value updated;
        if (newAlias != null && !newAlias.isBlank()) {
            updated = ngValueService.updateValueName(id, newName, newAlias);
        } else {
            updated = ngValueService.updateValueName(id, newName);
        }
        return ngValueService.valueToDto(updated);
    }

    /**
     * Get value dependencies (count of Equipment, Files, LotoPoints referencing it).
     */
    public ValueWithDependenciesDto getValueDependencies(Long valueId) {
        Value value = valueRepo.findById(valueId)
            .orElseThrow(() -> new RuntimeException("Value not found with id: " + valueId));

        List<Equipment> equipment = equipmentService.findByValue(value);
        List<FileObject> files = fileService.findByValue(value);
        List<LotoPoint> lotoPoints = lotoPointService.findByValue(value);

        List<String> equipmentSamples = equipment.stream()
            .map(Equipment::getTagNumber)
            .filter(Objects::nonNull)
            .limit(5)
            .collect(Collectors.toList());

        List<String> fileSamples = files.stream()
            .map(FileObject::getName)
            .filter(Objects::nonNull)
            .limit(5)
            .collect(Collectors.toList());

        return new ValueWithDependenciesDto(
            ngValueService.valueToDto(value),
            equipment.size(),
            files.size(),
            lotoPoints.size(),
            equipmentSamples,
            fileSamples
        );
    }

    /**
     * Delete a value. If it has references, they must be transferred first.
     * Delegates to NgValueService methods which handle downstream entity transfer.
     */
    public void deleteValue(Long valueId, Long transferToValueId) {
        Value value = valueRepo.findById(valueId)
            .orElseThrow(() -> new RuntimeException("Value not found with id: " + valueId));

        // If transfer target specified, move all items first
        if (transferToValueId != null) {
            if (transferToValueId.equals(valueId)) {
                throw new RuntimeException("Cannot transfer references to the same value");
            }
            ngValueService.moveItemsToNewValue(valueId, transferToValueId);
        }

        // Now delete the value
        ngValueService.deleteValue(valueId);
        log.info("Deleted value: {} (ID={})", value.getName(), valueId);
    }

    /**
     * Find duplicate values (same name within same category, case-insensitive).
     */
    @SuppressWarnings("unchecked")
    public List<DuplicateValueDto> findDuplicateValues(Long categoryId) {
        String sql = "SELECT LOWER(name) as lname, category_id, COUNT(*) as cnt FROM val_table " +
            "WHERE deleted = false AND category_id IS NOT NULL ";

        if (categoryId != null) {
            sql += "AND category_id = " + categoryId + " ";
        }

        sql += "GROUP BY LOWER(name), category_id HAVING COUNT(*) > 1";

        List<Object[]> duplicates = entityManager.createNativeQuery(sql).getResultList();

        List<DuplicateValueDto> result = new ArrayList<>();
        for (Object[] row : duplicates) {
            String name = (String) row[0];
            Long catId = ((Number) row[1]).longValue();
            Category category = categoryRepo.findById(catId).orElse(null);

            List<Value> values = valueRepo.findByNameIgnoreCaseAndCategoryId(name, catId);
            List<ValueDto> valueDtos = values.stream()
                .map(ngValueService::valueToDto)
                .collect(Collectors.toList());

            result.add(new DuplicateValueDto(
                name,
                category != null ? category.getName() : "Unknown",
                catId,
                valueDtos
            ));
        }
        return result;
    }

    /**
     * Merge duplicate values into one. The keepId value is preserved,
     * all references from duplicate values are transferred to it, and duplicates
     * are soft-deleted.
     */
    public ValueDto mergeValues(Long keepId, List<Long> duplicateIds) {
        Value keepValue = valueRepo.findById(keepId)
            .orElseThrow(() -> new RuntimeException("Keep value not found with id: " + keepId));

        for (Long dupId : duplicateIds) {
            if (dupId.equals(keepId)) continue;

            Value duplicate = valueRepo.findById(dupId).orElse(null);
            if (duplicate == null || duplicate.getDeleted()) continue;

            // Transfer all references using existing refactorValues pattern
            refactorAllReferences(duplicate, keepValue);

            // Soft-delete the duplicate
            duplicate.setDeleted(true);
            valueRepo.save(duplicate);
            log.info("Merged value '{}' (ID={}) into '{}' (ID={})",
                duplicate.getName(), dupId, keepValue.getName(), keepId);
        }

        return ngValueService.valueToDto(keepValue);
    }

    /**
     * Move a value to a different category.
     */
    public ValueDto moveValueToCategory(Long valueId, Long targetCategoryId) {
        Value moved = ngValueService.moveValueToCategory(valueId, targetCategoryId);
        return ngValueService.valueToDto(moved);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Transfer all values from one category to another.
     */
    private void transferAllValues(Long fromCategoryId, Long toCategoryId) {
        Category from = categoryRepo.findById(fromCategoryId)
            .orElseThrow(() -> new RuntimeException("Source category not found"));
        Category to = categoryRepo.findById(toCategoryId)
            .orElseThrow(() -> new RuntimeException("Target category not found"));

        if (from.getValues() != null) {
            for (Value value : new ArrayList<>(from.getValues())) {
                value.setCategory(to);
                valueRepo.save(value);
            }
            log.info("Transferred {} values from category '{}' to '{}'",
                from.getValues().size(), from.getName(), to.getName());
        }
    }

    /**
     * Re-point all references from duplicate Value to canonical Value
     * across all registered entity types. Uses the same pattern as
     * CategoryValueMergeService.
     */
    private void refactorAllReferences(Value duplicate, Value canonical) {
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            if ("Category".equals(entityType) || "Value".equals(entityType)) continue;

            try {
                SyncableService<?> service = serviceFacade.getService(entityType);
                if (service == null) continue;

                List<?> affected = service.refactorValues(duplicate, canonical);
                if (!affected.isEmpty()) {
                    log.debug("Re-pointed {} {} entities from Value #{} to #{}",
                        affected.size(), entityType, duplicate.getId(), canonical.getId());
                }
            } catch (Exception e) {
                log.warn("Error re-pointing {} references: {}", entityType, e.getMessage());
            }
        }
    }
}
