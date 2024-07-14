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

}
