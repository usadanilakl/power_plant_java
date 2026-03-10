package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HotWorkMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final HotWorkRepo hotWorkRepo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;

    public HotWorkDto convertToDto(HotWork entity) {
        if (entity == null) return null;
        HotWorkDto dto = new HotWorkDto();

        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setMeterModel(entity.getMeterModel());
        dto.setMeterNum(entity.getMeterNum());
        dto.setSpecialInstructions(entity.getSpecialInstructions());
        dto.setLocation(entity.getLocation());
        dto.setWorkScope(entity.getWorkScope());
        dto.setRedTagNum(entity.getRedTagNum());

        try {
            dto.setMeasures(entity.getMeasures());
        } catch (Exception e) {
            // handle or log
        }

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            dto.setLocation(entity.getWorkArea().getName());
        } else if (entity.getLocation() != null && !entity.getLocation().isEmpty()) {
            workAreaRepo.findFirstByNameIgnoreCase(entity.getLocation())
                .ifPresent(wa -> dto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return dto;
    }

    public HotWork convertToEntity(HotWorkDto dto) {
        if (dto == null) return null;
        HotWork entity = null;

        if(dto.getId()!=null && dto.getId()!=0) entity = hotWorkRepo.findById(dto.getId()).orElse(new HotWork());
        if(entity == null) entity = new HotWork();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setForeman(dto.getForeman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setMeterModel(dto.getMeterModel());
        entity.setMeterNum(dto.getMeterNum());
        entity.setSpecialInstructions(dto.getSpecialInstructions());
        entity.setLocation(dto.getLocation());
        entity.setWorkScope(dto.getWorkScope());
        if(dto.getRedTagNum()!=null && !dto.getRedTagNum().isEmpty())entity.setRedTagNum(dto.getRedTagNum());

        try {
            entity.setMeasures(dto.getMeasures());
        } catch (Exception e) {
            // handle or log
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

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
