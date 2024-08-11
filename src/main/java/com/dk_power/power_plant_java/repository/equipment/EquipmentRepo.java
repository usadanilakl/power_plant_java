package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EquipmentRepo extends BaseRepository<Equipment> {
    List<Equipment> findByTagNumber(String lable);

    List<Equipment> findByCoordinates(String coordinates);

    List<Equipment> findByVendor(Value oldVal);

    List<Equipment> findByEqType(Value oldVal);

    List<Equipment> findBySystem(Value oldVal);

    List<Equipment> findByLocation(Value oldVal);
    @Query("SELECT u.tagNumber FROM Equipment u GROUP BY u.tagNumber HAVING COUNT(u.tagNumber) > 1")
    List<String> findDuplicateTagNumbers();
}
