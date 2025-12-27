package com.dk_power.power_plant_java.mappers.esp;

import com.dk_power.power_plant_java.dto.esp.EspDeviceDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.esp.EspDeviceService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class EspDeviceMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final EspDeviceService espDeviceService;

    public EspDeviceMapper(ModelMapper modelMapper,
                           @Lazy EspDeviceService espDeviceService) {
        this.modelMapper = modelMapper;
        this.espDeviceService = espDeviceService;
    }

    /**
     * Converts EspDevice entity to EspDeviceDto
     */
    public EspDeviceDto convertToDto(EspDevice entity) {
        if (entity == null) {
            return null;
        }

        EspDeviceDto dto = new EspDeviceDto();

        if (entity.getId() != null) {
            dto.setId(entity.getId());
        }

        if (entity.getIpAddress() != null) {
            dto.setIpAddress(entity.getIpAddress());
        }

        if (entity.getName() != null) {
            dto.setName(entity.getName());
        }

        if (entity.getIsActive() != null) {
            dto.setIsActive(entity.getIsActive());
        }

        if (entity.getDescription() != null) {
            dto.setDescription(entity.getDescription());
        }

        if (entity.getPinSequence()!=null) {
            dto.setPinSequence(entity.getPinSequence().stream().map(String::trim).collect(Collectors.toSet()));
        }

        return dto;
    }

    /**
     * Converts EspDeviceDto to EspDevice entity
     */
    public EspDevice convertToEntity(EspDeviceDto source) {
        if (source == null) {
            return null;
        }

        EspDevice entity;
        if (source.getId() != null && source.getId() != 0) {
            entity = espDeviceService.getEntityById(source.getId());
            if (entity == null) {
                entity = new EspDevice();
            }
        } else {
            entity = new EspDevice();
        }

        if (source.getIpAddress() != null) {
            entity.setIpAddress(source.getIpAddress());
        }

        if (source.getName() != null) {
            entity.setName(source.getName());
        }

        if (source.getIsActive() != null) {
            entity.setIsActive(source.getIsActive());
        }

        if (source.getDescription() != null) {
            entity.setDescription(source.getDescription());
        }

        if (source.getPinSequence()!=null) {
            entity.setPinSequence(source.getPinSequence().stream().map(String::trim).collect(Collectors.toSet()));
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}