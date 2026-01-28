package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.mappers.equipment.ElectricalPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.ElectricalPanelRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgElectricalPanelService implements NgCrudService<ElectricalPanel, ElectricalPanelDto, ElectricalPanelRepo, ElectricalPanelMapper> {
    private final ElectricalPanelRepo electricalPanelRepo;
    private final ElectricalPanelMapper electricalPanelMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public ElectricalPanelRepo getRepo() {
        return electricalPanelRepo;
    }

    @Override
    public ElectricalPanelMapper getMapper() {
        return electricalPanelMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ElectricalPanelDto getDto() {
        return new ElectricalPanelDto();
    }

    @Override
    public ElectricalPanel getEntity() {
        return new ElectricalPanel();
    }

    @Override
    public ElectricalPanel toEntity(ElectricalPanelDto dto) {
        return electricalPanelMapper.convertToEntity(dto);
    }

    @Override
    public ElectricalPanelDto toDto(ElectricalPanel entity) {
        return electricalPanelMapper.convertToDto(entity);
    }

    @Override
    public Class<ElectricalPanel> getEntityClass() {
        return ElectricalPanel.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
