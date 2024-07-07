package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.Syst;

public interface SystemRepo extends GroupRepo<Syst> {
    Syst findByName(String name);
}
