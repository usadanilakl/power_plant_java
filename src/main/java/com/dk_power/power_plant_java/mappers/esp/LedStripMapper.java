package com.dk_power.power_plant_java.mappers.esp;

import com.dk_power.power_plant_java.dto.esp.EspDeviceDto;
import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.esp.EspDeviceService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class LedStripMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final EspDeviceService espDeviceService;

    public LedStripMapper(ModelMapper modelMapper,
                          @Lazy EspDeviceService espDeviceService) {
        this.modelMapper = modelMapper;
        this.espDeviceService = espDeviceService;
    }

    /**
     * Converts LedStrip entity to LedStripDto with full object references
     */
    public LedStripDto convertToDto(LedStrip entity) {
        if (entity == null) {
            return null;
        }

        LedStripDto dto = new LedStripDto();

        if (entity.getId() != null) {
            dto.setId(entity.getId());
        }

        if (entity.getStripNumber() != null) {
            dto.setStripNumber(entity.getStripNumber());
        }

        if (entity.getGpioPin() != null) {
            dto.setGpioPin(entity.getGpioPin());
        }

        if (entity.getTotalLeds() != null) {
            dto.setTotalLeds(entity.getTotalLeds());
        }

        if (entity.getDescription() != null) {
            dto.setDescription(entity.getDescription());
        }

        // Map ESP Device with full object
        if (entity.getEspDevice() != null) {
            dto.setEspDeviceId(entity.getEspDevice().getId());
            EspDeviceDto espDeviceDto = new EspDeviceDto();
            espDeviceDto.setId(entity.getEspDevice().getId());
            espDeviceDto.setName(entity.getEspDevice().getName());
            espDeviceDto.setIpAddress(entity.getEspDevice().getIpAddress());
            espDeviceDto.setIsActive(entity.getEspDevice().getIsActive());
            dto.setEspDevice(espDeviceDto);
        }

        return dto;
    }

    /**
     * Converts LedStrip entity to LedStripDto with ID references only
     */
    public LedStripDto convertToDtoLight(LedStrip entity) {
        if (entity == null) {
            return null;
        }

        LedStripDto dto = new LedStripDto();

        if (entity.getId() != null) {
            dto.setId(entity.getId());
        }

        if (entity.getStripNumber() != null) {
            dto.setStripNumber(entity.getStripNumber());
        }

        if (entity.getGpioPin() != null) {
            dto.setGpioPin(entity.getGpioPin());
        }

        if (entity.getTotalLeds() != null) {
            dto.setTotalLeds(entity.getTotalLeds());
        }

        if (entity.getDescription() != null) {
            dto.setDescription(entity.getDescription());
        }

        // Map ESP Device ID only
        if (entity.getEspDevice() != null) {
            dto.setEspDeviceId(entity.getEspDevice().getId());
        }

        return dto;
    }

    /**
     * Converts LedStripDto to LedStrip entity
     */
    public LedStrip convertToEntity(LedStripDto source) {
        if (source == null) {
            return null;
        }

        LedStrip entity = new LedStrip();

        if (source.getId() != null) {
            entity.setId(source.getId());
        }

        if (source.getStripNumber() != null) {
            entity.setStripNumber(source.getStripNumber());
        }

        if (source.getGpioPin() != null) {
            entity.setGpioPin(source.getGpioPin());
        }

        if (source.getTotalLeds() != null) {
            entity.setTotalLeds(source.getTotalLeds());
        }

        if (source.getDescription() != null) {
            entity.setDescription(source.getDescription());
        }

        // Map ESP Device from DTO object
        if (source.getEspDevice() != null) {
            entity.setEspDevice(espDeviceService.getEntityById(source.getEspDevice().getId()));
        } else if (source.getEspDeviceId() != null) {
            entity.setEspDevice(espDeviceService.getEntityById(source.getEspDeviceId()));
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}