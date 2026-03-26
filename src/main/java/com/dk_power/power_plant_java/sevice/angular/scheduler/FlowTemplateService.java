package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.FlowTemplateDto;
import com.dk_power.power_plant_java.entities.scheduler.FlowTemplate;
import com.dk_power.power_plant_java.mappers.scheduler.FlowTemplateMapper;
import com.dk_power.power_plant_java.repository.scheduler.FlowTemplateRepository;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FlowTemplateService implements NgCrudService<FlowTemplate, FlowTemplateDto, FlowTemplateRepository, FlowTemplateMapper> {
    private final FlowTemplateRepository repo;
    private final FlowTemplateMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public FlowTemplateRepository getRepo() { return repo; }

    @Override
    public FlowTemplateMapper getMapper() { return mapper; }

    @Override
    public SessionFactory getSessionFactory() { return sessionFactory; }

    @Override
    public FlowTemplateDto getDto() { return new FlowTemplateDto(); }

    @Override
    public FlowTemplate getEntity() { return new FlowTemplate(); }

    @Override
    public EntityManager getEntityManager() { return entityManager; }

    @Override
    public Class<FlowTemplate> getEntityClass() { return FlowTemplate.class; }
}
