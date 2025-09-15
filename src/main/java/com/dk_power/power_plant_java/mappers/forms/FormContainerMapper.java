package com.dk_power.power_plant_java.mappers.forms;

import com.dk_power.power_plant_java.dto.forms.FormContainerDto;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FormContainerMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public FormContainerDto convertToDto(FormContainer entity) {
        if (entity == null) {
            return null;
        }
        return modelMapper.map(entity, FormContainerDto.class);
    }

    public FormContainer convertToEntity(FormContainerDto dto) {
        if (dto == null) {
            return null;
        }
        return modelMapper.map(dto, FormContainer.class);
    }
}