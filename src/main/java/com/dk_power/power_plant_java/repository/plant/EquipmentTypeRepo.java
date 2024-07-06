package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;

public interface EquipmentTypeRepo extends GroupRepo<EquipmentType> {
    EquipmentType findByName(String name);
}
