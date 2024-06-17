package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.EquipmentTypeRepo;
import com.dk_power.power_plant_java.repository.plant.FileTypeRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentTypeServiceImpl extends GroupServiceImpl<EquipmentType>{
    private final EquipmentTypeRepo repo;

    public EquipmentTypeServiceImpl(EquipmentTypeRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
        this.repo = repo;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public EquipmentType saveForTransfer(EquipmentType transfer) {
        EquipmentType entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }

    public EquipmentType getByName(String name) {
        EquipmentType byName = repo.findByName(name);
        return byName;
    }
}
