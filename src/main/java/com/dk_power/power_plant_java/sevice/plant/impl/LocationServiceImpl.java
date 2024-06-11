package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.LocationRepo;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class LocationServiceImpl extends GroupServiceImpl<Location>{

    public LocationServiceImpl(LocationRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
    }


}
