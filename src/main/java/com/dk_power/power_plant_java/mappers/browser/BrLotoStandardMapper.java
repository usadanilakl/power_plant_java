package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrFileDto;
import com.dk_power.power_plant_java.dto.browser.BrLotoStandard;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BrLotoStandardMapper {
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoPointRepo lotoPointRepo;

    public BrLotoStandard toDto(LotoStandard entity) {
        if (entity == null) {
            return null;
        }

        BrLotoStandard dto = new BrLotoStandard();
        dto.setId(entity.getId());
        dto.setName(Optional.ofNullable(entity.getName()).orElse(""));
        dto.setDescription(Optional.ofNullable(entity.getDescription()).orElse(""));
        dto.setLotoPoints(
                Optional.ofNullable(entity.getLotoPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(LotoPoint::getId)
                                .collect(Collectors.toSet()))
                        .orElse(Collections.emptySet())
        );

        return dto;
    }

    public List<BrLotoStandard> toDtoAll(List<LotoStandard> all) {
        return all.stream().map(this::toDto).collect(Collectors.toList());
    }

    public LotoStandard toEntity(BrLotoStandard dto) {
        if(dto==null) return null;
        LotoStandard entity = null;
        if(dto.getId()!=null && dto.getId()!=0) entity = lotoStandardRepo.getReferenceById(dto.getId());
        if(entity==null) entity = new LotoStandard();
        if(dto.getName()!=null && !dto.getName().isEmpty())  entity.setName(dto.getName());
        if(dto.getDescription()!=null && !dto.getDescription().isEmpty()) entity.setDescription(dto.getDescription());
        if(dto.getLotoPoints()!=null && !dto.getLotoPoints().isEmpty()) entity.setLotoPoints(dto.getLotoPoints().stream()
                .map(lotoPointRepo::findById)
                .map(Optional::get)
                .collect(Collectors.toCollection(LinkedHashSet::new)));
        return entity;
    }
}
