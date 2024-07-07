package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.entities2.categories.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepo extends JpaRepository<Category,Long> {
}
