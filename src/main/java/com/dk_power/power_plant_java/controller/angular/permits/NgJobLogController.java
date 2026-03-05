package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJobLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/job-logs")
@RequiredArgsConstructor
public class NgJobLogController {

    private final NgJobLogService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<JobLogDto>>> getAll() {
        try {
            List<JobLogDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Job logs retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<JobLogDto>> getById(@PathVariable String id) {
        try {
            JobLogDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Job log retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<JobLogDto>> create(@RequestBody JobLogDto dto) {
        try {
            JobLogDto created = service.createJob(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Job log created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/update/{id}")
    public ResponseEntity<NgApiResponse<JobLogDto>> update(@PathVariable String id, @RequestBody JobLogDto dto) {
        try {
            JobLogDto updated = service.updateJob(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Job log updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/create-from-work-request/{workRequestId}")
    public ResponseEntity<NgApiResponse<JobLogDto>> createFromWorkRequest(@PathVariable String workRequestId) {
        try {
            JobLogDto created = service.createJobFromWorkRequest(workRequestId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Job created from work request", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{jobId}/add-package")
    public ResponseEntity<NgApiResponse<JobLogDto>> addPackage(@PathVariable String jobId, @RequestBody DailyPermitPackageDto packageDto) {
        try {
            JobLogDto updated = service.addDailyPackage(jobId, packageDto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Package added to job", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{jobId}/packages/{packageId}")
    public ResponseEntity<NgApiResponse<JobLogDto>> removePackage(@PathVariable String jobId, @PathVariable String packageId) {
        try {
            JobLogDto updated = service.removePackageFromJob(jobId, packageId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Package removed from job", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{jobId}/create-package")
    public ResponseEntity<NgApiResponse<JobLogDto>> createPackage(@PathVariable String jobId) {
        try {
            JobLogDto updated = service.createEmptyPackageForJob(jobId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Package created for job", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/by-package/{packageId}")
    public ResponseEntity<NgApiResponse<JobLogDto>> getByPackageId(@PathVariable String packageId) {
        try {
            JobLogDto dto = service.getByPackageId(packageId);
            if (dto == null) return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "No parent job found", LocalDateTime.now()));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Parent job found", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{jobId}/close")
    public ResponseEntity<NgApiResponse<JobLogDto>> closeJob(@PathVariable String jobId) {
        try {
            JobLogDto updated = service.closeJob(jobId);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Job closed successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
