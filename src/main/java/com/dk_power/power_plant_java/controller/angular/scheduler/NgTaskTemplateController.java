package com.dk_power.power_plant_java.controller.angular.scheduler;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskTemplateDto;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.enums.TaskLevel;
import com.dk_power.power_plant_java.enums.TaskType;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgFlowService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgTaskService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.TaskTemplateService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/scheduler/task-templates")
@RequiredArgsConstructor
public class NgTaskTemplateController {
    private final TaskTemplateService templateService;
    private final ValueService valueService;
    private final NgFlowService flowService;
    private final NgTaskService taskService;
    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<TaskTemplateDto>>> getAll() {
        try {
            List<TaskTemplateDto> templates = templateService.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(templates, "Templates retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> getById(@PathVariable Long id) {
        try {
            TaskTemplateDto dto = templateService.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(dto, "Template retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> create(@RequestBody TaskTemplateDto dto) {
        try {
            TaskTemplate template = new TaskTemplate();
            if (dto.getName() != null) template.setName(dto.getName());
            if (dto.getDescription() != null) template.setDescription(dto.getDescription());
            if (dto.getTaskType() != null) template.setTaskType(TaskType.valueOf(dto.getTaskType()));
            if (dto.getStepTemplatesJson() != null) template.setStepTemplatesJson(dto.getStepTemplatesJson());
            if (dto.getDefaultReferenceTypesJson() != null) template.setDefaultReferenceTypesJson(dto.getDefaultReferenceTypesJson());
            if (dto.getDefaultPriority() != null) template.setDefaultPriority(valueService.getEntityById(dto.getDefaultPriority().getId()));

            TaskTemplate saved = templateService.save(template);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> update(@PathVariable Long id, @RequestBody TaskTemplateDto dto) {
        try {
            TaskTemplate existing = templateService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();

            if (dto.getName() != null) existing.setName(dto.getName());
            if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
            if (dto.getTaskType() != null) existing.setTaskType(TaskType.valueOf(dto.getTaskType()));
            if (dto.getStepTemplatesJson() != null) existing.setStepTemplatesJson(dto.getStepTemplatesJson());
            if (dto.getDefaultReferenceTypesJson() != null) existing.setDefaultReferenceTypesJson(dto.getDefaultReferenceTypesJson());
            if (dto.getDefaultPriority() != null) existing.setDefaultPriority(valueService.getEntityById(dto.getDefaultPriority().getId()));

            TaskTemplate saved = templateService.save(existing);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/instantiate")
    public ResponseEntity<NgApiResponse<TaskDto>> instantiate(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            TaskTemplate template = templateService.getEntityById(id);
            if (template == null) return ResponseEntity.notFound().build();

            Long flowId = Long.valueOf(body.get("flowId").toString());
            Flow flow = flowService.getEntityById(flowId);
            if (flow == null) return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Flow not found"));

            // Create the parent task from template
            Task task = new Task();
            task.setName(template.getName());
            task.setDescription(template.getDescription());
            task.setTaskLevel(TaskLevel.TASK);
            task.setTaskType(template.getTaskType() != null ? template.getTaskType() : TaskType.ONE_TIME);
            task.setFlow(flow);
            task.setTemplate(template);
            if (template.getDefaultPriority() != null) task.setPriority(template.getDefaultPriority());
            Task savedTask = taskService.save(task);

            // Create steps from stepTemplatesJson
            if (template.getStepTemplatesJson() != null && !template.getStepTemplatesJson().isEmpty()) {
                List<Map<String, Object>> stepDefs = objectMapper.readValue(
                        template.getStepTemplatesJson(), new TypeReference<>() {});
                int order = 0;
                for (Map<String, Object> stepDef : stepDefs) {
                    Task step = new Task();
                    step.setName((String) stepDef.getOrDefault("name", "Step " + (order + 1)));
                    step.setDescription((String) stepDef.get("description"));
                    step.setTaskLevel(TaskLevel.STEP);
                    step.setTaskType(savedTask.getTaskType());
                    step.setFlow(flow);
                    step.setParentTask(savedTask);
                    step.setSortOrder(stepDef.containsKey("sortOrder") ?
                            Integer.valueOf(stepDef.get("sortOrder").toString()) : order);
                    taskService.save(step);
                    order++;
                }
            }

            // Reload to get steps included
            Task reloaded = taskService.getEntityById(savedTask.getId());
            TaskDto result = taskMapper.convertToDto(reloaded);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Task created from template", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> delete(@PathVariable Long id) {
        try {
            TaskTemplate existing = templateService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();
            TaskTemplate deleted = templateService.softDelete(existing);
            TaskTemplateDto result = templateService.toDto(deleted);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
