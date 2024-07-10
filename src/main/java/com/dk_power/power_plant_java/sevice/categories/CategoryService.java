package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface CategoryService extends CrudService<Category, CategoryDto, CategoryRepo, UniversalMapper> {
    Category getCategoryByName(String name);
    Category getVendors();
    Category getLocations();
    Category getEqTypes();
    Category getSystems();
    Category getFileTypes();
    void saveValueIfNew(Value value,String name);



}
