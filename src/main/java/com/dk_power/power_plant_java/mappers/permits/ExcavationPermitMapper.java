package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.permits.ExcavationPermitRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ExcavationPermitMapper implements BaseMapper {
    private final ExcavationPermitRepo repo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;
    private final ValueMapper valueMapper;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public ExcavationPermitDto convertToDto(ExcavationPermit entity) {
        if (entity == null) return null;
        ExcavationPermitDto dto = new ExcavationPermitDto();

        // Audit stamps, permit number, sync bookkeeping. Without this the hand mapper
        // returns a thinner object than the ModelMapper it replaced on get-by-id.
        copyBaseFields(entity, dto);
        // Status was carried by neither mapper direction, so the detail view showed blank.
        if (entity.getPermitStatus() != null) dto.setPermitStatus(valueMapper.convertToDto(entity.getPermitStatus()));

        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getDate() != null) dto.setDate(entity.getDate());
        if (entity.getTime() != null) dto.setTime(entity.getTime());
        if (entity.getLocation() != null) dto.setLocation(entity.getLocation());
        if (entity.getIssuedTo() != null) dto.setIssuedTo(entity.getIssuedTo());
        if (entity.getWorkScope() != null) dto.setWorkScope(entity.getWorkScope());
        if (entity.getRedTagNum() != null) dto.setRedTagNum(entity.getRedTagNum());
        if (entity.getPermitNumber() != null) dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getSupervisor() != null) dto.setSupervisor(entity.getSupervisor());
        if (entity.getJobLocation() != null) dto.setJobLocation(entity.getJobLocation());
        if (entity.getSupervisorPhone() != null) dto.setSupervisorPhone(entity.getSupervisorPhone());
        if (entity.getExcavationDescription() != null) dto.setExcavationDescription(entity.getExcavationDescription());
        if (entity.getWorkOrder() != null) dto.setWorkOrder(entity.getWorkOrder());
        if (entity.getLocationPipingMarked() != null) dto.setLocationPipingMarked(entity.getLocationPipingMarked());
        if (entity.getSupervisorApprovalDate() != null) dto.setSupervisorApprovalDate(entity.getSupervisorApprovalDate());
        if (entity.getSupervisorApprovalTime() != null) dto.setSupervisorApprovalTime(entity.getSupervisorApprovalTime());
        if (entity.getPermitClosedDate() != null) dto.setPermitClosedDate(entity.getPermitClosedDate());
        if (entity.getPermitClosedTime() != null) dto.setPermitClosedTime(entity.getPermitClosedTime());
        if (entity.getJobStatusComplete() != null) dto.setJobStatusComplete(entity.getJobStatusComplete());
        if (entity.getSupervisorFieldInspectionName() != null) dto.setSupervisorFieldInspectionName(entity.getSupervisorFieldInspectionName());
        if (entity.getSupervisorFieldInspectionDate() != null) dto.setSupervisorFieldInspectionDate(entity.getSupervisorFieldInspectionDate());
        if (entity.getSupervisorFieldInspectionTime() != null) dto.setSupervisorFieldInspectionTime(entity.getSupervisorFieldInspectionTime());
        if (entity.getFacilityName() != null) dto.setFacilityName(entity.getFacilityName());
        if (entity.getCompetentPerson() != null) dto.setCompetentPerson(entity.getCompetentPerson());
        if (entity.getSoilType() != null) dto.setSoilType(entity.getSoilType());
        if (entity.getExcavationDepth() != null) dto.setExcavationDepth(entity.getExcavationDepth());
        if (entity.getExcavationWidth() != null) dto.setExcavationWidth(entity.getExcavationWidth());
        if (entity.getProtectiveSystemType() != null) dto.setProtectiveSystemType(entity.getProtectiveSystemType());
        if (entity.getInspectionsJson() != null) dto.setInspectionsJson(entity.getInspectionsJson());
        try { dto.setTypeOfWork(entity.getTypeOfWork()); } catch (Exception e) { /* ignore */ }
        try { dto.setChecklist(entity.getChecklist()); } catch (Exception e) { /* ignore */ }

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            // Fallback, not an override: this used to clobber the operator-entered value that was
            // read a few lines above, so a typed location reverted on every reload.
            if (dto.getLocation() == null || dto.getLocation().isBlank()) {
                dto.setLocation(entity.getWorkArea().getName());
            }
        } else if (entity.getLocation() != null && !entity.getLocation().isEmpty()) {
            workAreaRepo.findFirstByNameIgnoreCase(entity.getLocation())
                .ifPresent(wa -> dto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return dto;
    }

    public ExcavationPermit convertToEntity(ExcavationPermitDto dto) {
        if (dto == null) return null;
        ExcavationPermit entity = null;

        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new ExcavationPermit());
        }
        if (entity == null) entity = new ExcavationPermit();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getIssuedTo() != null) entity.setIssuedTo(dto.getIssuedTo());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getRedTagNum() != null) entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getPermitNumber() != null) entity.setPermitNumber(dto.getPermitNumber());

        if (dto.getSupervisor() != null) entity.setSupervisor(dto.getSupervisor());
        if (dto.getJobLocation() != null) entity.setJobLocation(dto.getJobLocation());
        if (dto.getSupervisorPhone() != null) entity.setSupervisorPhone(dto.getSupervisorPhone());
        if (dto.getExcavationDescription() != null) entity.setExcavationDescription(dto.getExcavationDescription());
        if (dto.getWorkOrder() != null) entity.setWorkOrder(dto.getWorkOrder());
        if (dto.getLocationPipingMarked() != null) entity.setLocationPipingMarked(dto.getLocationPipingMarked());
        if (dto.getSupervisorApprovalDate() != null) entity.setSupervisorApprovalDate(dto.getSupervisorApprovalDate());
        if (dto.getSupervisorApprovalTime() != null) entity.setSupervisorApprovalTime(dto.getSupervisorApprovalTime());
        if (dto.getPermitClosedDate() != null) entity.setPermitClosedDate(dto.getPermitClosedDate());
        if (dto.getPermitClosedTime() != null) entity.setPermitClosedTime(dto.getPermitClosedTime());
        if (dto.getJobStatusComplete() != null) entity.setJobStatusComplete(dto.getJobStatusComplete());
        if (dto.getSupervisorFieldInspectionName() != null) entity.setSupervisorFieldInspectionName(dto.getSupervisorFieldInspectionName());
        if (dto.getSupervisorFieldInspectionDate() != null) entity.setSupervisorFieldInspectionDate(dto.getSupervisorFieldInspectionDate());
        if (dto.getSupervisorFieldInspectionTime() != null) entity.setSupervisorFieldInspectionTime(dto.getSupervisorFieldInspectionTime());
        if (dto.getFacilityName() != null) entity.setFacilityName(dto.getFacilityName());
        if (dto.getCompetentPerson() != null) entity.setCompetentPerson(dto.getCompetentPerson());
        if (dto.getSoilType() != null) entity.setSoilType(dto.getSoilType());
        if (dto.getExcavationDepth() != null) entity.setExcavationDepth(dto.getExcavationDepth());
        if (dto.getExcavationWidth() != null) entity.setExcavationWidth(dto.getExcavationWidth());
        if (dto.getProtectiveSystemType() != null) entity.setProtectiveSystemType(dto.getProtectiveSystemType());
        if (dto.getInspectionsJson() != null) entity.setInspectionsJson(dto.getInspectionsJson());
        if (dto.getTypeOfWork() != null) entity.setTypeOfWork(dto.getTypeOfWork());
        if (dto.getChecklist() != null) entity.setChecklist(dto.getChecklist());

        // id 0 is the Angular placeholder shape (BaseDto sets id = data.id || 0). It passes a
        // plain != null check, findById(0) is empty, and the old code then assigned that empty
        // result unconditionally -- silently UNLINKING the permit's work area. Also: the name is
        // now a FALLBACK, not an override, so an operator-typed value is no longer clobbered.
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null && dto.getWorkArea().getId() != 0) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            if (workArea != null) {
                entity.setWorkArea(workArea);
                if (entity.getLocation() == null || entity.getLocation().isBlank()) {
                    entity.setLocation(workArea.getName());
                }
            }
        }

        return entity;
    }
}
