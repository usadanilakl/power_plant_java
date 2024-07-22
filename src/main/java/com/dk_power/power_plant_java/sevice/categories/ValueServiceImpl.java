package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@AllArgsConstructor
@Transactional
public class ValueServiceImpl implements ValueService{
    private final ValueRepo valueRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
    private final LotoPointService lotoPointService;
    @Override
    public Value getEntity() {
        return new Value();
    }

    @Override
    public ValueDto getDto() {
        return new ValueDto();
    }

    @Override
    public ValueRepo getRepo() {
        return valueRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
    @Override
    public Value valueSetup(String cat, String val){
        Category category = categoryService.getCategoryByName(cat);
        if(category==null) category = new Category(cat);
        Value value = category.getValueByName(val);
        if(value!=null) return value;
        else{
            value = new Value(val);
            value.setCategory(category);
            category.addValue(value);
            save(value);
            categoryService.save(category);
        }
        return value;
    }

    @Override
    public Value valueSetupWithAlias(String cat, String val) {
        Category category = categoryService.getByAlias(cat);
        if(category==null) category = new Category(cat);
        Value value = category.getValueByName(val);
        if(value!=null) return value;
        else{
            value = new Value(val);
            value.setCategory(category);
            category.addValue(value);
            save(value);
            categoryService.save(category);
        }
        return value;
    }

    @Override
    public ValueDto getValueFromCategory(String cat, String val) {
        Set<ValueDto> valuesOfCat = categoryService.getValuesOfCat(cat);
        Optional<ValueDto> first = valuesOfCat.stream().filter(e -> e.getName().equals(val)).findFirst();
        return  first.orElse(null);
    }


    public List<LotoPointDto> deleteValue(Value entity) {
        List<LotoPoint> byIsoPos = lotoPointService.getByIsoPos(entity);
        List<LotoPointDto> lotoPointDtos =(List) lotoPointService.convertAllToDto(byIsoPos);
        if(byIsoPos.isEmpty()) {
            hardDelete(entity);
            return lotoPointDtos;
        }else {
            return lotoPointDtos;
        }
    }



    public void refractorIsoPosValue(Value old, Value _new){
        for (LotoPoint i : lotoPointService.getByIsoPos(old)) {
            i.setIsoPos(_new);
            lotoPointService.save(i);
        }
    }
}
