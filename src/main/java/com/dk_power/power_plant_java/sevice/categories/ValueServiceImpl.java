package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
@Transactional
public class ValueServiceImpl implements ValueService{
    private final ValueRepo valueRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
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
    public Value saveIfNewAndBindWithCategory (String valName, String catName) {
        Category cat = categoryService.createIfNotFound(catName);
        Set<Value> values = cat.getValues();
        Value val = null;
        if(!(values==null || values.isEmpty())){
            for (Value v : values) {
                if(cat.getName().trim().equalsIgnoreCase(catName.trim().toLowerCase())) val = v;
            }
        }

        if(val==null){
            val = new Value();
            val.setName(valName);
        }
        categoryService.bindCategoryAndValue(cat, val);
        return val;
    }

}
