package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import lombok.AllArgsConstructor;
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
        else if(cats.size() == 1) return cats.getFirst();
        else throw new RuntimeException("2 or more categories found with name: " + name );
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
    public void saveValueIfNew(Value value, String category) {
        Category cat = getCategoryByName(category);

        if (!cat.containsValue(value.getName())) {
            bindCategoryAndValue(cat,value);
        }
    }

    @Override
    public void saveValueIfNew(Value value) {
        Category cat = value.getCategory();
            bindCategoryAndValue(cat,value);
    }

    @Override
    public Category createIfNotFound(String name) {
        List<Category> entities = getByName(name);
        if (entities == null || entities.isEmpty()) {
            Category entity = getEntity();
            entity.setName(name);
            save(entity);
            return entity;
        }
        if (entities.size() == 1) return entities.getFirst();
        else throw new RuntimeException();
    }

    @Override
    public Set<Value> getValuesOfCat(String category) {
        return getCategoryByName(category).getValues();
    }

    @Override
    public void bindCategoryAndValue(Category cat, Value val) {
        cat.updateValues(val);
        val.setCategory(cat);
        save(cat);
        valueService.save(val);
    }
}
