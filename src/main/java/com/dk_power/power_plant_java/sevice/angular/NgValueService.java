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
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.util.Util;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgValueService {
    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final NgEquipmentService equipmentService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;

    // Create
    public Value createValue(Long categoryId, Value value) {
        return categoryRepo.findById(categoryId).map(category -> {
            value.setCategory(category);
            return valueRepo.save(value);
        }).orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public Value createValue(String categoryName, Value value) {
        Category category = categoryRepo.findByAlias(categoryName);
        if (category == null) category = createCategory(categoryName);
        value.setCategory(category);
        return valueRepo.save(value);
    }

    public Value createValue(Long categoryId, String valueName) {
        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new RuntimeException("Category not found"));
        Value value = new Value(valueName);
        value.setCategory(category);
        return valueRepo.save(value);
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
            return valueRepo.save(newValue);
        }
    }
    
    @Transactional
    public Value addValueToCategoryByAlias(String categoryName, String valueName) {
        System.out.println(categoryName + " " + valueName);
        Category category = categoryRepo.findByAlias(categoryName);
        System.out.println(category.getAlias());
        if(category == null) throw new RuntimeException("Category not found");

        Value existingValue = category.getValueByName(valueName);
        if (existingValue != null) {
            return existingValue;
        } else {
            Value newValue = new Value(valueName);
            newValue.setCategory(category);
            return valueRepo.save(newValue);
        }
    }
    

    // Update
    public Value updateValue(Long id, Value valueDetails) {
        return valueRepo.findById(id).map(value -> {
            value.setName(valueDetails.getName());
            // Update other fields as necessary
            return valueRepo.save(value);
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
        List<Category> byName = categoryRepo.findByName(categoryName);
        if (byName.size() == 1) return new ArrayList<>(byName.getFirst().getValues());
        else if (byName.size() == 0) throw new RuntimeException("Category not found with name: " + categoryName);
        else throw new RuntimeException("2 or more categories found with name: " + categoryName);
    }

    public List<Value> getValuesByCategoryAlias(String categoryAlias) {
        Category byAlias = categoryRepo.findByAlias(categoryAlias);
        if (byAlias != null) return new ArrayList<>(byAlias.getValues());
        else throw new RuntimeException("Category not found with alias: " + categoryAlias);
    }

    public Optional<Value> getValueById(Long id) {
        return valueRepo.findById(id);
    }

    // Delete
    public void deleteValue(Long id) {
        Value value = getValueById(id).orElseThrow(() -> new RuntimeException("Value not found"));
        List<Equipment> associatedEq = equipmentService.findByValue(value);
        List<FileObject> associatedFiles = fileService.findByValue(value);
        List<LotoPoint> associatedLotoPoints = lotoPointService.findByValue(value);
        if(associatedLotoPoints.isEmpty() && associatedFiles.isEmpty() && associatedEq.isEmpty()){
            valueRepo.deleteById(id);
        }

    }

    // Move value to different category
    public Value moveValueToCategory(Long valueId, Long newCategoryId) {
        Value value = valueRepo.findById(valueId)
                .orElseThrow(() -> new RuntimeException("Value not found"));
        Category newCategory = categoryRepo.findById(newCategoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        value.setCategory(newCategory);
        return valueRepo.save(value);
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
        Category category = new Category(categoryName);
        category.setAlias(alias);
        return categoryRepo.save(category);
    }

    public Category getCategoryById(Long id) {
        return categoryRepo.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public Category getCategoryByAlias(String alias) {
        return categoryRepo.findByAlias(alias);
    }

    public List<Category> getCategoryByName(String name) {
        return categoryRepo.findByName(name);
    }

    public List<Category> getAllCategories() {
        return categoryRepo.findAll();
    }

    public Optional<Value> findById(Long system) {
        return valueRepo.findById(system);
    }

    public boolean moveItemsToNewValue(Long id, Long newId) {
        Value oldValue = getValueById(id).orElseThrow(() -> new RuntimeException("Original Value not found"));
        Value newValue = getValueById(newId).orElseThrow(() -> new RuntimeException("New Value not found"));

        List<Equipment> equipment = equipmentService.refactorValues(oldValue, newValue);
        List<LotoPoint> lotoPoints = lotoPointService.refactorValues(oldValue, newValue);
        List<FileObject> fileObjects = fileService.refactorValues(oldValue, newValue);

        if(equipment.isEmpty() && lotoPoints.isEmpty() && fileObjects.isEmpty()){
            oldValue.setCategory(newValue.getCategory());
            return true;
        }

        return false;

    }

    public Value updateValueName(Long valueId, String newName) {
        Value value = getValueById(valueId).orElseThrow(() -> new RuntimeException("Value not found"));
        value.setName(newName);
        return valueRepo.save(value);
    }
}
