package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.rmi.server.UnicastRemoteObject;

public interface ValueService extends CrudService<Value, ValueDto, ValueRepo, UniversalMapper> {
    Value saveIfNew(String valName, String catName);
}
