package com.dk_power.power_plant_java.mappers.forms;

import com.dk_power.power_plant_java.dto.forms.PrintableFormDto;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PrintableFormMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public PrintableFormDto convertToDto(PrintableForm entity) {
        if (entity == null) {
            return null;
        }
        return modelMapper.map(entity, PrintableFormDto.class);
    }

    public PrintableForm convertToEntity(PrintableFormDto dto) {
        if (dto == null) {
            return null;
        }
        return modelMapper.map(dto, PrintableForm.class);
    }
}
