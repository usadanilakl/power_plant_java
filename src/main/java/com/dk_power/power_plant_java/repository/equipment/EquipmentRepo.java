package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities2.categories.Category;
import com.dk_power.power_plant_java.entities2.equipment.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentRepo extends JpaRepository<Equipment,Long> {
}
