package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepo extends BaseRepository<Equipment> {
    Equipment findByTagNumber(String lable);

    List<Equipment> findByCoordinates(String coordinates);
}
