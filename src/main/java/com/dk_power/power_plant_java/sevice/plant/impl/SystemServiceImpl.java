package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.repository.plant.SystemRepo;
import com.dk_power.power_plant_java.sevice.BaseCrudServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.SystemService;

public class SystemServiceImpl extends BaseCrudServiceImpl<System, SystemRepo> implements SystemService {
    public SystemServiceImpl(SystemRepo repo) {
        super(repo);
    }

    @Override
    public System createNew(String name) {
        //System system = new System();
        return null;
    }
}
