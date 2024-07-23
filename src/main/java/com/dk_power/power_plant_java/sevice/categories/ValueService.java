package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;

import java.rmi.server.UnicastRemoteObject;
import java.util.Collection;
import java.util.List;

public interface ValueService extends BaseCategoryValueService<Value, ValueDto, ValueRepo, UniversalMapper>, RefactorService {
    Value valueSetup(String cat, String val);
    Value valueSetupWithAlias(String catAlias, String val);
    ValueDto getValueFromCategory(String cat, String val);
    public List<LotoPointDto> deleteValue(Value entity);
    public void refractorIsoPosValue(Value old, Value _new);
    Collection<BaseDto> delVal(Value entity);

}

