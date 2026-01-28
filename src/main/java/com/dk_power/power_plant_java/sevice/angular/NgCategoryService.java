package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.mappers.CategoryMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * NgCrudService implementation for Category entity.
 * Required for field-level sync via ServiceFacade.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgCategoryService implements NgCrudService<Category, CategoryDto, CategoryRepo, CategoryMapper> {
    private final CategoryRepo categoryRepo;
    private final CategoryMapper categoryMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public CategoryRepo getRepo() {
        return categoryRepo;
    }

    @Override
    public CategoryMapper getMapper() {
        return categoryMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public CategoryDto getDto() {
        return new CategoryDto();
    }

    @Override
    public Category getEntity() {
        return new Category();
    }

    @Override
    public Category toEntity(CategoryDto dto) {
        return categoryMapper.convertToEntity(dto);
    }

    @Override
    public CategoryDto toDto(Category entity) {
        return categoryMapper.convertToDto(entity);
    }

    @Override
    public Class<Category> getEntityClass() {
        return Category.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
