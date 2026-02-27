package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
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

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public ExcavationPermitDto convertToDto(ExcavationPermit entity) {
        if (entity == null) return null;
        ExcavationPermitDto dto = new ExcavationPermitDto();

        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getDate() != null) dto.setDate(entity.getDate());
        if (entity.getTime() != null) dto.setTime(entity.getTime());
        if (entity.getLocation() != null) dto.setLocation(entity.getLocation());
        if (entity.getIssuedTo() != null) dto.setIssuedTo(entity.getIssuedTo());
        if (entity.getWorkScope() != null) dto.setWorkScope(entity.getWorkScope());
        if (entity.getRedTagNum() != null) dto.setRedTagNum(entity.getRedTagNum());
        if (entity.getPermitNumber() != null) dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            dto.setLocation(entity.getWorkArea().getName());
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

        if (dto.getId() != null) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getIssuedTo() != null) entity.setIssuedTo(dto.getIssuedTo());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getRedTagNum() != null) entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getPermitNumber() != null) entity.setPermitNumber(dto.getPermitNumber());

        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            entity.setWorkArea(workArea);
            if (workArea != null) entity.setLocation(workArea.getName());
        }

        return entity;
    }
}
