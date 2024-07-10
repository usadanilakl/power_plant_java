package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface EquipmentService extends CrudService<Equipment, EquipmentDto, EquipmentRepo, UniversalMapper> {
    Equipment saveForTransfer(Equipment transfer);
}
