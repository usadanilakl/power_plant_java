package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkRequestMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    public WorkRequestDto convertToDto(WorkRequest entity) {
        if (entity == null) return null;

        WorkRequestDto dto = new WorkRequestDto();

        dto.setDateOfWorkToBePerformed(entity.getDateOfWorkToBePerformed());
        dto.setTimeOfWorkToBePerformed(entity.getTimeOfWorkToBePerformed());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setCompany(entity.getCompany());
        dto.setLocation(entity.getLocation());
        dto.setAffectedEquipment(entity.getAffectedEquipment());
        dto.setWorkScope(entity.getWorkScope());
        dto.setBooleanIsHotWorkRequired(entity.getIsHotWorkRequired());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setBooleanIsLotoRequired(entity.getIsLotoRequired());
        dto.setBooleanIsConfinedSpaceEntryRequired(entity.getIsConfinedSpaceEntryRequired());
        dto.setSpace(entity.getSpace());
        dto.setSharepointId(entity.getSharepointId());

        return dto;
    }

    public WorkRequest convertToEntity(WorkRequestDto dto) {
        if (dto == null) return null;

        WorkRequest entity = new WorkRequest();

        entity.setDateOfWorkToBePerformed(dto.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(dto.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(dto.getRequestedBy());
        entity.setCompany(dto.getCompany());
        entity.setLocation(dto.getLocation());
        entity.setAffectedEquipment(dto.getAffectedEquipment());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        entity.setForeman(dto.getForeman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setIsLotoRequired(dto.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        entity.setSpace(dto.getSpace());
        entity.setSharepointId(dto.getSharepointId());

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
