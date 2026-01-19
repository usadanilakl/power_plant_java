package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.entities.files.FileObject;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Refactored Value Service for modern Angular frontend integration
 * Provides enhanced CRUD operations with better error handling and validation
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RfValueService {
    private final ValueRepo valueRepo;
    private final CategoryRepo categoryRepo;
    private final NgValueService ngValueService; // Reuse for backward compatibility
    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final FileRepo fileRepo;
    @Lazy
    private final NgFileService ngFileService;

    // ==================== VALUE CRUD OPERATIONS ====================

    /**
     * Create a new value in a category. If category doesn't exist, it will be created.
     */
    public ValueDto createValue(String categoryAlias, String valueName, String valueAlias) {
        Category category = getCategoryByAliasOrName(categoryAlias);
        if (category == null) {
            category = createCategory(categoryAlias);
        }

        // Check if value already exists in category
        Optional<Value> existing = category.getValues().stream()
                .filter(v -> v.getName().equalsIgnoreCase(valueName))
                .findFirst();

        if (existing.isPresent()) {
            throw new IllegalArgumentException("Value '" + valueName + "' already exists in category '" + category.getName() + "'");
        }

        Value value = new Value();
        value.setName(valueName);
        value.setAlias(valueAlias != null && !valueAlias.isEmpty() ? valueAlias : generateAlias(valueName));
        value.setCategory(category);

        Value saved = valueRepo.save(value);
        return valueToDto(saved);
    }

    /**
     * Update an existing value
     */
    public ValueDto updateValue(Long valueId, String newName, String newAlias) {
        Value value = valueRepo.findById(valueId)
                .orElseThrow(() -> new IllegalArgumentException("Value not found: " + valueId));

        String oldName = value.getName();
        boolean nameChanged = !oldName.equals(newName);

        // Check if new name conflicts with existing value in same category
        if (nameChanged) {
            boolean nameExists = value.getCategory().getValues().stream()
                    .anyMatch(v -> !v.getId().equals(valueId) && v.getName().equalsIgnoreCase(newName));

            if (nameExists) {
                throw new IllegalArgumentException("Value '" + newName + "' already exists in this category");
            }
        }

        // If this is a Vendor or File Type value and name changed, update file structure
        Category category = value.getCategory();
        if (nameChanged && category != null &&
            (category.getName().equals("Vendor") || category.getName().equals("File Type"))) {

            // First rename the folders on disk
            ngFileService.updateFileStructureWithNewValue(value, newName);

            // Now update the value name
            value.setName(newName);

            // Update all affected files' links in database
            if (category.getName().equals("Vendor")) {
                List<FileObject> affectedFiles = fileRepo.findByVendor(value);
                for (FileObject file : affectedFiles) {
                    // Rebuild file link and folder with new vendor name
                    file.buildFileLink();
                    file.buildFolder();
                    fileRepo.save(file);
                }
            } else if (category.getName().equals("File Type")) {
                List<FileObject> affectedFiles = fileRepo.findByFileType(value);
                for (FileObject file : affectedFiles) {
                    // Rebuild file link and folder with new file type name
                    file.buildFileLink();
                    file.buildFolder();
                    fileRepo.save(file);
                }
            }
        } else if (nameChanged) {
            value.setName(newName);
        }

        if (newAlias != null && !newAlias.isEmpty()) {
            value.setAlias(newAlias);
        }

        Value saved = valueRepo.save(value);
        return valueToDto(saved);
    }

    /**
     * Delete a value and optionally transfer its references to another value
     */
    public void deleteValue(Long valueId, Long transferToValueId) {
        Value valueToDelete = valueRepo.findById(valueId)
                .orElseThrow(() -> new IllegalArgumentException("Value not found: " + valueId));

        // If transferToValueId is provided, transfer all references
        if (transferToValueId != null) {
            Value transferTo = valueRepo.findById(transferToValueId)
                    .orElseThrow(() -> new IllegalArgumentException("Transfer target value not found: " + transferToValueId));

            // Use existing NgValueService method for dependency transfer
            ngValueService.moveItemsToNewValue(valueId, transferToValueId);
        }

        // Soft delete by setting deleted flag
        valueToDelete.setDeleted(true);
        valueRepo.save(valueToDelete);
    }

    /**
     * Get all values for a category by alias or name
     */
    public List<ValueDto> getValuesByCategory(String categoryAliasOrName) {
        Category category = getCategoryByAliasOrName(categoryAliasOrName);
        if (category == null) {
            throw new IllegalArgumentException("Category not found: " + categoryAliasOrName);
        }

        return category.getValues().stream()
                .map(this::valueToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all values across all categories
     */
    public List<ValueDto> getAllValues() {
        return valueRepo.findAll().stream()
                .map(this::valueToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific value by ID
     */
    public ValueDto getValueById(Long valueId) {
        Value value = valueRepo.findById(valueId)
                .orElseThrow(() -> new IllegalArgumentException("Value not found: " + valueId));
        return valueToDto(value);
    }

    // ==================== CATEGORY OPERATIONS ====================

    /**
     * Get all categories
     */
    public List<CategoryDto> getAllCategories() {
        return categoryRepo.findAll().stream()
                .map(this::categoryToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get values for multiple categories
     */
    public java.util.Map<String, List<ValueDto>> getValuesByCategories(List<String> categoryAliases) {
        return categoryAliases.stream()
                .collect(Collectors.toMap(
                        alias -> alias,
                        this::getValuesByCategory
                ));
    }

    // ==================== VALIDATION OPERATIONS ====================

    /**
     * Check if a value can be deleted (has no dependencies)
     */
    public boolean canDeleteValue(Long valueId) {
        java.util.Map<String, Long> dependencies = getValueDependencies(valueId);

        // Value can be deleted if it has no dependencies or if transfer is possible
        long totalDependencies = dependencies.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        return totalDependencies == 0;
    }

    /**
     * Get count of dependencies for a value
     */
    public java.util.Map<String, Long> getValueDependencies(Long valueId) {
        java.util.Map<String, Long> dependencies = new java.util.HashMap<>();

        // Count Equipment dependencies
        long equipmentVendor = equipmentRepo.countByVendorId(valueId);
        long equipmentType = equipmentRepo.countByEqTypeId(valueId);
        long equipmentSystem = equipmentRepo.countBySystemId(valueId);
        long equipmentLocation = equipmentRepo.countByLocationId(valueId);

        long totalEquipment = equipmentVendor + equipmentType + equipmentSystem + equipmentLocation;
        if (totalEquipment > 0) {
            dependencies.put("equipment", totalEquipment);
        }

        // Count LotoPoint dependencies
        long lotoIsoPos = lotoPointRepo.countByIsoPosId(valueId);
        long lotoNormPos = lotoPointRepo.countByNormPosId(valueId);
        long lotoLocation = lotoPointRepo.countByLocationId(valueId);
        long lotoEqType = lotoPointRepo.countByEqTypeId(valueId);

        long totalLotoPoints = lotoIsoPos + lotoNormPos + lotoLocation + lotoEqType;
        if (totalLotoPoints > 0) {
            dependencies.put("lotoPoints", totalLotoPoints);
        }

        return dependencies;
    }

    // ==================== HELPER METHODS ====================

    private Category getCategoryByAliasOrName(String aliasOrName) {
        // Try alias first
        Category category = categoryRepo.findByAlias(aliasOrName);
        if (category != null) {
            return category;
        }

        // Try name
        List<Category> categories = categoryRepo.findByName(aliasOrName);
        return categories.isEmpty() ? null : categories.get(0);
    }

    private Category createCategory(String categoryName) {
        Category category = new Category(categoryName);
        category.setAlias(generateAlias(categoryName));
        return categoryRepo.save(category);
    }

    private String generateAlias(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .substring(0, Math.min(name.length(), 20));
    }

    private ValueDto valueToDto(Value value) {
        ValueDto dto = new ValueDto();
        dto.setId(value.getId());
        dto.setName(value.getName());
        dto.setAlias(value.getAlias());

        if (value.getCategory() != null) {
            CategoryDto categoryDto = new CategoryDto();
            categoryDto.setId(value.getCategory().getId());
            categoryDto.setName(value.getCategory().getName());
            categoryDto.setAlias(value.getCategory().getAlias());
            dto.setCategory(categoryDto);
        }

        return dto;
    }

    private CategoryDto categoryToDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setAlias(category.getAlias());
        return dto;
    }
}
