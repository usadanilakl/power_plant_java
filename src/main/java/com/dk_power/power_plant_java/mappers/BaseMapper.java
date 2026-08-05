package com.dk_power.power_plant_java.mappers;

import org.apache.poi.ss.formula.functions.T;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;

public interface BaseMapper {
    ModelMapper getMapper();

    default  <T> T convert(Object objectToBeConverted, T convertedObject) {
        getMapper().getConfiguration().setSkipNullEnabled(true);
        return getMapper().map(objectToBeConverted, (Type) convertedObject.getClass());
    }

    /**
     * Copy the scalar fields every entity inherits, so a hand-written {@code convertToDto} does not
     * silently return a thinner object than the generic ModelMapper did.
     *
     * <p>This matters because {@code NgCrudService.toDto} now routes through the hand mappers to
     * give get-by-id and get-all the SAME shape. Without this, that consistency was achieved by
     * dropping 17-23 fields per permit — audit stamps, the permit number, sync bookkeeping — from
     * every get-by-id response.
     *
     * <p>Relations ({@code system}, {@code requestor}, {@code controlAuthority}, {@code permitType},
     * {@code equipment}, {@code workArea}, {@code permitStatus}) are deliberately NOT copied here:
     * they need their own mappers and each caller already handles the ones it cares about.
     */
    default void copyBaseFields(com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity entity,
                                com.dk_power.power_plant_java.dto.base_dtos.BaseDto dto) {
        if (entity == null || dto == null) return;
        if (dto.getId() == null) dto.setId(entity.getId());
        dto.setDeleted(entity.getDeleted());
        dto.setIsVerified(entity.getIsVerified());
        if (dto.getName() == null) dto.setName(entity.getName());
        dto.setNote(entity.getNote());
        dto.setObjectType(entity.getObjectType());
        dto.setDataServiceItemId(entity.getDataServiceItemId());
        dto.setRefactorNotes(entity.getRefactorNotes());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());
        if (entity instanceof com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity a) {
            dto.setCreatedBy(a.getCreatedBy());
        }
        if (entity instanceof com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity pe
                && dto instanceof com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto pd) {
            if (pd.getWorkScope() == null) pd.setWorkScope(pe.getWorkScope());
            pd.setDocNum(pe.getDocNum());
            pd.setTemp(pe.getTemp());
            if (pd.getRedTagNum() == null) pd.setRedTagNum(pe.getRedTagNum());
            if (pd.getPermitNumber() == null) pd.setPermitNumber(pe.getPermitNumber());
            pd.setSharepointId(pe.getSharepointId());
            pd.setSpModifiedTime(pe.getSpModifiedTime());
            pd.setLocalUuid(pe.getLocalUuid());
        }
    }
}
