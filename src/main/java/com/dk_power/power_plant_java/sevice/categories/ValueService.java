package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;

import java.util.Collection;
import java.util.List;

public interface ValueService extends BaseCategoryValueService<Value, ValueDto, ValueRepo, ValueMapper>, RefactorService {
    Value valueSetup(String cat, String val);
    Value valueSetupWithAlias(String catAlias, String val);
    ValueDto getValueFromCategory(String cat, String val);
    public List<LotoPointDto> deleteValue(Value entity);
    public void refractorIsoPosValue(Value old, Value _new);
    Collection<BaseDto> delVal(Value entity);

}

