package com.dk_power.power_plant_java.mappers.permits.loto_box;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.permits.LockMapper;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.esp.LedStripService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class LotoBoxMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final NgValueService valueService;
    private final LotoService lotoService;
    private final NgLotoBoxService lotoBoxService;
    private final LedStripService ledStripService;
    private final LockRepo lockRepo;
    private final LockMapper lockMapper;

    public LotoBoxMapper(ModelMapper modelMapper,
                         @Lazy NgValueService valueService,
                         @Lazy LotoService lotoService,
                         @Lazy NgLotoBoxService lotoBoxService,
                         @Lazy LedStripService ledStripService,
                         LockRepo lockRepo,
                         @Lazy LockMapper lockMapper) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.lotoService = lotoService;
        this.lotoBoxService = lotoBoxService;
        this.ledStripService = ledStripService;
        this.lockRepo = lockRepo;
        this.lockMapper = lockMapper;
    }

    public LotoBoxDto convertToDto(LotoBox entity) {
        LotoBoxDto dto = new LotoBoxDto();
        
        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        // Map LED Strip
        if (entity.getLedStrip() != null) {
            LedStripDto ledStripDto = new LedStripDto();
            ledStripDto.setId(entity.getLedStrip().getId());
            ledStripDto.setStripNumber(entity.getLedStrip().getStripNumber());
            ledStripDto.setGpioPin(entity.getLedStrip().getGpioPin());
            ledStripDto.setTotalLeds(entity.getLedStrip().getTotalLeds());
            dto.setLedStrip(ledStripDto);
            dto.setLedStripId(entity.getLedStrip().getId());
        }

        // Map LED range
        if (entity.getRangeStart() != null) {
            dto.setRangeStart(entity.getRangeStart());
        }

        if (entity.getRangeEnd() != null) {
            dto.setRangeEnd(entity.getRangeEnd());
        }

        // Map Loto Status (determines LED color)
        if (entity.getLotoAccessoryStatus() != null) {
            dto.setLotoAccessoryStatus(valueService.valueToDto(entity.getLotoAccessoryStatus()));
        }

        if (entity.getDescription() != null) {
            dto.setDescription(entity.getDescription());
        }

        // Map LED color state
        dto.setR(entity.getR());
        dto.setG(entity.getG());
        dto.setB(entity.getB());
        dto.setBrightness(entity.getBrightness());

        dto.setSetSize(entity.getSetSize() != null ? entity.getSetSize() : 0);
        dto.setActive(entity.getActive() != null ? entity.getActive() : Boolean.TRUE);
        dto.setPortable(entity.getPortable() != null ? entity.getPortable() : Boolean.FALSE);
        dto.setManualOverride(entity.getManualOverride() != null ? entity.getManualOverride() : Boolean.FALSE);

        if (entity.getNumber() != null) {
            dto.setHomeLocks(
                    lockRepo.findByHomeBoxNumber(entity.getNumber()).stream()
                            .map(lockMapper::convertToDto)
                            .toList()
            );
        }

        if (entity.getLoto() != null) {
            com.dk_power.power_plant_java.entities.loto.Loto lotoEnt = entity.getLoto();
            dto.setLotoId(lotoEnt.getId());
            dto.setLotoPermitNumber(lotoEnt.getPermitNumber());
            dto.setLotoEquipmentSystem(lotoEnt.getEquipmentSystem());
            dto.setLotoWorkScope(lotoEnt.getWorkScope());
            dto.setLotoRedTagNum(lotoEnt.getRedTagNum());
            if (lotoEnt.getPermitStatus() != null) {
                dto.setLotoStatus(lotoEnt.getPermitStatus().getName());
            }
        }

        return dto;
    }

    public LotoBoxDto convertToDtoLight(LotoBox entity) {
        LotoBoxDto dto = new LotoBoxDto();
        
        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        // Map LED range for light version
        if (entity.getRangeStart() != null) {
            dto.setRangeStart(entity.getRangeStart());
        }

        if (entity.getRangeEnd() != null) {
            dto.setRangeEnd(entity.getRangeEnd());
        }

        // Map Loto Status for light version
        if (entity.getLotoAccessoryStatus() != null) {
            dto.setLotoAccessoryStatus(valueService.valueToDto(entity.getLotoAccessoryStatus()));
        }

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

        // Map LED Strip
        if (source.getLedStripId() != null) {
            entity.setLedStrip(ledStripService.getEntityById(source.getLedStripId()));
        } else if (source.getLedStrip() != null && source.getLedStrip().getId() != null) {
            entity.setLedStrip(ledStripService.getEntityById(source.getLedStrip().getId()));
        }

        // Map LED range
        if (source.getRangeStart() != null) {
            entity.setRangeStart(source.getRangeStart());
        }

        if (source.getRangeEnd() != null) {
            entity.setRangeEnd(source.getRangeEnd());
        }

        // Map Loto Status (determines LED color)
        if (source.getLotoAccessoryStatus() != null) {
            if (source.getLotoAccessoryStatus().getId() == null) {
                Value lotoStatus = valueService.getValuesByCategory("LotoStatus").stream()
                        .filter(value -> value.getName().equals(source.getLotoAccessoryStatus().getName()))
                       .findFirst()
                        .orElse(null);
                entity.setLotoAccessoryStatus(lotoStatus);
            } else {
                entity.setLotoAccessoryStatus(valueService.getValueById(source.getLotoAccessoryStatus().getId()).orElseThrow(() -> new RuntimeException("Loto Status not found")));
            }
        }

        if (source.getDescription() != null) {
            entity.setDescription(source.getDescription());
        }

        if (source.getSetSize() != null) {
            entity.setSetSize(source.getSetSize());
        }
        if (source.getActive() != null) {
            entity.setActive(source.getActive());
        }
        if (source.getPortable() != null) {
            entity.setPortable(source.getPortable());
        }
        if (source.getManualOverride() != null) {
            entity.setManualOverride(source.getManualOverride());
        }

        // Map LED color state
        if (source.getR() != null) {
            entity.setR(source.getR());
        }
        if (source.getG() != null) {
            entity.setG(source.getG());
        }
        if (source.getB() != null) {
            entity.setB(source.getB());
        }
        if (source.getBrightness() != null) {
            entity.setBrightness(source.getBrightness());
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}