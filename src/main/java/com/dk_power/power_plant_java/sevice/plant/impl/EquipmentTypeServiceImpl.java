package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.EquipmentTypeRepo;
import com.dk_power.power_plant_java.repository.plant.FileTypeRepo;
import org.springframework.stereotype.Service;

@Service
public class EquipmentTypeServiceImpl extends GroupServiceImpl<EquipmentType>{
    private final EquipmentTypeRepo repo;

    public EquipmentTypeServiceImpl(EquipmentTypeRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
        this.repo = repo;
    }

    @Override
    public EquipmentType saveForTransfer(EquipmentType transfer) {
        EquipmentType entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }
}
