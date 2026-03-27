package com.dk_power.power_plant_java.controller.angular.scheduler;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskIdDto;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/scheduler/tasks")
@RequiredArgsConstructor
public class NgTaskController {
    private final NgTaskService taskService;
    private final TaskMapper taskMapper;
    private final FileRepo fileRepo;

    @Value("${files.relative.path}")
    private String filesRelativePath;

    @GetMapping("/by-flow/{flowId}")
    public ResponseEntity<NgApiResponse<List<TaskDto>>> getByFlow(@PathVariable Long flowId) {
        try {
            List<TaskDto> tasks = taskService.getTasksByFlowId(flowId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(tasks, "Tasks retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<TaskDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<TaskDto> tasks = taskService.getAll(page - 1, pageSize);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(tasks, "Tasks retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskDto>> getById(@PathVariable Long id) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();
            TaskDto dto = taskMapper.convertToDto(task);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(dto, "Task retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<TaskDto>> create(@RequestBody TaskIdDto dto) {
        try {
            Task saved = taskService.saveFromIdDto(dto);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Task created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskDto>> update(@PathVariable Long id, @RequestBody TaskIdDto dto) {
        try {
            Task existing = taskService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();
            dto.setId(id);
            Task saved = taskService.saveFromIdDto(dto);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Task updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskDto>> delete(@PathVariable Long id) {
        try {
            Task existing = taskService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();
            Task deleted = taskService.softDelete(existing);
            TaskDto result = taskMapper.convertToDto(deleted);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Task deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}/prerequisites")
    public ResponseEntity<NgApiResponse<TaskDto>> updatePrerequisites(
            @PathVariable Long id, @RequestBody List<Long> prerequisiteIds) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();
            task.getPrerequisites().clear();
            prerequisiteIds.forEach(pid -> taskService.findById(pid).ifPresent(task.getPrerequisites()::add));
            Task saved = taskService.save(task);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Prerequisites updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NgApiResponse<TaskDto>> uploadAttachment(
            @PathVariable Long id, @RequestPart("file") MultipartFile file) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();

            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf(".") + 1);
            }

            // Store file on disk (use profile-specific folder)
            String folder = "scheduler/task-" + id;
            String baseDir = System.getProperty("user.dir") + "/" + filesRelativePath + "/" + folder + "/";
            Path dir = Paths.get(baseDir);
            Files.createDirectories(dir);
            Path filePath = dir.resolve(originalName != null ? originalName : "file");
            file.transferTo(filePath.toFile());

            // Create FileObject record (URL uses /uploads/ which resource handler maps to profile folder)
            FileObject fileObj = new FileObject();
            fileObj.setName(originalName);
            fileObj.setExtension(ext);
            fileObj.setFolder(folder);
            fileObj.setBaseLink(filesRelativePath);
            fileObj.setFileLink("uploads/" + folder + "/" + originalName);
            fileRepo.save(fileObj);

            // Link to task
            task.getAttachments().add(fileObj);
            Task saved = taskService.save(task);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Attachment uploaded", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/attachments/{fileId}")
    public ResponseEntity<NgApiResponse<TaskDto>> removeAttachment(
            @PathVariable Long id, @PathVariable Long fileId) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();

            task.getAttachments().removeIf(f -> f.getId().equals(fileId));
            Task saved = taskService.save(task);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Attachment removed", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/references")
    public ResponseEntity<NgApiResponse<TaskDto>> addReference(
            @PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();

            String referenceType = (String) body.get("referenceType");
            Long referenceId = Long.valueOf(body.get("referenceId").toString());

            task.addReference(referenceType, referenceId);
            Task saved = taskService.save(task);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Reference added", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/references/{refId}")
    public ResponseEntity<NgApiResponse<TaskDto>> removeReference(
            @PathVariable Long id, @PathVariable Long refId) {
        try {
            Task task = taskService.getEntityById(id);
            if (task == null) return ResponseEntity.notFound().build();

            task.getReferences().removeIf(r -> r.getId().equals(refId));
            Task saved = taskService.save(task);
            TaskDto result = taskMapper.convertToDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Reference removed", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<TaskDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "dateCreated";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "desc";
            Page<TaskDto> results = taskService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(results, "Search completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
