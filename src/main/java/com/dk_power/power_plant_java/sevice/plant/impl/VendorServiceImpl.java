package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.Vendor;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.VendorRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VendorServiceImpl extends GroupServiceImpl<Vendor>{
    private final VendorRepo repo;

    public VendorServiceImpl(VendorRepo repo, UniversalMapper mapper, VendorRepo repo1) {
        super(repo, mapper);
        this.repo = repo1;
    }
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Vendor saveForTransfer(Vendor transfer) {
        Vendor entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }


    public Vendor getByName(String name) {
        return repo.findByName(name);
    }
}
