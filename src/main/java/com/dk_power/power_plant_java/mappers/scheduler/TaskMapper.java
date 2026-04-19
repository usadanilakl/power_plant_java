package com.dk_power.power_plant_java.mappers.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskIdDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskReferenceDto;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.scheduler.TaskReference;
import com.dk_power.power_plant_java.enums.TaskLevel;
import com.dk_power.power_plant_java.enums.TaskType;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgFlowService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgTaskService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.TaskTemplateService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.hibernate.Hibernate;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class TaskMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final NgTaskService taskService;
    private final NgFlowService flowService;
    private final FileService fileService;
    private final NgUserService userService;
    private final TaskTemplateService taskTemplateService;

    public TaskMapper(ModelMapper modelMapper, ValueService valueService, @Lazy NgTaskService taskService,
                      @Lazy NgFlowService flowService, @Lazy FileService fileService,
                      @Lazy NgUserService userService, @Lazy TaskTemplateService taskTemplateService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.taskService = taskService;
        this.flowService = flowService;
        this.fileService = fileService;
        this.userService = userService;
        this.taskTemplateService = taskTemplateService;
    }

    public TaskDto convertToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setNotes(task.getNotes());
        dto.setTaskLevel(task.getTaskLevel() != null ? task.getTaskLevel().name() : null);
        dto.setTaskType(task.getTaskType() != null ? task.getTaskType().name() : null);
        dto.setDueDate(task.getDueDate());
        dto.setSortOrder(task.getSortOrder());
        dto.setWarning(task.getWarning());
        dto.setCaution(task.getCaution());
        dto.setRequiresSignoff(task.getRequiresSignoff());
        dto.setExpectedDurationMinutes(task.getExpectedDurationMinutes());
        dto.setDateCreated(task.getDateCreated());
        dto.setDateModified(task.getDateModified());

        dto.setStatusName(task.getStatusName());
        if (task.getFlow() != null) dto.setFlowId(task.getFlow().getId());
        if (task.getParentTask() != null) dto.setParentTaskId(task.getParentTask().getId());
        try { if (Hibernate.isInitialized(task.getAssignee()) && task.getAssignee() != null) dto.setAssignee(userService.toDto(task.getAssignee())); } catch (Exception ignored) {}
        try { if (Hibernate.isInitialized(task.getPriority()) && task.getPriority() != null) dto.setPriority(valueService.convertToDto(task.getPriority())); } catch (Exception ignored) {}
        try { if (Hibernate.isInitialized(task.getTemplate()) && task.getTemplate() != null) dto.setTemplate(taskTemplateService.toDto(task.getTemplate())); } catch (Exception ignored) {}

        try { dto.setSubTasks(task.getSubTasks().stream().map(this::convertToDto).collect(Collectors.toSet())); } catch (Exception ignored) {}
        try { dto.setPrerequisites(task.getPrerequisites().stream().map(this::convertToShallowDto).collect(Collectors.toSet())); } catch (Exception ignored) {}
        try { dto.setDependents(task.getDependents().stream().map(this::convertToShallowDto).collect(Collectors.toSet())); } catch (Exception ignored) {}
        try { dto.setReferences(task.getReferences().stream().map(this::convertToRefDto).collect(Collectors.toSet())); } catch (Exception ignored) {}
        try { dto.setAttachments(task.getAttachments().stream().map(fileService::convertToDto).collect(Collectors.toSet())); } catch (Exception ignored) {}

        return dto;
    }

    private TaskDto convertToShallowDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setTaskLevel(task.getTaskLevel() != null ? task.getTaskLevel().name() : null);
        dto.setStatusName(task.getStatusName());
        return dto;
    }

    private TaskReferenceDto convertToRefDto(TaskReference ref) {
        TaskReferenceDto dto = new TaskReferenceDto();
        dto.setId(ref.getId());
        dto.setReferenceType(ref.getReferenceType());
        dto.setReferenceId(ref.getReferenceId());
        dto.setTaskId(ref.getTask().getId());
        return dto;
    }

    public Task convertIdDtoToEntity(TaskIdDto idDto) {
        if (idDto == null) return null;

        Task task;
        if (idDto.getId() == null || idDto.getId() == 0) {
            task = new Task();
        } else {
            task = taskService.findById(idDto.getId()).orElse(new Task());
        }

        if (idDto.getName() != null) task.setName(idDto.getName());
        if (idDto.getDescription() != null) task.setDescription(idDto.getDescription());
        if (idDto.getNotes() != null) task.setNotes(idDto.getNotes());
        if (idDto.getTaskLevel() != null) task.setTaskLevel(TaskLevel.valueOf(idDto.getTaskLevel()));
        if (idDto.getTaskType() != null) task.setTaskType(TaskType.valueOf(idDto.getTaskType()));
        if (idDto.getDueDate() != null) task.setDueDate(idDto.getDueDate());
        if (idDto.getSortOrder() != null) task.setSortOrder(idDto.getSortOrder());
        if (idDto.getWarning() != null) task.setWarning(idDto.getWarning());
        if (idDto.getCaution() != null) task.setCaution(idDto.getCaution());
        if (idDto.getRequiresSignoff() != null) task.setRequiresSignoff(idDto.getRequiresSignoff());
        if (idDto.getExpectedDurationMinutes() != null) task.setExpectedDurationMinutes(idDto.getExpectedDurationMinutes());

        if (idDto.getStatusName() != null) task.setStatusName(idDto.getStatusName());
        if (idDto.getFlowId() != null) task.setFlow(flowService.getEntityById(idDto.getFlowId()));
        if (idDto.getParentTaskId() != null) task.setParentTask(taskService.getEntityById(idDto.getParentTaskId()));
        if (idDto.getAssigneeId() != null) task.setAssignee(userService.getEntityById(idDto.getAssigneeId()));
        if (idDto.getPriorityId() != null) task.setPriority(valueService.getEntityById(idDto.getPriorityId()));
        if (idDto.getTemplateId() != null) task.setTemplate(taskTemplateService.getEntityById(idDto.getTemplateId()));

        if (idDto.getPrerequisiteIds() != null) {
            task.getPrerequisites().clear();
            idDto.getPrerequisiteIds().forEach(id -> taskService.findById(id).ifPresent(task.getPrerequisites()::add));
        }
        if (idDto.getAttachmentIds() != null) {
            task.getAttachments().clear();
            idDto.getAttachmentIds().forEach(id -> {
                var file = fileService.getEntityById(id);
                if (file != null) task.getAttachments().add(file);
            });
        }

        return task;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
