package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConfinedSpaceMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;

    public ConfinedSpaceDto convertToDto(ConfinedSpace entity) {
        if (entity == null) return null;

        ConfinedSpaceDto dto = new ConfinedSpaceDto();

        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setSpace(entity.getSpace());
        dto.setWorkScope(entity.getWorkScope());
        dto.setIssuedTo(entity.getIssuedTo());
        dto.setDuration(entity.getDuration());
        dto.setMeterModel(entity.getMeterModel());
        dto.setMeterNum(entity.getMeterNum());
        dto.setCalibrated(entity.isCalibrated());
        dto.setRedTagNum(entity.getRedTagNum());

        try {
            dto.setHazards(entity.getHazards());
            dto.setPpe(entity.getPpe());
            dto.setPrecautions(entity.getPrecautions());
        } catch (Exception e) {
            // handle or log
        }

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            // Fallback, not an override: this used to clobber the operator-entered value that was
            // read a few lines above, so a typed space reverted on every reload.
            if (dto.getSpace() == null || dto.getSpace().isBlank()) {
                dto.setSpace(entity.getWorkArea().getName());
            }
        }

        return dto;
    }

    public ConfinedSpace convertToEntity(ConfinedSpaceDto dto) {
        if (dto == null) return null;

        ConfinedSpace entity = null;
        if(dto.getId()!=null && dto.getId()!=0) entity = confinedSpaceRepo.findById(dto.getId()).orElse(new ConfinedSpace());
        if(entity == null) entity = new ConfinedSpace();


        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setSpace(dto.getSpace());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIssuedTo(dto.getIssuedTo());
        entity.setDuration(dto.getDuration());
        entity.setMeterModel(dto.getMeterModel());
        entity.setMeterNum(dto.getMeterNum());
        entity.setCalibrated(dto.isCalibrated());
        if(dto.getRedTagNum()!=null && !dto.getRedTagNum().isEmpty())entity.setRedTagNum(dto.getRedTagNum());

        try {
            if (dto.getHazards() != null) entity.setHazards(dto.getHazards());
            if (dto.getPpe() != null) entity.setPpe(dto.getPpe());
            if (dto.getPrecautions() != null) entity.setPrecautions(dto.getPrecautions());
        } catch (Exception e) {
            // handle or log
        }

        // id 0 is the Angular placeholder shape (BaseDto sets id = data.id || 0). It passes a
        // plain != null check, findById(0) is empty, and the old code then assigned that empty
        // result unconditionally -- silently UNLINKING the permit's work area. Also: the name is
        // now a FALLBACK, not an override, so an operator-typed value is no longer clobbered.
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null && dto.getWorkArea().getId() != 0) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            if (workArea != null) {
                entity.setWorkArea(workArea);
                if (entity.getSpace() == null || entity.getSpace().isBlank()) {
                    entity.setSpace(workArea.getName());
                }
            }
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
