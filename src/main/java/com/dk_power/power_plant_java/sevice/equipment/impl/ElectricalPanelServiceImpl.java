package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.equipment.ElectricalPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.ElectricalPanelRepo;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ElectricalPanelServiceImpl implements ElectricalPanelService {
    private final ElectricalPanelMapper electricalPanelMapper;
    private final ElectricalPanelRepo electricalPanelRepo;
    private final SessionFactory sessionFactory;

    public ElectricalPanelServiceImpl(ElectricalPanelMapper electricalPanelMapper, ElectricalPanelRepo electricalPanelRepo, SessionFactory sessionFactory) {
        this.electricalPanelMapper = electricalPanelMapper;
        this.electricalPanelRepo = electricalPanelRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public ElectricalPanel getEntity() {
        return new ElectricalPanel();
    }

    @Override
    public ElectricalPanelDto getDto() {
        return new ElectricalPanelDto();
    }

    @Override
    public ElectricalPanelRepo getRepo() {
        return electricalPanelRepo;
    }

    @Override
    public ElectricalPanelMapper getMapper() {
        return null;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ElectricalPanel getByTagNumber(String panel) {
        return electricalPanelRepo.findByTagNumber(panel);
    }

    @Override
    public ElectricalPanel convertToEntity(ElectricalPanelDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public ElectricalPanelDto convertToDto(ElectricalPanel entity) {
        return getMapper().convertToDto(entity);
    }
}
