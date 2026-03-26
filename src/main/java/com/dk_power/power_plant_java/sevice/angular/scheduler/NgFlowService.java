package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.FlowDto;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.mappers.scheduler.FlowMapper;
import com.dk_power.power_plant_java.repository.scheduler.FlowRepository;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgFlowService implements NgCrudService<Flow, FlowDto, FlowRepository, FlowMapper> {
    private final FlowRepository repo;
    private final FlowMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public FlowRepository getRepo() { return repo; }

    @Override
    public FlowMapper getMapper() { return mapper; }

    @Override
    public SessionFactory getSessionFactory() { return sessionFactory; }

    @Override
    public FlowDto getDto() { return new FlowDto(); }

    @Override
    public Flow getEntity() { return new Flow(); }

    @Override
    public EntityManager getEntityManager() { return entityManager; }

    @Override
    public Class<Flow> getEntityClass() { return Flow.class; }

    @Override
    public FlowDto toDto(Flow entity) {
        return mapper.convertToDto(entity);
    }
}
