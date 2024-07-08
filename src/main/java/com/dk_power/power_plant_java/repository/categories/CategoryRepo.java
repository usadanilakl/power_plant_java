package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface CategoryRepo extends BaseRepository<Category> {
    Category findByName(String name);

}
