package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.EquipmentTypeRepo;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class EquipmentTypeServiceImpl extends GroupServiceImpl<EquipmentType>{

    public EquipmentTypeServiceImpl(EquipmentTypeRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
    }


}
