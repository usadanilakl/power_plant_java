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
    public Value saveIfNew(String valName, String catName) {
        List<Value> values = valueRepo.findByName(valName);
        Value val = null;
        Category cat = categoryService.getCategoryByName(catName);
        if(values!=null){
            for (Value v : values) {
                if(cat.getName().trim().equalsIgnoreCase(catName.trim().toLowerCase())) val = v;
            }
        }

        if(val==null){
            val = new Value();
            val.setName(valName);
        }
        categoryService.saveValueIfNew(val, cat.getName());
        return save(val);
    }
}
