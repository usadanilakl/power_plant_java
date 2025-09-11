package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HotWorkMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    public HotWorkDto convertToDto(HotWork entity) {
        if (entity == null) return null;
        HotWorkDto dto = new HotWorkDto();

        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setForman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setMeterModel(entity.getMeterModel());
        dto.setMeterNum(entity.getMeterNum());
        dto.setSpecialInstructions(entity.getSpecialInstructions());

        try {
            dto.setMeasures(entity.getMeasures());
        } catch (Exception e) {
            // handle or log
        }
        return dto;
    }

    public HotWork convertToEntity(HotWorkDto dto) {
        if (dto == null) return null;
        HotWork entity = new HotWork();

        entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setForeman(dto.getForman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setMeterModel(dto.getMeterModel());
        entity.setMeterNum(dto.getMeterNum());
        entity.setSpecialInstructions(dto.getSpecialInstructions());

        try {
            entity.setMeasures(dto.getMeasures());
        } catch (Exception e) {
            // handle or log
        }
        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
