package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceLogDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpaceLog;
import org.springframework.stereotype.Component;

@Component
public class ConfinedSpaceLogMapper {

    public ConfinedSpaceLogDto toDto(ConfinedSpaceLog entity) {
        if (entity == null) {
            return null;
        }

        ConfinedSpaceLogDto dto = new ConfinedSpaceLogDto();
        dto.setId(entity.getId());
        dto.setSharepointId(entity.getSharepointId());
        dto.setSpace(entity.getSpace());
        dto.setStatus(entity.getStatus());
        dto.setCo(entity.getCo());
        dto.setOxygen(entity.getOxygen());
        dto.setLel(entity.getLel());
        dto.setH2s(entity.getH2s());
        dto.setNh3(entity.getNh3());
        dto.setTesterName(entity.getTesterName());
        dto.setLastStatusChange(entity.getLastStatusChange());
        dto.setMeterSerialNumber(entity.getMeterSerialNumber());

        return dto;
    }

    public ConfinedSpaceLog toEntity(ConfinedSpaceLogDto dto) {
        if (dto == null) {
            return null;
        }

        ConfinedSpaceLog entity = new ConfinedSpaceLog();
        entity.setId(dto.getId());
        entity.setSharepointId(dto.getSharepointId());
        entity.setSpace(dto.getSpace());
        entity.setStatus(dto.getStatus());
        entity.setCo(dto.getCo());
        entity.setOxygen(dto.getOxygen());
        entity.setLel(dto.getLel());
        entity.setH2s(dto.getH2s());
        entity.setNh3(dto.getNh3());
        entity.setTesterName(dto.getTesterName());
        entity.setLastStatusChange(dto.getLastStatusChange());
        entity.setMeterSerialNumber(dto.getMeterSerialNumber());

        return entity;
    }
}