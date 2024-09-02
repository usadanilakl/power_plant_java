package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.apache.commons.lang3.Streams.stream;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepo categoryRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final ValueService valueService;
    private final LotoPointService lotoPointService;

    public CategoryServiceImpl(CategoryRepo categoryRepo, UniversalMapper universalMapper, SessionFactory sessionFactory, @Lazy ValueService valueService, LotoPointService lotoPointService) {
        this.categoryRepo = categoryRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
        this.valueService = valueService;
        this.lotoPointService = lotoPointService;
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
    public Set<ValueDto> getVendors() {
        return valueService.convertAllToDto(getCategoryByName("Vendor").getValues()) ;
    }

    @Override
    public Set<ValueDto> getLocations() {
        return valueService.convertAllToDto(getCategoryByName("Location").getValues());
    }

    @Override
    public Set<ValueDto> getEqTypes() {
        Set<Value> equipment = getCategoryByName("Equipment Type").getValues();
        return valueService.convertAllToDto(equipment);
    }

    @Override
    public Set<ValueDto> getSystems() {
        Set<Value> systems = getCategoryByName("System").getValues();
        return valueService.convertAllToDto(systems);
    }

    @Override
    public Set<ValueDto> getFileTypes() {
        Set<Value> fileTypes = getCategoryByName("File Type").getValues();
        return valueService.convertAllToDto(fileTypes);
    }

    @Override
    public Set<ValueDto> getNormPositions() {
        Set<Value> normalPosition = getCategoryByName("Normal Position").getValues();
        return valueService.convertAllToDto(normalPosition);

    }

    @Override
    public void refractorNormPosValue(String oldValue, String newValue) {
        ValueDto oldVal = valueService.getValueFromCategory("Normal Position", oldValue);
        ValueDto newVal = valueService.getValueFromCategory("Normal Position", newValue);
        List<LotoPoint> lotoPoints = lotoPointService.getByNormPos(valueService.convertToEntity(oldVal));
        for (LotoPoint l : lotoPoints) {
            l.setNormPos(valueService.convertToEntity(newVal));
            lotoPointService.save(l);
        }
    }

    @Override
    public Set<ValueDto> getIsoPositions() {
        Set<Value> isoPosition = getCategoryByName("Isolated Position").getValues();
        return valueService.convertAllToDto(isoPosition);
    }

    @Override
    public void refractorIsoPosValue(String oldValue, String newValue) {
        Value oldVal = valueService.convertToEntity(valueService.getValueFromCategory("Normal Position", oldValue));
        Value newVal = valueService.convertToEntity(valueService.getValueFromCategory("Normal Position", newValue));
        List<LotoPoint> lotoPoints = lotoPointService.getByIsoPos(oldVal);
        for (LotoPoint l : lotoPoints) {
            l.setNormPos(newVal);
            lotoPointService.save(l);
        }
    }

    @Override
    public Set<ValueDto> getValuesOfCat(String category) {
        Set<Value> values = getCategoryByName(category).getValues();
        return valueService.convertAllToDto(values);
    }

    @Override
    public Set<ValueDto> getVAluesOfCatWithAlias(String category) {
        Set<Value> values = getByAlias(category).getValues();
        return valueService.convertAllToDto(values);
    }

    @Override
    public Category getByAlias(String alias) {
        return categoryRepo.findByAlias(alias) ;
    }
}

