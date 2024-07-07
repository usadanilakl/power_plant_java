package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.entities2.categories.Category;
import com.dk_power.power_plant_java.entities2.categories.Value;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValueRepo extends JpaRepository<Value,Long> {
}
