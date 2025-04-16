package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NgValueService {
    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;

    // Create
    public Value createValue(Long categoryId, Value value) {
        return categoryRepo.findById(categoryId).map(category -> {
            value.setCategory(category);
            return valueRepo.save(value);
        }).orElseThrow(() -> new RuntimeException("Category not found"));
    }

    // Read
    public List<Value> getAllValues() {
        return valueRepo.findAll();
    }

    public Optional<Value> getValueById(Long id) {
        return valueRepo.findById(id);
    }

    // Update
    public Value updateValue(Long id, Value valueDetails) {
        return valueRepo.findById(id).map(value -> {
            value.setName(valueDetails.getName());
            // Update other fields as necessary
            return valueRepo.save(value);
        }).orElseThrow(() -> new RuntimeException("Value not found"));
    }

    // Delete
    public void deleteValue(Long id) {
        valueRepo.deleteById(id);
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
}
