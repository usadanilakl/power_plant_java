package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ValueMapper implements BaseMapper {
    private final ValueRepo valueRepo;
    private final CategoryRepo categoryRepo;
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public ValueDto convertToDto(Value entity){
        if(entity==null) return null;
        ValueDto dto = new ValueDto();

        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setAlias(entity.getAlias());
        dto.setCategory(this.categoryToDto(entity.getCategory()));

        return dto;
    }

    public Value convertToEntity(ValueDto dto){
        if(dto==null)return null;
        Value entity = null;
        if(dto.getId()!=null && dto.getId()!=0) entity = valueRepo.findById(dto.getId()).orElse(new Value());
        if(entity==null) entity = new Value();
        if(dto.getName()!=null) entity.setName(dto.getName());
        if(dto.getAlias()!=null) entity.setAlias(dto.getAlias());
        if(dto.getCategory()!=null && dto.getCategory().getId()!=null) entity.setCategory(categoryRepo.findById(dto.getCategory().getId()).orElse(null));
        return entity;
    }

    private CategoryDto categoryToDto(Category entity){
        if(entity==null) return null;
        CategoryDto catDto = new CategoryDto();
        catDto.setId(entity.getId());
        catDto.setName(entity.getName());
        catDto.setAlias(entity.getAlias());
        return catDto;
    }


}
