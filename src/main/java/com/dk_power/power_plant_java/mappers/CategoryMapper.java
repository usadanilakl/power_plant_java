package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CategoryMapper implements BaseMapper {
    private final CategoryRepo categoryRepo;
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public CategoryDto convertToDto(Category entity) {
        if (entity == null) return null;
        CategoryDto dto = new CategoryDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setAlias(entity.getAlias());
        return dto;
    }

    public Category convertToEntity(CategoryDto dto) {
        if (dto == null) return null;
        Category entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = categoryRepo.findById(dto.getId()).orElse(new Category());
        }
        if (entity == null) entity = new Category();
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getAlias() != null) entity.setAlias(dto.getAlias());
        return entity;
    }
}
