package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.EnergizedWorkPermitDto;
import com.dk_power.power_plant_java.entities.permits.EnergizedWorkPermit;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.EnergizedWorkPermitRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EnergizedWorkPermitMapper implements BaseMapper {
    private final EnergizedWorkPermitRepo repo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public EnergizedWorkPermitDto convertToDto(EnergizedWorkPermit entity) {
        if (entity == null) return null;
        EnergizedWorkPermitDto dto = new EnergizedWorkPermitDto();

        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getDate() != null) dto.setDate(entity.getDate());
        if (entity.getTime() != null) dto.setTime(entity.getTime());
        if (entity.getLocation() != null) dto.setLocation(entity.getLocation());
        if (entity.getIssuedTo() != null) dto.setIssuedTo(entity.getIssuedTo());
        if (entity.getWorkScope() != null) dto.setWorkScope(entity.getWorkScope());
        if (entity.getRedTagNum() != null) dto.setRedTagNum(entity.getRedTagNum());
        if (entity.getPermitNumber() != null) dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getWorkOrder() != null) dto.setWorkOrder(entity.getWorkOrder());
        if (entity.getCircuitDescription() != null) dto.setCircuitDescription(entity.getCircuitDescription());
        if (entity.getWorkDescription() != null) dto.setWorkDescription(entity.getWorkDescription());
        if (entity.getJustification() != null) dto.setJustification(entity.getJustification());
        if (entity.getRequester() != null) dto.setRequester(entity.getRequester());
        if (entity.getRequesterDate() != null) dto.setRequesterDate(entity.getRequesterDate());
        if (entity.getQualifiedPersonSignature() != null) dto.setQualifiedPersonSignature(entity.getQualifiedPersonSignature());
        if (entity.getQualifiedPersonDate() != null) dto.setQualifiedPersonDate(entity.getQualifiedPersonDate());
        if (entity.getPlantManagerSignature() != null) dto.setPlantManagerSignature(entity.getPlantManagerSignature());
        if (entity.getPlantManagerDate() != null) dto.setPlantManagerDate(entity.getPlantManagerDate());
        if (entity.getWorkCanBePerformedSafely() != null) dto.setWorkCanBePerformedSafely(entity.getWorkCanBePerformedSafely());
        try { dto.setChecklist(entity.getChecklist()); } catch (Exception e) { /* ignore */ }

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            dto.setLocation(entity.getWorkArea().getName());
        } else if (entity.getLocation() != null && !entity.getLocation().isEmpty()) {
            workAreaRepo.findFirstByNameIgnoreCase(entity.getLocation())
                .ifPresent(wa -> dto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return dto;
    }

    public EnergizedWorkPermit convertToEntity(EnergizedWorkPermitDto dto) {
        if (dto == null) return null;
        EnergizedWorkPermit entity = null;

        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new EnergizedWorkPermit());
        }
        if (entity == null) entity = new EnergizedWorkPermit();

        if (dto.getId() != null) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getIssuedTo() != null) entity.setIssuedTo(dto.getIssuedTo());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getRedTagNum() != null) entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getPermitNumber() != null) entity.setPermitNumber(dto.getPermitNumber());

        if (dto.getWorkOrder() != null) entity.setWorkOrder(dto.getWorkOrder());
        if (dto.getCircuitDescription() != null) entity.setCircuitDescription(dto.getCircuitDescription());
        if (dto.getWorkDescription() != null) entity.setWorkDescription(dto.getWorkDescription());
        if (dto.getJustification() != null) entity.setJustification(dto.getJustification());
        if (dto.getRequester() != null) entity.setRequester(dto.getRequester());
        if (dto.getRequesterDate() != null) entity.setRequesterDate(dto.getRequesterDate());
        if (dto.getQualifiedPersonSignature() != null) entity.setQualifiedPersonSignature(dto.getQualifiedPersonSignature());
        if (dto.getQualifiedPersonDate() != null) entity.setQualifiedPersonDate(dto.getQualifiedPersonDate());
        if (dto.getPlantManagerSignature() != null) entity.setPlantManagerSignature(dto.getPlantManagerSignature());
        if (dto.getPlantManagerDate() != null) entity.setPlantManagerDate(dto.getPlantManagerDate());
        if (dto.getWorkCanBePerformedSafely() != null) entity.setWorkCanBePerformedSafely(dto.getWorkCanBePerformedSafely());
        try { entity.setChecklist(dto.getChecklist()); } catch (Exception e) { /* ignore */ }

        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            entity.setWorkArea(workArea);
            if (workArea != null) entity.setLocation(workArea.getName());
        }

        return entity;
    }
}
