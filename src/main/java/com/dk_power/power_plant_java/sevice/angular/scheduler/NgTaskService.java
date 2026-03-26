package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskIdDto;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.repository.scheduler.TaskRepository;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NgTaskService implements NgCrudService<Task, TaskDto, TaskRepository, TaskMapper> {
    private final TaskRepository repo;
    private final TaskMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public TaskRepository getRepo() { return repo; }

    @Override
    public TaskMapper getMapper() { return mapper; }

    @Override
    public SessionFactory getSessionFactory() { return sessionFactory; }

    @Override
    public TaskDto getDto() { return new TaskDto(); }

    @Override
    public Task getEntity() { return new Task(); }

    @Override
    public EntityManager getEntityManager() { return entityManager; }

    @Override
    public Class<Task> getEntityClass() { return Task.class; }

    @Override
    public TaskDto toDto(Task entity) {
        return mapper.convertToDto(entity);
    }

    public List<TaskDto> getTasksByFlowId(Long flowId) {
        return repo.findAll().stream()
                .filter(t -> t.getFlow() != null && t.getFlow().getId().equals(flowId))
                .filter(t -> !Boolean.TRUE.equals(t.getDeleted()))
                .map(mapper::convertToDto)
                .collect(Collectors.toList());
    }

    public Task saveFromIdDto(TaskIdDto idDto) {
        Task task = mapper.convertIdDtoToEntity(idDto);
        return repo.save(task);
    }
}
