package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.mappers.equipment.HeatTraceMapper;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgHeatTraceService implements NgCrudService<HeatTrace, HeatTraceDto, HeatTraceRepo, HeatTraceMapper> {
    private final HeatTraceRepo heatTraceRepo;
    private final HeatTraceMapper heatTraceMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public HeatTraceRepo getRepo() {
        return heatTraceRepo;
    }

    @Override
    public HeatTraceMapper getMapper() {
        return heatTraceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HeatTraceDto getDto() {
        return new HeatTraceDto();
    }

    @Override
    public HeatTrace getEntity() {
        return new HeatTrace();
    }

    @Override
    public HeatTrace toEntity(HeatTraceDto dto) {
        return heatTraceMapper.convertToEntity(dto);
    }

    @Override
    public HeatTraceDto toDto(HeatTrace entity) {
        return heatTraceMapper.convertToDto(entity);
    }

    @Override
    public Class<HeatTrace> getEntityClass() {
        return HeatTrace.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
