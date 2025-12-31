package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EquipmentRepo extends BaseRepository<Equipment> {
//    @Query("SELECT new com.dk_power.power_plant_java.dto.equipment.EquipmentDtoLight(e.id,e.tagNumber,e.description,e.specificLocation,e.eqType.name,e.vendor.name, e.location.name,e.system.name)FROM Equipment e")
//    List<EquipmentDtoLight> getAllLight();
@Query("SELECT new com.dk_power.power_plant_java.dto.equipment.EquipmentDtoLight(" +
        "e.id, " +
        "e.tagNumber, " +
        "e.description, " +
        "e.specificLocation, " +
        "et.name, " +
        "v.name, " +
        "l.name, " +
        "s.name) " +
        "FROM Equipment e " +
        "LEFT JOIN e.eqType et " +
        "LEFT JOIN e.vendor v " +
        "LEFT JOIN e.location l " +
        "LEFT JOIN e.system s")
List<EquipmentDtoLight> getAllLight();
    List<Equipment> findByTagNumber(String lable);
    List<Equipment> findByTagNumberContaining(String lable);

    List<Equipment> findByCoordinates(String coordinates);

    List<Equipment> findByVendor(Value oldVal);

    List<Equipment> findByEqType(Value oldVal);

    List<Equipment> findBySystem(Value oldVal);

    List<Equipment> findByLocation(Value oldVal);
    @Query("SELECT u.tagNumber FROM Equipment u GROUP BY u.tagNumber HAVING COUNT(u.tagNumber) > 1")
    List<String> findDuplicateTagNumbers();
    @Query("SELECT u.tagNumber FROM Equipment u GROUP BY u.tagNumber HAVING COUNT(u.tagNumber) = 1")
    List<String> findUniqueTagNumbers();

    List<Equipment> findByTagNumberContainingIgnoreCase(String value);

    List<Equipment> findByDescriptionContainingIgnoreCase(String value);

    List<String> findByTagNumberStartingWith(String number);

    @Query("SELECT e FROM Equipment e WHERE e.dataServiceItemId IS NULL")
    List<Equipment> findByNullDataServiceItemId();

    List<Equipment> getByEqType_name(String equipmentType);

    List<Equipment> getByVendor_name(String vendorName);

    List<Equipment> getBySystem_name(String systemName);

    List<Equipment> getByLocation_name(String locationName);

    @Query("SELECT e FROM Equipment e WHERE SIZE(e.lotoPoints) > 1")
    List<Equipment> findAllWithMultipleLotoPoints();

    @Query("SELECT e FROM Equipment e WHERE SIZE(e.lotoPoints) > 0")
    List<Equipment> findAllWithLotoPoints();

    @Query("SELECT DISTINCT e FROM Equipment e LEFT JOIN FETCH e.lotoPoints lp WHERE lp.id IN :lotoPointIds")
    List<Equipment> findByLotoPointIdsIn(@org.springframework.data.repository.query.Param("lotoPointIds") List<Long> lotoPointIds);

    // Count methods for Value dependency checking
    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.vendor.id = :valueId")
    long countByVendorId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.eqType.id = :valueId")
    long countByEqTypeId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.system.id = :valueId")
    long countBySystemId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.location.id = :valueId")
    long countByLocationId(@org.springframework.data.repository.query.Param("valueId") Long valueId);
}
