package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.equipment.HtPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.HtPanelRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgHtPanelService implements NgCrudService<HtPanel, HtPanelDto, HtPanelRepo, HtPanelMapper> {
    private final HtPanelRepo htPanelRepo;
    private final HtPanelMapper htPanelMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public HtPanelRepo getRepo() {
        return htPanelRepo;
    }

    @Override
    public HtPanelMapper getMapper() {
        return htPanelMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HtPanelDto getDto() {
        return new HtPanelDto();
    }

    @Override
    public HtPanel getEntity() {
        return new HtPanel();
    }

    @Override
    public HtPanel toEntity(HtPanelDto dto) {
        return htPanelMapper.convertToEntity(dto);
    }

    @Override
    public HtPanelDto toDto(HtPanel entity) {
        return htPanelMapper.convertToDto(entity);
    }

    @Override
    public Class<HtPanel> getEntityClass() {
        return HtPanel.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
