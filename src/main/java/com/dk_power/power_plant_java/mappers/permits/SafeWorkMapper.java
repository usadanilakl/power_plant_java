package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
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

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public SafeWorkDto convertToDto(SafeWork safeWork) {
        if (safeWork == null) return null;

        SafeWorkDto dto = new SafeWorkDto();

        if (safeWork.getId()!= null) dto.setId(safeWork.getId());
        if (safeWork.getDate() != null) dto.setDate(safeWork.getDate());
        if (safeWork.getTime() != null) dto.setTime(safeWork.getTime());
        if (safeWork.getCompanyPerson() != null) dto.setCompanyPerson(safeWork.getCompanyPerson());
        if (safeWork.getLocation() != null) dto.setLocation(safeWork.getLocation());
        if (safeWork.getWorkScope() != null) dto.setWorkScope(safeWork.getWorkScope());
        if (safeWork.getSpecialInstructions() != null) dto.setSpecialInstructions(safeWork.getSpecialInstructions());
        if (safeWork.getRequestedBy() != null) dto.setRequestedBy(safeWork.getRequestedBy());
        if(safeWork.getRedTagNum()!=null) dto.setRedTagNum(safeWork.getRedTagNum());

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
        }

        return dto;
    }

    public SafeWork convertToEntity(SafeWorkDto dto) {
        if (dto == null) return null;
        SafeWork entity = null;

        if(dto.getId()!=null && dto.getId()!=0) entity = safeWorkRepo.findById(dto.getId()).orElse(new SafeWork());
        if(entity == null) entity = new SafeWork();

        if (dto.getId()!= null) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getCompanyPerson() != null) entity.setCompanyPerson(dto.getCompanyPerson());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getSpecialInstructions() != null) entity.setSpecialInstructions(dto.getSpecialInstructions());
        if (dto.getRequestedBy() != null) entity.setRequestedBy(dto.getRequestedBy());
        if(dto.getRedTagNum()!=null && !dto.getRedTagNum().isEmpty())entity.setRedTagNum(dto.getRedTagNum());

        // Convert POJOs to JSON strings and set into entity JSON fields
        try {
            entity.setHazards(dto.getHazards());
        } catch (Exception e) {
            // handle or log exception as needed
        }

        try {
            entity.setPermits(dto.getPermits());
        } catch (Exception e) {
            // handle or log exception as needed
        }

        try {
            entity.setPpe(dto.getPpe());
        } catch (Exception e) {
            // handle or log exception as needed
        }

        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            entity.setWorkArea(workArea);
            if (workArea != null) {
                entity.setLocation(workArea.getName());
            }
        }

        return entity;
    }


}
