package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.util.Util;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class NgValueService {
    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final NgEquipmentService equipmentService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;
    private final ObjectProvider<WorkAreaGitHubPublisher> workAreaGitHubPublisherProvider;
    /** Model-wide reference scan backing the delete gate and the repoint. @Lazy — it is a peer service. */
    private final ValueReferenceService valueReferenceService;

    public NgValueService(CategoryRepo categoryRepo, ValueRepo valueRepo, NgEquipmentService equipmentService, @Lazy NgFileService fileService, NgLotoPointService lotoPointService, ObjectProvider<WorkAreaGitHubPublisher> workAreaGitHubPublisherProvider, @Lazy ValueReferenceService valueReferenceService) {
        this.categoryRepo = categoryRepo;
        this.valueRepo = valueRepo;
        this.equipmentService = equipmentService;
        this.fileService = fileService;
        this.lotoPointService = lotoPointService;
        this.workAreaGitHubPublisherProvider = workAreaGitHubPublisherProvider;
        this.valueReferenceService = valueReferenceService;
    }

    // Create
    public Value createValue(Long categoryId, Value value) {
        return categoryRepo.findById(categoryId).map(category -> {
            value.setCategory(category);
            Value saved = valueRepo.save(value);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }).orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public Value createValue(String categoryName, Value value) {
        Category category = getCategoryByAliasSafe(categoryName);
        if (category == null) category = createCategory(categoryName);
        value.setCategory(category);
        Value saved = valueRepo.save(value);
        publishPwaCategoriesIfRelevant(category);
        return saved;
    }

    public Value createValue(Long categoryId, String valueName) {
        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new RuntimeException("Category not found"));
        Value value = new Value(valueName);
        value.setCategory(category);
        Value saved = valueRepo.save(value);
        publishPwaCategoriesIfRelevant(category);
        return saved;
    }

    @Transactional
    public Value createValue(String categoryName, String valueName) {
        Category category = categoryRepo.findByName(categoryName)
                .stream()
                .findFirst()
                .orElseGet(() -> createCategory(categoryName));

        Value existingValue = category.getValueByName(valueName);
        if (existingValue != null) {
            return existingValue;
        } else {
            Value newValue = new Value(valueName);
            newValue.setCategory(category);
            Value saved = valueRepo.save(newValue);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }
    }

    @Transactional
    public Value createValue(String categoryName, String valueName, String valueAlias) {
        Category category = categoryRepo.findByName(categoryName)
                .stream()
                .findFirst()
                .orElseGet(() -> createCategory(categoryName));

        Value existingValue = category.getValueByName(valueName);
        Value existingValueAlias = category.getValueByName(valueAlias);
        if (existingValue != null) {
            if(existingValue.getAlias()==null){
                existingValue.setAlias(valueAlias);
                Value saved = valueRepo.save(existingValue);
                publishPwaCategoriesIfRelevant(category);
                return saved;
            }
            return existingValue;
        }else if(existingValue == null && existingValueAlias!=null){
            existingValueAlias.setName(valueName);
            existingValueAlias.setAlias(valueAlias);
            Value saved = valueRepo.save(existingValueAlias);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }else {
            Value newValue = new Value(valueName,valueAlias);
            newValue.setCategory(category);
            Value saved = valueRepo.save(newValue);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }
    }

    @Transactional
    public Value addValueToCategoryByAlias(String categoryName, String valueName) {
//        System.out.println(categoryName + " " + valueName);
        Category category = getCategoryByAliasSafe(categoryName);
//        System.out.println(category.getAlias());
        if (category == null) throw new RuntimeException("Category not found");

        Value existingValue = category.getValueByName(valueName);
        if (existingValue != null) {
            return existingValue;
        } else {
            Value newValue = new Value(valueName);
            newValue.setCategory(category);
            Value saved = valueRepo.save(newValue);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }
    }

    @Transactional
    public Value addValueToCategoryByAlias(String categoryName, String valueName, String valueAlias) {
//        System.out.println(categoryName + " " + valueName);
        Category category = getCategoryByAliasSafe(categoryName);
//        System.out.println(category.getAlias());
        if (category == null) throw new RuntimeException("Category not found");

        Value existingValue = category.getValueByName(valueName);
        if (existingValue != null) {
            return existingValue;
        } else {
            Value newValue = new Value(valueName);
            if(valueAlias!=null && !valueAlias.isEmpty()) newValue.setAlias(valueAlias);
            newValue.setCategory(category);
            Value saved = valueRepo.save(newValue);
            publishPwaCategoriesIfRelevant(category);
            return saved;
        }
    }


    // Update
    public Value updateValue(Long id, Value valueDetails) {
        return valueRepo.findById(id).map(value -> {
            value.setName(valueDetails.getName());
            // Update other fields as necessary
            Value saved = valueRepo.save(value);
            publishPwaCategoriesIfRelevant(saved.getCategory());
            return saved;
        }).orElseThrow(() -> new RuntimeException("Value not found"));
    }

    // Read
    public List<Value> getAllValues() {
        return valueRepo.findAll();
    }

    public List<Value> getValuesByCategory(Long categoryId) {
        return new ArrayList<>(categoryRepo.findById(categoryId).orElseThrow(() -> new RuntimeException("Category not found")).getValues());
    }

    public List<Value> getValuesByCategory(String categoryName) {
        Category category = getCategoryByIdentifierSafe(categoryName);
        if (category == null) {
            throw new RuntimeException("Category not found with identifier: " + categoryName);
        }
        return new ArrayList<>(category.getValues());
    }

    public List<Value> getValuesByCategoryAlias(String categoryAlias) {
        Category byAlias = getCategoryByAliasSafe(categoryAlias);
        if (byAlias != null) return new ArrayList<>(byAlias.getValues());
        else throw new RuntimeException("Category not found with alias: " + categoryAlias);
    }

    public Optional<Value> getValueById(Long id) {
        return valueRepo.findById(id);
    }

    /**
     * Find an existing Value in a category by name. NEVER creates — the counterpart to
     * {@link #createValue(String, String)} for callers holding user-typed text, where minting a
     * Value on every unseen spelling would corrupt the category's vocabulary.
     */
    public Optional<Value> findValueInCategory(String categoryName, String valueName) {
        if (categoryName == null || valueName == null || valueName.isBlank()) {
            return Optional.empty();
        }
        return categoryRepo.findByName(categoryName).stream()
                .findFirst()
                .map(category -> category.getValueByName(valueName.trim()))
                .filter(java.util.Objects::nonNull);
    }

    /**
     * Delete a Value if nothing references it.
     *
     * <p>Two prior defects, both fixed here because every value-management screen funnels into this
     * method: the reference check only knew about Equipment, FileObject and LotoPoint — so a Value
     * still used by FieldListItem, InventoryItem, WorkArea or anything else was deleted anyway,
     * orphaning the FK — and the delete was a HARD {@code deleteById}, which neither honours the
     * project's soft-delete convention nor emits a sync change.
     *
     * <p>The check is now the model-wide metamodel scan, and the delete is soft. Behaviour on
     * "still referenced" is unchanged (no-op rather than throw) so existing callers keep working;
     * callers that want the reason should use {@code ValueReferenceService.deleteIfUnreferenced}.
     */
    public void deleteValue(Long id) {
        Value value = getValueById(id).orElseThrow(() -> new RuntimeException("Value not found"));
        int references = valueReferenceService.findReferences(id).totalCount();
        if (references > 0) {
            log.warn("[Values] Refusing to delete value {} ({}) — {} reference(s) remain",
                    id, value.getName(), references);
            return;
        }
        value.setDeleted(true);
        valueRepo.save(value);
        publishPwaCategoriesIfRelevant(value.getCategory());
    }

    // Move value to different category
    public Value moveValueToCategory(Long valueId, Long newCategoryId) {
        Value value = valueRepo.findById(valueId)
                .orElseThrow(() -> new RuntimeException("Value not found"));
        Category oldCategory = value.getCategory();
        Category newCategory = categoryRepo.findById(newCategoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        value.setCategory(newCategory);
        Value saved = valueRepo.save(value);
        publishPwaCategoriesIfRelevant(newCategory);
        publishPwaCategoriesIfRelevant(oldCategory);
        return saved;
    }

    // Bulk operations
    public List<Value> createValuesForCategory(Long categoryId, List<Value> values) {
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        values.forEach(value -> value.setCategory(category));
        return valueRepo.saveAll(values);
    }

    public ValueDto valueToDto(Value value) {
        if (value == null) return null;

        ValueDto valueDto = new ValueDto();
        if (value.getId() != null) valueDto.setId(value.getId());
        if (value.getName() != null) valueDto.setName(value.getName());
        if (value.getAlias() != null) valueDto.setAlias(value.getAlias());
        if (value.getCategory() != null) valueDto.setCategory(this.categoryToDto(value.getCategory()));

        return valueDto;
    }

    public CategoryDto categoryToDto(Category category) {
        if (category == null) return null;

        CategoryDto categoryDto = new CategoryDto();
        if (category.getId() != null) categoryDto.setId(category.getId());
        if (category.getName() != null) categoryDto.setName(category.getName());
        if (category.getAlias() != null) categoryDto.setAlias(category.getAlias());

        return categoryDto;
    }

    public Value valueToEntity(ValueDto valueDto) {
        Value value = new Value();
        value.setId(valueDto.getId());
        value.setName(valueDto.getName());
        value.setAlias(valueDto.getAlias());
        value.setCategory(this.categoryToEntity(valueDto.getCategory()));
        return value;
    }

    public Category categoryToEntity(CategoryDto categoryDto) {
        Category category = new Category();
        category.setId(categoryDto.getId());
        category.setName(categoryDto.getName());
        category.setAlias(categoryDto.getAlias());
        return category;
    }


    public Category createCategory(String categoryName) {
        String alias = Util.toCamelCase(categoryName);

        // Check if category already exists by alias first (most reliable)
        Category existingByAlias = getCategoryByAliasSafe(alias);
        if (existingByAlias != null) {
            return existingByAlias;
        }

        // Check if category already exists by name
        List<Category> existingByName = categoryRepo.findByName(categoryName);
        if (!existingByName.isEmpty()) {
            return existingByName.getFirst();
        }

        // Only create new category if none exists
        Category category = new Category(categoryName);
        category.setAlias(alias);
        return categoryRepo.save(category);
    }

    public Category getCategoryById(Long id) {
        return categoryRepo.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public Category getCategoryByAlias(String alias) {
        return getCategoryByAliasSafe(alias);
    }

    public List<Category> getCategoryByName(String name) {
        return categoryRepo.findByName(name);
    }

    public List<Category> getAllCategories() {
        return categoryRepo.findAll();
    }

    /**
     * Safely retrieves a category by alias, handling duplicates gracefully.
     * Returns first match if duplicates exist (logs warning).
     * Returns null if not found.
     */
    public Category getCategoryByAliasSafe(String alias) {
        List<Category> categories = categoryRepo.findByAlias(alias);
        if (categories.isEmpty()) return null;
        if (categories.size() > 1) {
            log.debug("Multiple categories found with alias '{}', using first (id={})",
                    alias, categories.get(0).getId());
        }
        return categories.get(0);
    }

    /**
     * Safely retrieves a category by name, handling duplicates gracefully.
     * Returns first match if duplicates exist (logs warning).
     * Returns null if not found.
     */
    public Category getCategoryByNameSafe(String name) {
        List<Category> categories = categoryRepo.findByName(name);
        if (categories.isEmpty()) return null;
        if (categories.size() > 1) {
            log.debug("Multiple categories found with name '{}', using first (id={})",
                    name, categories.get(0).getId());
        }
        return categories.get(0);
    }

    /**
     * Safely retrieves a category by either exact name, alias, or case-insensitive name.
     * Returns the first match and logs when multiple candidates are found.
     */
    public Category getCategoryByIdentifierSafe(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return null;
        }

        Category byName = getCategoryByNameSafe(identifier);
        if (byName != null) {
            return byName;
        }

        Category byAlias = getCategoryByAliasSafe(identifier);
        if (byAlias != null) {
            return byAlias;
        }

        List<Category> byNameIgnoreCase = categoryRepo.findByNameIgnoreCase(identifier);
        if (byNameIgnoreCase.isEmpty()) return null;
        if (byNameIgnoreCase.size() > 1) {
            log.debug("Multiple categories found with identifier '{}' (ignore-case), using first (id={})",
                    identifier, byNameIgnoreCase.get(0).getId());
        }
        return byNameIgnoreCase.get(0);
    }

    public Optional<Value> findById(Long system) {
        return valueRepo.findById(system);
    }

    /**
     * Move every reference from one Value to another.
     *
     * <p>Delegates to the model-wide repoint. The previous implementation only walked Equipment,
     * LotoPoint and FileObject, so a "transfer then delete" left FieldListItem / InventoryItem /
     * WorkArea rows pointing at the value that was about to be deleted — and then returned
     * {@code false} precisely when it HAD moved something, while reassigning the old value's
     * category when it had not.
     *
     * @return true when the repoint completed (whether or not anything needed moving)
     */
    public boolean moveItemsToNewValue(Long id, Long newId) {
        getValueById(id).orElseThrow(() -> new RuntimeException("Original Value not found"));
        getValueById(newId).orElseThrow(() -> new RuntimeException("New Value not found"));
        valueReferenceService.repoint(id, newId);
        return true;
    }

    public Value updateValueName(Long valueId, String newName) {
        Value value = getValueById(valueId).orElseThrow(() -> new RuntimeException("Value not found"));

        Category category = value.getCategory();
        boolean isVendorOrFileType = category != null &&
            (category.getName().equals("Vendor") || category.getName().equals("File Type"));
        boolean nameChanged = !value.getName().equals(newName);

        if (isVendorOrFileType && nameChanged) {
            // Rename folders on disk first
            fileService.updateFileStructureWithNewValue(value, newName);

            // Update the value name
            value.setName(newName);

            // Update all affected FileObjects' links in database
            updateAffectedFileObjects(value, category.getName());
        } else {
            value.setName(newName);
        }

        Value saved = valueRepo.save(value);
        publishPwaCategoriesIfRelevant(saved.getCategory());
        return saved;
    }

    public Value updateValueName(Long valueId, String newName, String newAlias) {
        Value value = getValueById(valueId).orElseThrow(() -> new RuntimeException("Value not found"));

        Category category = value.getCategory();
        boolean isVendorOrFileType = category != null &&
            (category.getName().equals("Vendor") || category.getName().equals("File Type"));
        boolean nameChanged = !value.getName().equals(newName);

        if (isVendorOrFileType && nameChanged) {
            // Rename folders on disk first
            fileService.updateFileStructureWithNewValue(value, newName);

            // Update the value name and alias
            value.setName(newName);
            if (newAlias != null && !newAlias.isEmpty()) value.setAlias(newAlias);

            // Update all affected FileObjects' links in database
            updateAffectedFileObjects(value, category.getName());
        } else {
            value.setName(newName);
            if (newAlias != null && !newAlias.isEmpty()) value.setAlias(newAlias);
        }

        Value saved = valueRepo.save(value);
        publishPwaCategoriesIfRelevant(saved.getCategory());
        return saved;
    }

    private void publishPwaCategoriesIfRelevant(Category category) {
        if (category == null) {
            return;
        }
        String name = category.getName();
        String alias = category.getAlias();
        boolean isWorkCategory = "Work Category".equalsIgnoreCase(name)
                || "workCategory".equalsIgnoreCase(alias)
                || "workcategory".equalsIgnoreCase(alias);
        boolean isFieldListType = "FieldListType".equalsIgnoreCase(name)
                || "fieldlisttype".equalsIgnoreCase(alias);
        boolean isInventoryType = "InventoryType".equalsIgnoreCase(name)
                || "inventorytype".equalsIgnoreCase(alias);
        boolean isLocation = "Location".equalsIgnoreCase(name)
                || "location".equalsIgnoreCase(alias);

        if (isFieldListType) {
            WorkAreaGitHubPublisher publisher = workAreaGitHubPublisherProvider.getIfAvailable();
            if (publisher != null) {
                publisher.publishFieldListTypes();
            }
            return;
        }

        if (isInventoryType) {
            WorkAreaGitHubPublisher publisher = workAreaGitHubPublisherProvider.getIfAvailable();
            if (publisher != null) {
                publisher.publishInventoryTypes();
            }
            return;
        }

        if (isLocation) {
            WorkAreaGitHubPublisher publisher = workAreaGitHubPublisherProvider.getIfAvailable();
            if (publisher != null) {
                publisher.publishLocations();
            }
            return;
        }

        if (!isWorkCategory) {
            return;
        }

        WorkAreaGitHubPublisher publisher = workAreaGitHubPublisherProvider.getIfAvailable();
        if (publisher != null) {
            publisher.publishCategories();
        }
    }

    /**
     * Update all FileObjects affected by a Vendor or FileType name change.
     * This rebuilds the fileLink and folder fields so they reflect the new path structure.
     * This is critical for sync - without updating these fields, the change tracker won't
     * detect the path changes and files won't be uploaded to the sync server at the new location.
     */
    private void updateAffectedFileObjects(Value value, String categoryName) {
        // findByValue finds all FileObjects that reference this Value (as vendor, fileType, or system)
        // Since we only call this for Vendor or FileType categories, it will find the right files
        fileService.findByValue(value).forEach(file -> {
            file.buildFileLink();
            file.buildFolder();
            fileService.save(file);
        });
    }


}
