package com.dk_power.power_plant_java.sevice.plant;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities.plant.Group;

import java.util.List;

public interface GroupService <T extends Group>{
    List<T> getAll();
    T getById(Long id);
    T save(T entity);
    T createNew(String name , Class<T> groupType);

    BoxDto getDtoById(Long l);
}
