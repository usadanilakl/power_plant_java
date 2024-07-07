package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities2.categories.Category;
import com.dk_power.power_plant_java.entities2.equipment.LotoPoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LotoPointRepo extends JpaRepository<LotoPoint,Long> {
}
