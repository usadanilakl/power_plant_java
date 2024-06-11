package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.VendorRepo;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class VendorServiceImpl extends GroupServiceImpl<Vendor>{

    public VendorServiceImpl(VendorRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
    }


}
