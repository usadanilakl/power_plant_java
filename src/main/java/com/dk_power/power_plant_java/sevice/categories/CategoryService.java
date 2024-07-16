package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;

import java.util.List;
import java.util.Set;

public interface CategoryService extends BaseCategoryValueService<Category, CategoryDto, CategoryRepo, UniversalMapper> {
    Category getCategoryByName(String name);
    Category createIfNotFound(String name);
    Set<ValueDto> getVendors();
    Set<ValueDto> getLocations();
    Set<ValueDto> getEqTypes();
    Set<ValueDto> getSystems();
    Set<ValueDto> getFileTypes();
    Set<ValueDto> getValuesOfCat(String category);

}
