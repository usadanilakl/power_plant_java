package com.dk_power.power_plant_java.mappers.instrumentation;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentLogDto;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InstrumentLogMapper {

    public InstrumentLogDto convertToDto(InstrumentLog entity) {
        if (entity == null) return null;
        InstrumentLogDto dto = new InstrumentLogDto();
        dto.setId(entity.getId());
        dto.setInstrumentTagNumber(entity.getInstrumentTagNumber());
        dto.setInstrumentDescription(entity.getInstrumentDescription());
        dto.setStatus(entity.getStatus());
        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setName(entity.getName());
        dto.setComment(entity.getComment());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        return dto;
    }

    public InstrumentLog fromPwaDto(PwaInstrumentLogDto dto) {
        if (dto == null) return null;
        InstrumentLog entity = new InstrumentLog();
        entity.setInstrumentTagNumber(dto.getInstrumentTagNumber());
        entity.setInstrumentDescription(dto.getInstrumentDescription());
        entity.setStatus(dto.getStatus());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setName(dto.getName());
        entity.setComment(dto.getComment());
        entity.setLocalUuid(dto.getLocalUuid());
        return entity;
    }

    public InstrumentLog fromSharePointDto(InstrumentLogDto dto) {
        if (dto == null) return null;
        InstrumentLog entity = new InstrumentLog();
        entity.setInstrumentTagNumber(dto.getInstrumentTagNumber());
        entity.setInstrumentDescription(dto.getInstrumentDescription());
        entity.setStatus(dto.getStatus());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setName(dto.getName());
        entity.setComment(dto.getComment());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        return entity;
    }
}
