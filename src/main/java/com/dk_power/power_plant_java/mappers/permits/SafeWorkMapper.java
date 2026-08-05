package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SafeWorkMapper implements BaseMapper {
    private final SafeWorkRepo safeWorkRepo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;
    private final ValueMapper valueMapper;
    private final ValueRepo valueRepo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public SafeWorkDto convertToDto(SafeWork safeWork) {
        if (safeWork == null) return null;

        SafeWorkDto dto = new SafeWorkDto();

        // Audit stamps, permit number, sync bookkeeping. Without this the hand mapper
        // returns a thinner object than the ModelMapper it replaced on get-by-id.
        copyBaseFields(safeWork, dto);

        if (safeWork.getId()!= null) dto.setId(safeWork.getId());
        if (safeWork.getDate() != null) dto.setDate(safeWork.getDate());
        if (safeWork.getTime() != null) dto.setTime(safeWork.getTime());
        if (safeWork.getCompanyPerson() != null) dto.setCompanyPerson(safeWork.getCompanyPerson());
        if (safeWork.getLocation() != null) dto.setLocation(safeWork.getLocation());
        if (safeWork.getWorkScope() != null) dto.setWorkScope(safeWork.getWorkScope());
        if (safeWork.getSpecialInstructions() != null) dto.setSpecialInstructions(safeWork.getSpecialInstructions());
        if (safeWork.getRequestedBy() != null) dto.setRequestedBy(safeWork.getRequestedBy());
        if(safeWork.getRedTagNum()!=null) dto.setRedTagNum(safeWork.getRedTagNum());
        // Both were generated/populated server-side but carried by neither mapper direction, so the
        // permit number literally could not be printed and the status column was always blank.
        if (safeWork.getPermitNumber() != null) dto.setPermitNumber(safeWork.getPermitNumber());
        if (safeWork.getPermitStatus() != null) dto.setPermitStatus(valueMapper.convertToDto(safeWork.getPermitStatus()));

        // Convert JSON fields to POJOs and set in DTO
        try {
            dto.setHazards(safeWork.getHazards());
        } catch (Exception e) {
            // handle or log conversion issue if needed
        }

        try {
            dto.setPermits(safeWork.getPermits());
        } catch (Exception e) {
            // handle or log conversion issue if needed
        }

        try {
            dto.setPpe(safeWork.getPpe());
        } catch (Exception e) {
            // handle or log conversion issue if needed
        }

        if (safeWork.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(safeWork.getWorkArea()));
            dto.setLocation(safeWork.getWorkArea().getName());
        } else if (safeWork.getLocation() != null && !safeWork.getLocation().isEmpty()) {
            workAreaRepo.findFirstByNameIgnoreCase(safeWork.getLocation())
                .ifPresent(wa -> dto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return dto;
    }

    public SafeWork convertToEntity(SafeWorkDto dto) {
        if (dto == null) return null;
        SafeWork entity = null;

        if(dto.getId()!=null && dto.getId()!=0) entity = safeWorkRepo.findById(dto.getId()).orElse(new SafeWork());
        if(entity == null) entity = new SafeWork();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getCompanyPerson() != null) entity.setCompanyPerson(dto.getCompanyPerson());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getSpecialInstructions() != null) entity.setSpecialInstructions(dto.getSpecialInstructions());
        if (dto.getRequestedBy() != null) entity.setRequestedBy(dto.getRequestedBy());
        if(dto.getRedTagNum()!=null && !dto.getRedTagNum().isEmpty())entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getPermitNumber() != null && !dto.getPermitNumber().isEmpty()) entity.setPermitNumber(dto.getPermitNumber());
        // Resolve by id, never merge a detached Value. id 0 is the Angular placeholder shape and must
        // be ignored, or NgSafeWorkService's "Building" default is skipped and merge() throws
        // "Unable to find Value with id 0" -- the HotWork create bug.
        if (dto.getPermitStatus() != null && dto.getPermitStatus().getId() != null
                && dto.getPermitStatus().getId() != 0) {
            Value status = valueRepo.findById(dto.getPermitStatus().getId()).orElse(null);
            if (status != null) entity.setPermitStatus(status);
        }

        // Convert POJOs to JSON strings and set into entity JSON fields
        // Null-guarded like every scalar above. Unguarded, setHazards(null) serialises the
        // literal 4-char string "null" into hazards_json, which the getter's isEmpty() check does
        // not catch -- wiping all 32 hazard booleans on any payload that omits the block.
        if (dto.getHazards() != null) {
            entity.setHazards(dto.getHazards());
        }

        if (dto.getPermits() != null) {
            entity.setPermits(dto.getPermits());
        }

        if (dto.getPpe() != null) {
            entity.setPpe(dto.getPpe());
        }

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
