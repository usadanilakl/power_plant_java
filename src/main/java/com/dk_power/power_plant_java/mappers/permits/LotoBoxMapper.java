package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoBoxDto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

@Component
public class LotoBoxMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final LotoService lotoService;
    private final NgLotoBoxService lotoBoxService;

    public LotoBoxMapper(ModelMapper modelMapper, 
                         @Lazy ValueService valueService, 
                         @Lazy LotoService lotoService, 
                         @Lazy NgLotoBoxService lotoBoxService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.lotoService = lotoService;
        this.lotoBoxService = lotoBoxService;
    }

    public LotoBoxDto convertToDto(LotoBox entity) {
        LotoBoxDto dto = new LotoBoxDto();
        
        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        if (entity.getLotoAccessoryStatus() != null) {
            dto.setLotoAccessoryStatus(valueService.getDtoById(entity.getLotoAccessoryStatus().getId()));
        }

        // Add any additional fields specific to LotoBox

        return dto;
    }

    public LotoBoxDto convertToDtoLight(LotoBox entity) {
        LotoBoxDto dto = new LotoBoxDto();
        
        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        // Add only essential fields for a light version

        return dto;
    }

    public LotoBox convertToEntity(LotoBoxDto source) {
        LotoBox entity = null;
        if (source.getId() != null) {
            entity = lotoBoxService.getEntityById(source.getId());
        }
        if (entity == null) {
            entity = new LotoBox();
        }

        if (source.getNumber() != null) {
            entity.setNumber(source.getNumber());
        }

        if (source.getLotoAccessoryStatus() != null) {
            if (source.getLotoAccessoryStatus().getId() == null) {
                ValueDto lotoAccessoryStatus = valueService.getValueFromCategory("LotoAccessoryStatus", source.getLotoAccessoryStatus().getName());
                entity.setLotoAccessoryStatus(valueService.convertToEntity(lotoAccessoryStatus)  );
            } else {
                entity.setLotoAccessoryStatus(valueService.getEntityById(source.getLotoAccessoryStatus().getId()));
            }
        }

        // Add any additional fields specific to LotoBox

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}