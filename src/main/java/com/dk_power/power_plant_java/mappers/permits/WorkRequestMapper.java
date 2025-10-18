package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkRequestMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final WorkRequestRepo workRequestRepo;

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

    public NgWorkRequestDto toNgWorkRequestDto(WorkRequestDto workRequestDto) {
        if (workRequestDto == null) {
            return null;
        }

        NgWorkRequestDto ngWorkRequestDto = new NgWorkRequestDto();
        ngWorkRequestDto.setDateOfWorkToBePerformed(workRequestDto.getDateOfWorkToBePerformed());
        ngWorkRequestDto.setTimeOfWorkToBePerformed(workRequestDto.getTimeOfWorkToBePerformed());
        ngWorkRequestDto.setRequestedBy(workRequestDto.getRequestedBy());
        ngWorkRequestDto.setCompany(workRequestDto.getCompany());
        ngWorkRequestDto.setLocation(workRequestDto.getLocation());
        ngWorkRequestDto.setAffectedEquipment(workRequestDto.getAffectedEquipment());
        ngWorkRequestDto.setWorkScope(workRequestDto.getWorkScope());
        ngWorkRequestDto.setIsHotWorkRequired(workRequestDto.getIsHotWorkRequired());
        ngWorkRequestDto.setForeman(workRequestDto.getForeman());
        ngWorkRequestDto.setFireWatch(workRequestDto.getFireWatch());
        ngWorkRequestDto.setIsLotoRequired(workRequestDto.getIsLotoRequired());
        ngWorkRequestDto.setIsConfinedSpaceEntryRequired(workRequestDto.getIsConfinedSpaceEntryRequired());
        ngWorkRequestDto.setSpace(workRequestDto.getSpace());
        ngWorkRequestDto.setSharepointId(workRequestDto.getSharepointId());

        return ngWorkRequestDto;
    }

    public WorkRequestDto toWorkRequestDto(NgWorkRequestDto ngWorkRequestDto) {
        if (ngWorkRequestDto == null) {
            return null;
        }

        WorkRequestDto workRequestDto = new WorkRequestDto();
        workRequestDto.setDateOfWorkToBePerformed(ngWorkRequestDto.getDateOfWorkToBePerformed());
        workRequestDto.setTimeOfWorkToBePerformed(ngWorkRequestDto.getTimeOfWorkToBePerformed());
        workRequestDto.setRequestedBy(ngWorkRequestDto.getRequestedBy());
        workRequestDto.setCompany(ngWorkRequestDto.getCompany());
        workRequestDto.setLocation(ngWorkRequestDto.getLocation());
        workRequestDto.setAffectedEquipment(ngWorkRequestDto.getAffectedEquipment());
        workRequestDto.setWorkScope(ngWorkRequestDto.getWorkScope());
        workRequestDto.setIsHotWorkRequired(ngWorkRequestDto.getIsHotWorkRequired()?"Yes":"No");
        workRequestDto.setForeman(ngWorkRequestDto.getForeman());
        workRequestDto.setFireWatch(ngWorkRequestDto.getFireWatch());
        workRequestDto.setIsLotoRequired(ngWorkRequestDto.getIsLotoRequired()?"Yes":"No");
        workRequestDto.setIsConfinedSpaceEntryRequired(ngWorkRequestDto.getIsConfinedSpaceEntryRequired()?"Yes":"No");
        workRequestDto.setSpace(ngWorkRequestDto.getSpace());
        workRequestDto.setSharepointId(ngWorkRequestDto.getSharepointId());

        return workRequestDto;
    }

    public NgWorkRequestDto convertToNgDto(WorkRequest entity) {
        if (entity == null) return null;

        NgWorkRequestDto dto = new NgWorkRequestDto();

        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setNote(entity.getNote());
        dto.setDateOfWorkToBePerformed(entity.getDateOfWorkToBePerformed());
        dto.setTimeOfWorkToBePerformed(entity.getTimeOfWorkToBePerformed());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setCompany(entity.getCompany());
        dto.setLocation(entity.getLocation());
        dto.setAffectedEquipment(entity.getAffectedEquipment());
        dto.setWorkScope(entity.getWorkScope());
        dto.setIsHotWorkRequired(entity.getIsHotWorkRequired());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setIsLotoRequired(entity.getIsLotoRequired());
        dto.setIsConfinedSpaceEntryRequired(entity.getIsConfinedSpaceEntryRequired());
        dto.setSpace(entity.getSpace());
        dto.setSharepointId(entity.getSharepointId());
        dto.setStatus(entity.getPermitStatus().getName());


        return dto;
    }

    public WorkRequest convertNgDtoToEntity(NgWorkRequestDto dto) {
        if (dto == null) return null;

        WorkRequest entity = new WorkRequest();
        if(dto.getId()!=null && dto.getId()!=0) entity = workRequestRepo.findById(dto.getId()).orElse(new WorkRequest());

        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setNote(dto.getNote());
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
