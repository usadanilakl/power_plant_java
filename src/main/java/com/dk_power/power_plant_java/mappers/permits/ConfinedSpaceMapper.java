package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConfinedSpaceMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    public ConfinedSpaceDto convertToDto(ConfinedSpace entity) {
        if (entity == null) return null;

        ConfinedSpaceDto dto = new ConfinedSpaceDto();

        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setSpace(entity.getSpace());
        dto.setWorkScope(entity.getWorkScope());
        dto.setIssuedTo(entity.getIssuedTo());
        dto.setDuration(entity.getDuration());
        dto.setMeterModel(entity.getMeterModel());
        dto.setMeterNum(entity.getMeterNum());
        dto.setCalibrated(entity.isCalibrated());

        try {
            dto.setHazards(entity.getHazards());
            dto.setPpe(entity.getPpe());
            dto.setPrecautions(entity.getPrecautions());
        } catch (Exception e) {
            // handle or log
        }
        return dto;
    }

    public ConfinedSpace convertToEntity(ConfinedSpaceDto dto) {
        if (dto == null) return null;

        ConfinedSpace entity = new ConfinedSpace();

        entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setSpace(dto.getSpace());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIssuedTo(dto.getIssuedTo());
        entity.setDuration(dto.getDuration());
        entity.setMeterModel(dto.getMeterModel());
        entity.setMeterNum(dto.getMeterNum());
        entity.setCalibrated(dto.isCalibrated());

        try {
            entity.setHazards(dto.getHazards());
            entity.setPpe(dto.getPpe());
            entity.setPrecautions(dto.getPrecautions());
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
