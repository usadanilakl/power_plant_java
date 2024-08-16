package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
//@AllArgsConstructor
@Transactional
public class ValueServiceImpl implements ValueService{
    private final ValueRepo valueRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
    private final LotoPointService lotoPointService;
    private final EquipmentService equipmentService;
    private final FileService fileService;

    public ValueServiceImpl(ValueRepo valueRepo, UniversalMapper universalMapper, SessionFactory sessionFactory, CategoryService categoryService, @Lazy LotoPointService lotoPointService, @Lazy EquipmentService equipmentService, @Lazy FileService fileService) {
        this.valueRepo = valueRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
        this.categoryService = categoryService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
        this.fileService = fileService;
    }

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

    public Collection<BaseDto> delVal(Value entity) {
        Collection<LotoPointDto> lotoPoints = lotoPointService.convertAllToDto(lotoPointService.getByValue(entity));
        Collection<EquipmentDto> equipment = equipmentService.convertAllToDto(equipmentService.getByValue(entity));
        Collection<FileDto> files = fileService.convertAllToDto(fileService.getByValue(entity));

        List<BaseDto> all = new ArrayList<>(lotoPoints);
        all.addAll(equipment);
        all.addAll(files);

        if(all.isEmpty()) {
            hardDelete(entity);
            return all;
        }else {
            return all;
        }
    }


    @Override
    public void refactor(Value old, Value _new) {
        equipmentService.refactor(old,_new);
        fileService.refactor(old,_new);
        lotoPointService.refactor(old,_new);
    }
}
