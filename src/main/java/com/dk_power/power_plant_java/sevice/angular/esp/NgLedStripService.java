package com.dk_power.power_plant_java.sevice.angular.esp;

import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.mappers.esp.LedStripMapper;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgLedStripService implements NgCrudService<LedStrip, LedStripDto, LedStripRepo, LedStripMapper> {
    private final LedStripRepo ledStripRepo;
    private final LedStripMapper ledStripMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public LedStripRepo getRepo() {
        return ledStripRepo;
    }

    @Override
    public LedStripMapper getMapper() {
        return ledStripMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LedStripDto getDto() {
        return new LedStripDto();
    }

    @Override
    public LedStrip getEntity() {
        return new LedStrip();
    }

    @Override
    public LedStrip toEntity(LedStripDto dto) {
        return ledStripMapper.convertToEntity(dto);
    }

    @Override
    public LedStripDto toDto(LedStrip entity) {
        return ledStripMapper.convertToDto(entity);
    }

    @Override
    public Class<LedStrip> getEntityClass() {
        return LedStrip.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
