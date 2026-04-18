package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskTemplateDto;
import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.mappers.scheduler.TaskTemplateMapper;
import com.dk_power.power_plant_java.repository.scheduler.TaskTemplateRepository;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskTemplateService implements NgCrudService<TaskTemplate, TaskTemplateDto, TaskTemplateRepository, TaskTemplateMapper> {
    private final TaskTemplateRepository repo;
    private final TaskTemplateMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public TaskTemplateRepository getRepo() { return repo; }

    @Override
    public TaskTemplateMapper getMapper() { return mapper; }

    @Override
    public SessionFactory getSessionFactory() { return sessionFactory; }

    @Override
    public TaskTemplateDto getDto() { return new TaskTemplateDto(); }

    @Override
    public TaskTemplate getEntity() { return new TaskTemplate(); }

    @Override
    public EntityManager getEntityManager() { return entityManager; }

    @Override
    public Class<TaskTemplate> getEntityClass() { return TaskTemplate.class; }

    @Override
    public TaskTemplateDto toDto(TaskTemplate entity) {
        if (entity == null) return null;
        return mapper.convertToDto(entity);
    }
}
