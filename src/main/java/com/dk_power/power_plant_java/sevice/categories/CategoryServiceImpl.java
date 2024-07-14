package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepo categoryRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final ValueService valueService;

    public CategoryServiceImpl(CategoryRepo categoryRepo, UniversalMapper universalMapper, SessionFactory sessionFactory, @Lazy ValueService valueService) {
        this.categoryRepo = categoryRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
        this.valueService = valueService;
    }

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
        List<Category> cats = getByName(name);
        if(cats==null || cats.isEmpty()) return null;
        else if(cats.size() == 1) return cats.get(0);
        else throw new RuntimeException("2 or more categories found with name: " + name );
    }

    @Override
    public Category createIfNotFound(String name) {
        Category entity = getCategoryByName(name);
        if(entity==null) entity = new Category(name);
        return entity;
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
    public Set<Value> getValuesOfCat(String category) {
        return getCategoryByName(category).getValues();
    }




}

