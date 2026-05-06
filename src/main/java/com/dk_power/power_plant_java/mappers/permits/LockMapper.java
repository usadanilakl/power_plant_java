package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LockDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLockService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class LockMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final LotoService lotoService;
    private final NgLockService lockService;

    public LockMapper(ModelMapper modelMapper,
                      @Lazy ValueService valueService,
                      @Lazy LotoService lotoService,
                      @Lazy NgLockService lockService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.lotoService = lotoService;
        this.lockService = lockService;
    }

    public LockDto convertToDto(Lock entity) {
        LockDto dto = new LockDto();

        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        if (entity.getLotoAccessoryStatus() != null) {
            dto.setLotoAccessoryStatus(valueService.getDtoById(entity.getLotoAccessoryStatus().getId()));
        }

        dto.setTagLabel(entity.getTagLabel());
        dto.setAssignedLotoPointId(entity.getAssignedLotoPointId());
        dto.setLockType(entity.getLockType());
        dto.setHomeBoxNumber(entity.getHomeBoxNumber());
        dto.setIsSingleLock(entity.getIsSingleLock());

        if (entity.getLoto() != null) {
            dto.setLotoId(entity.getLoto().getId());
            dto.setLotoPermitNumber(entity.getLoto().getPermitNumber());
            dto.setLotoDocNum(entity.getLoto().getDocNum());
        }

        return dto;
    }

    public LockDto convertToDtoLight(Lock entity) {
        LockDto dto = new LockDto();
        
        dto.setId(entity.getId());

        if (entity.getNumber() != null) {
            dto.setNumber(entity.getNumber());
        }

        // Add only essential fields for a light version

        return dto;
    }

    public Lock convertToEntity(LockDto source) {
        Lock entity = null;
        if (source.getId() != null) {
            entity = lockService.getEntityById(source.getId());
        }
        if (entity == null) {
            entity = new Lock();
        }

        if (source.getNumber() != null) {
            entity.setNumber(source.getNumber());
        }

        if (source.getLotoAccessoryStatus() != null) {
            if (source.getLotoAccessoryStatus().getId() == null) {
                ValueDto lockStatus = valueService.getValueFromCategory("LockStatus", source.getLotoAccessoryStatus().getName());
                entity.setLotoAccessoryStatus(valueService.convertToEntity(lockStatus));
            } else {
                entity.setLotoAccessoryStatus(valueService.getEntityById(source.getLotoAccessoryStatus().getId()));
            }
        }

        if (source.getTagLabel() != null) entity.setTagLabel(source.getTagLabel());
        if (source.getAssignedLotoPointId() != null) entity.setAssignedLotoPointId(source.getAssignedLotoPointId());
        if (source.getLockType() != null) entity.setLockType(source.getLockType());
        if (source.getHomeBoxNumber() != null) entity.setHomeBoxNumber(source.getHomeBoxNumber());
        if (source.getIsSingleLock() != null) entity.setIsSingleLock(source.getIsSingleLock());

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}