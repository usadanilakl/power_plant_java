package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.scheduler.TaskReference;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.repository.scheduler.TaskRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class TaskService implements CrudService<Task, TaskDto, TaskRepository, TaskMapper> {
    private final TaskRepository taskRepository;
    private final ReferenceService referenceService;
    private final SessionFactory sessionFactory;
    private final TaskMapper taskMapper;

    public TaskService(TaskRepository taskRepository, ReferenceService referenceService, SessionFactory sessionFactory, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.referenceService = referenceService;
        this.sessionFactory = sessionFactory;
        this.taskMapper = taskMapper;
    }

    public Task getActionStepWithReferences(Long id) {
        Task step = taskRepository.findById(id).orElse(null);
        if (step != null) {
            for (TaskReference ref : step.getReferences()) {
                Referenceable referencedEntity = referenceService.loadReference(ref.getReferenceType(), ref.getReferenceId());
                if (referencedEntity != null) {
                    switch (ref.getReferenceType()) {
                        case "FileObject":
                            step.getFileReferences().add((FileObject) referencedEntity);
                            break;
                        case "Equipment":
                            step.getEquipmentReferences().add((Equipment) referencedEntity);
                            break;
                        case "LotoPoint":
                            step.getLotoPointReferences().add((LotoPoint) referencedEntity);
                            break;
                        case "Value":
                            step.getLocationReferences().add((Value) referencedEntity);
                            break;
                    }
                }
            }
        }
        return step;
    }

    @Override
    public Task getEntity() {
        return new Task()  ;
    }

    @Override
    public TaskDto getDto() {
        return new TaskDto()  ;
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