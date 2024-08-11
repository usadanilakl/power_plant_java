package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.repository.equipment.HighlightRepo;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HighlightService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
@AllArgsConstructor
@Transactional
public class HighlightServiceImpl implements HighlightService {
    private final HighlightRepo highlightRepo;
    private final HighlightMapper highlightMapper;
    private final SessionFactory sessionFactory;
    private final EquipmentService equipmentService;


    @Override
    public Highlight getEntity() {
        return new Highlight();
    }

    @Override
    public HighlightDto getDto() {
        return new HighlightDto();
    }

    @Override
    public HighlightRepo getRepo() {
        return highlightRepo;
    }

    @Override
    public HighlightMapper getMapper() {
        return highlightMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }


    @Override
    public void transferEqToHighlights(Equipment equipment) {
        Highlight highlight = new Highlight();
        highlight.setCoordinates(equipment.getCoordinates());
        highlight.setOriginalPictureSize(equipment.getOriginalPictureSize());
        highlight.buildPictureSize();
        highlight.buildCoordinates();
        highlight.setFile(equipment.getMainFile());
        save(highlight);
        equipment.setHighlight(highlight);
        equipmentService.save(equipment);
    }
}
