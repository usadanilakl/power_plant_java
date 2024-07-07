package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.Syst;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.SystemRepo;
import com.dk_power.power_plant_java.sevice.plant.SystemService;
import org.springframework.stereotype.Service;

@Service
public class SystemServiceImpl extends GroupServiceImpl<Syst> implements SystemService {
    private final SystemRepo repo;

    public SystemServiceImpl(SystemRepo repo, UniversalMapper mapper, SystemRepo repo1) {
        super(repo, mapper);
        this.repo = repo1;
    }

    @Override
    public Syst createNew(String name) {
        //System system = new System();
        return null;
    }
    @Override
    public Syst saveForTransfer(Syst transfer) {
        Syst entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }
}
