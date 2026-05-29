package com.dk_power.power_plant_java.mappers.sds;

import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SdsAuditRecordMapper {

    public static final String ENTITY_TYPE = "SdsAuditRecord";

    public SdsAuditRecordDto convertToDto(SdsAuditRecord e) {
        if (e == null) return null;
        SdsAuditRecordDto dto = new SdsAuditRecordDto();
        dto.setId(e.getId());
        dto.setChemicalSharepointId(e.getChemicalSharepointId());
        dto.setChemicalLocalUuid(e.getChemicalLocalUuid());
        dto.setChemicalName(e.getChemicalName());
        dto.setAction(e.getAction());
        dto.setOldSnapshot(e.getOldSnapshot());
        dto.setAuditedByName(e.getAuditedByName());
        dto.setAuditedByEmail(e.getAuditedByEmail());
        dto.setAuditedAt(e.getAuditedAt());
        dto.setComments(e.getComments());
        dto.setCampaign(e.getCampaign());
        dto.setSharepointId(e.getSharepointId());
        dto.setLocalUuid(e.getLocalUuid());
        dto.setSpModifiedTime(e.getSpModifiedTime());
        dto.setCreatedBy(e.getCreatedBy());
        if (e.getDateCreated() != null) dto.setDateCreated(e.getDateCreated().toString());
        if (e.getDateModified() != null) dto.setDateModified(e.getDateModified().toString());
        return dto;
    }

    public List<SdsAuditRecordDto> convertToDtos(List<SdsAuditRecord> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::convertToDto).toList();
    }

    public SdsAuditRecord convertToEntity(SdsAuditRecordDto dto) {
        if (dto == null) return null;
        SdsAuditRecord e = new SdsAuditRecord();
        e.setChemicalSharepointId(dto.getChemicalSharepointId());
        e.setChemicalLocalUuid(dto.getChemicalLocalUuid());
        e.setChemicalName(dto.getChemicalName());
        e.setAction(dto.getAction());
        e.setOldSnapshot(dto.getOldSnapshot());
        e.setAuditedByName(dto.getAuditedByName());
        e.setAuditedByEmail(dto.getAuditedByEmail());
        e.setAuditedAt(dto.getAuditedAt());
        e.setComments(dto.getComments());
        e.setCampaign(dto.getCampaign());
        e.setSharepointId(dto.getSharepointId());
        e.setLocalUuid(dto.getLocalUuid());
        return e;
    }
}
