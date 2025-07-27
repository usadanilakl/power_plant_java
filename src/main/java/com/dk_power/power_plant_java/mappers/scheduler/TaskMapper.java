package com.dk_power.power_plant_java.mappers.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskIdDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskReferenceDto;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.scheduler.TaskReference;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.angular.scheduler.FlowService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.TaskService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class TaskMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final TaskService taskService;
    private final FlowService flowService;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;

    public TaskMapper(ModelMapper modelMapper, ValueService valueService, @Lazy TaskService taskService,
                      @Lazy FlowService flowService, @Lazy FileService fileService,
                      @Lazy EquipmentService equipmentService, @Lazy LotoPointService lotoPointService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.taskService = taskService;
        this.flowService = flowService;
        this.fileService = fileService;
        this.equipmentService = equipmentService;
        this.lotoPointService = lotoPointService;
    }

    public TaskDto convertToDto(Task task) {
        TaskDto taskDto = new TaskDto();
        taskDto.setId(task.getId());
        taskDto.setName(task.getName());
        taskDto.setDescription(task.getDescription());
        taskDto.setCompletionLog(task.getCompletionLog());
        if (task.getStatus() != null) taskDto.setStatus(valueService.convertToDto(task.getStatus()));
        if (task.getFlow() != null) taskDto.setFlow(flowService.convertToDto(task.getFlow()));
        if (task.getParentTask() != null) taskDto.setParentTask(convertToDto(task.getParentTask()));
        taskDto.setSubTasks(task.getSubTasks().stream().map(this::convertToDto).collect(Collectors.toSet()));
        taskDto.setPrerequisites(task.getPrerequisites().stream().map(this::convertToDto).collect(Collectors.toSet()));
        taskDto.setDependents(task.getDependents().stream().map(this::convertToDto).collect(Collectors.toSet()));
        taskDto.setReferences(task.getReferences().stream().map(this::convertToTaskReferenceDto).collect(Collectors.toSet()));
        taskDto.setFileReferences(task.getFileReferences().stream().map(fileService::convertToDto).collect(Collectors.toSet()));
        taskDto.setEquipmentReferences(task.getEquipmentReferences().stream().map(equipmentService::convertToDto).collect(Collectors.toSet()));
        taskDto.setLotoPointReferences(task.getLotoPointReferences().stream().map(lotoPointService::convertToDto).collect(Collectors.toSet()));
        taskDto.setLocationReferences(task.getLocationReferences().stream().map(valueService::convertToDto).collect(Collectors.toSet()));
        return taskDto;
    }

    public Task convertToEntity(TaskDto taskDto) {
        Task task = taskService.getEntityById(taskDto.getId());
        if (taskDto.getName() != null) task.setName(taskDto.getName());
        if (taskDto.getDescription() != null) task.setDescription(taskDto.getDescription());
        if (taskDto.getCompletionLog() != null) task.setCompletionLog(taskDto.getCompletionLog());
        if (taskDto.getStatus() != null) task.setStatus(valueService.convertToEntity(taskDto.getStatus()));
        if (taskDto.getFlow() != null) task.setFlow(flowService.convertToEntity(taskDto.getFlow()));
        if (taskDto.getParentTask() != null) task.setParentTask(convertToEntity(taskDto.getParentTask()));
        if (taskDto.getSubTasks() != null) {
            task.setSubTasks(taskDto.getSubTasks().stream()
                    .map(this::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (taskDto.getPrerequisites() != null) {
            task.setPrerequisites(taskDto.getPrerequisites().stream()
                    .map(this::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (taskDto.getDependents() != null) {
            task.setDependents(taskDto.getDependents().stream()
                    .map(this::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        // Note: References should be handled separately to avoid circular dependencies
        if (taskDto.getFileReferences() != null) {
            task.setFileReferences(taskDto.getFileReferences().stream()
                    .map(fileService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (taskDto.getEquipmentReferences() != null) {
            task.setEquipmentReferences(taskDto.getEquipmentReferences().stream()
                    .map(equipmentService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (taskDto.getLotoPointReferences() != null) {
            task.setLotoPointReferences(taskDto.getLotoPointReferences().stream()
                    .map(lotoPointService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (taskDto.getLocationReferences() != null) {
            task.setLocationReferences(taskDto.getLocationReferences().stream()
                    .map(valueService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        return task;
    }

    public Task convertIdDtoToEntity(TaskIdDto dto) {
        if (dto == null) return null;

        Task task;
        if (dto.getId() == null || dto.getId() == 0) {
            task = new Task();
        } else {
            task = taskService.findById(dto.getId()).orElse(new Task());
        }

        if (dto.getName() != null) task.setName(dto.getName());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getCompletionLog() != null) task.setCompletionLog(dto.getCompletionLog());
        if (dto.getStatus() != null) task.setStatus(valueService.convertToEntity(dto.getStatus()));
        if (dto.getFlow() != null) task.setFlow(flowService.getEntityById(dto.getFlow()));
        if (dto.getParentTask() != null) task.setParentTask(taskService.findById(dto.getParentTask()).orElse(null));
        
        if (dto.getSubTasks() != null) {
            task.getSubTasks().clear();
            dto.getSubTasks().forEach(id -> taskService.findById(id).ifPresent(task.getSubTasks()::add));
        }
        if (dto.getPrerequisites() != null) {
            task.getPrerequisites().clear();
            dto.getPrerequisites().forEach(id -> taskService.findById(id).ifPresent(task.getPrerequisites()::add));
        }
        // Note: Dependents are managed by prerequisites, so we don't set them directly

        // References and transient collections
        if (dto.getFileReferences() != null) {
            task.setFileReferences(dto.getFileReferences().stream()
                    .map(fileService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (dto.getEquipmentReferences() != null) {
            task.setEquipmentReferences(dto.getEquipmentReferences().stream()
                    .map(equipmentService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (dto.getLotoPointReferences() != null) {
            task.setLotoPointReferences(dto.getLotoPointReferences().stream()
                    .map(lotoPointService::convertToEntity)
                    .collect(Collectors.toSet()));
        }
        if (dto.getLocationReferences() != null) {
            task.setLocationReferences(dto.getLocationReferences().stream()
                    .map(valueService::convertToEntity)
                    .collect(Collectors.toSet()));
        }

        return task;
    }

    private TaskReferenceDto convertToTaskReferenceDto(TaskReference reference) {
        // Implement this method based on your TaskReferenceDto structure
        // This is just a placeholder
        return new TaskReferenceDto();
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}