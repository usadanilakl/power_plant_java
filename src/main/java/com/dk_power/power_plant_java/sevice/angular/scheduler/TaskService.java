package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.repository.scheduler.TaskRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;


@Service
public class TaskService implements CrudService<Task, TaskDto, TaskRepository, TaskMapper> {
    private final TaskRepository taskRepository;
    private final SessionFactory sessionFactory;
    private final TaskMapper taskMapper;

    public TaskService(TaskRepository taskRepository, SessionFactory sessionFactory, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.sessionFactory = sessionFactory;
        this.taskMapper = taskMapper;
    }

    @Override
    public Task getEntity() {
        return new Task();
    }

    @Override
    public TaskDto getDto() {
        return new TaskDto();
    }

    @Override
    public TaskRepository getRepo() {
        return taskRepository;
    }

    @Override
    public TaskMapper getMapper() {
        return taskMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}