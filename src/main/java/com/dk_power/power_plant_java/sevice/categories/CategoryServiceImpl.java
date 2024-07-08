package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CategoryServiceImpl implements CategoryService{
    private final CategoryRepo categoryRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final ValueService valueService;
    @Override
    public Category getEntity() {
        return new Category();
    }

    @Override
    public CategoryDto getDto() {
        return new CategoryDto();
    }

    @Override
    public CategoryRepo getRepo() {
        return categoryRepo;
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
    public Category getCategoryByName(String name) {
        Category cat = categoryRepo.findByName(name);
        if(cat==null){
            cat = new Category();
            cat.setName(name);
            save(cat);
        }
        return cat;
    }

    @Override
    public Category getVendors() {
        return getCategoryByName("Vendor");
    }

    @Override
    public Category getLocations() {
        return getCategoryByName("Location");
    }

    @Override
    public Category getEqTypes() {
        return getCategoryByName("Equipment Type");
    }

    @Override
    public Category getSystems() {
        return getCategoryByName("System");
    }

    @Override
    public Category getFileTypes() {
        return getCategoryByName("File Type");
    }

    @Override
    public void saveValueIfNew(Value value,String name) {
        Category cat = getCategoryByName(name);

        if(!cat.containsValue(value.getName())){
            cat.setValues(value);
            save(cat);
        }
    }
}
