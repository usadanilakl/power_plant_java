package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.LocationRepo;
import org.springframework.stereotype.Service;

@Service
public class LocationServiceImpl extends GroupServiceImpl<Location>{
    private final LocationRepo repo;

    public LocationServiceImpl(LocationRepo repo, UniversalMapper mapper, LocationRepo repo1) {
        super(repo, mapper);
        this.repo = repo1;
    }
    @Override
    public Location saveForTransfer(Location transfer) {
        Location entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }


}
