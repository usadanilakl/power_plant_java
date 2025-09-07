package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class SafeWorkMapper implements BaseMapper {

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public SafeWorkDto convertToDto(SafeWork safeWork) {
        if (safeWork == null) return null;

        SafeWorkDto dto = new SafeWorkDto();

        if (safeWork.getDate() != null) dto.setDate(safeWork.getDate());
        if (safeWork.getTime() != null) dto.setTime(safeWork.getTime());
        if (safeWork.getCompanyPerson() != null) dto.setCompanyPerson(safeWork.getCompanyPerson());
        if (safeWork.getLocation() != null) dto.setLocation(safeWork.getLocation());
        if (safeWork.getWorkScope() != null) dto.setWorkScope(safeWork.getWorkScope());
        if (safeWork.getSpecialInstructions() != null) dto.setSpecialInstructions(safeWork.getSpecialInstructions());
        if (safeWork.getRequestor() != null) dto.setRequestor(safeWork.getRequestor());

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

        return dto;
    }

    public SafeWork convertToEntity(SafeWorkDto dto) {
        if (dto == null) return null;

        SafeWork entity = new SafeWork();

        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getCompanyPerson() != null) entity.setCompanyPerson(dto.getCompanyPerson());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getSpecialInstructions() != null) entity.setSpecialInstructions(dto.getSpecialInstructions());
        if (dto.getRequestor() != null) entity.setRequestor(dto.getRequestor());

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

        return entity;
    }


}
