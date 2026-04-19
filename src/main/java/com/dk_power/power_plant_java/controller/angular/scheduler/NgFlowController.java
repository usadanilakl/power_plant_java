package com.dk_power.power_plant_java.controller.angular.scheduler;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.scheduler.FlowDto;
import com.dk_power.power_plant_java.dto.scheduler.FlowIdDto;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgFlowService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/scheduler/flows")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class NgFlowController {
    private final NgFlowService flowService;
    private final ValueService valueService;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<FlowDto>>> getAll() {
        try {
            List<FlowDto> flows = flowService.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(flows, "Flows retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<FlowDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<FlowDto> flows = flowService.getAll(page - 1, pageSize);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(flows, "Flows retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<FlowDto>> getById(@PathVariable Long id) {
        try {
            FlowDto dto = flowService.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(dto, "Flow retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<FlowDto>> create(@RequestBody FlowIdDto dto) {
        try {
            Flow flow = new Flow();
            if (dto.getName() != null) flow.setName(dto.getName());
            if (dto.getDescription() != null) flow.setDescription(dto.getDescription());
            if (dto.getStatusId() != null) flow.setStatus(valueService.getEntityById(dto.getStatusId()));

            Flow saved = flowService.save(flow);
            FlowDto result = flowService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Flow created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<FlowDto>> update(@PathVariable Long id, @RequestBody FlowIdDto dto) {
        try {
            Flow existing = flowService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();

            if (dto.getName() != null) existing.setName(dto.getName());
            if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
            if (dto.getStatusId() != null) existing.setStatus(valueService.getEntityById(dto.getStatusId()));

            Flow saved = flowService.save(existing);
            FlowDto result = flowService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Flow updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Long>> delete(@PathVariable Long id) {
        try {
            Flow existing = flowService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();
            flowService.softDelete(existing);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(id, "Flow deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<FlowDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "dateCreated";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "desc";
            Page<FlowDto> results = flowService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(results, "Search completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
