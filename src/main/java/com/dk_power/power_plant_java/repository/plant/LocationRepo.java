package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.plant.Location;

public interface LocationRepo extends GroupRepo<Location> {
    Location findByName(String name);
}
