package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class BrLotoPointMapper {
    public BrLotoPoint toDto(LotoPoint lotoPoint) {
        if (lotoPoint == null) {
            return null;
        }

        BrLotoPoint dto = new BrLotoPoint();

        if(lotoPoint.getId()!=null)dto.setId(lotoPoint.getId());
        if(lotoPoint.getTagNumber()!=null)dto.setTagNumber(lotoPoint.getTagNumber());
        if(lotoPoint.getDescription()!=null)dto.setDescription(lotoPoint.getDescription());
        if(lotoPoint.getIsoPos()!=null && lotoPoint.getIsoPos().getName()!=null)dto.setIsolatedPosition(lotoPoint.getIsoPos().getName());
        if(lotoPoint.getNormPos()!=null && lotoPoint.getNormPos().getName()!=null)dto.setNormalPosition(lotoPoint.getNormPos().getName());
        if(lotoPoint.getEquipmentList()!=null)dto.setEquipmentList(lotoPoint.getEquipmentList().stream().map(Equipment::getId).collect(Collectors.toSet()));

        return dto;
    }

    public List<BrLotoPoint> toDtoAll(Collection<LotoPoint> lotoPoints) {
        return Optional.ofNullable(lotoPoints)
               .orElse(Collections.emptyList())
               .stream()
                .filter(Objects::nonNull)
               .map(this::toDto)
               .collect(Collectors.toList());
    }
}
