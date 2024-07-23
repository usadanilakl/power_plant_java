package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;

import java.util.List;

public interface RefactorService {
    void refactor(Value old, Value _new);
}
