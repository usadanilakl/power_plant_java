package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;

import java.util.List;

public interface EquipmentService extends CrudService<Equipment, EquipmentDto, EquipmentRepo, EquipmentMapper> , RefactorService {
    Equipment saveForTransfer(Equipment transfer);
    void combineDuplicates(String tagNumber);

    List<Equipment> getByTagNumber(String tag);
    public List<Equipment> getByVendor(Value oldVal);
    public List<Equipment> getByEqType(Value oldVal);
    public List<Equipment> getBySystem(Value oldVal);
    public List<Equipment> getByLocation(Value oldVal);
    List<Equipment> getByValue(Value val);
    Equipment copyEqFromAnotherUnit(Equipment eq);

    List<Equipment> getByTagNumberContains(String tag);

    List<Equipment> getIfTagNumberContains(String value);

    List<Equipment> getIfDescriptionContains(String value);
}
