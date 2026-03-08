package com.dk_power.power_plant_java.mappers.instrumentation;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InstrumentMapper {

    public InstrumentDto convertToDto(Instrument entity) {
        if (entity == null) return null;
        InstrumentDto dto = new InstrumentDto();
        dto.setId(entity.getId());
        dto.setTagNumber(entity.getTagNumber());
        dto.setDescription(entity.getDescription());
        dto.setVendor(entity.getVendor());
        dto.setLocation(entity.getLocation());
        dto.setType(entity.getType());
        dto.setCurrentStatus(entity.getCurrentStatus());
        dto.setLastUpdatedDate(entity.getLastUpdatedDate());
        dto.setLastUpdatedTime(entity.getLastUpdatedTime());
        dto.setLastUpdatedBy(entity.getLastUpdatedBy());
        dto.setLastComment(entity.getLastComment());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        return dto;
    }

    public Instrument fromSharePointDto(InstrumentDto dto) {
        if (dto == null) return null;
        Instrument entity = new Instrument();
        entity.setTagNumber(dto.getTagNumber());
        entity.setDescription(dto.getDescription());
        entity.setVendor(dto.getVendor());
        entity.setLocation(dto.getLocation());
        entity.setType(dto.getType());
        entity.setCurrentStatus(dto.getCurrentStatus());
        entity.setLastUpdatedDate(dto.getLastUpdatedDate());
        entity.setLastUpdatedTime(dto.getLastUpdatedTime());
        entity.setLastUpdatedBy(dto.getLastUpdatedBy());
        entity.setLastComment(dto.getLastComment());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        return entity;
    }
}
