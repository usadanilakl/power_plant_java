package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkRequestService;
import com.dk_power.power_plant_java.sevice.sharepoint.WorkRequestSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/work-requests-api")
@RequiredArgsConstructor
public class WorkRequestRestController {

    private final NgWorkRequestService workRequestService;
    private final WorkRequestSyncService syncService;
    private final WorkRequestMapper workRequestMapper;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<NgWorkRequestDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<WorkRequest> entityPage = workRequestService.getRepo().findAll(
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "id")));
        Page<NgWorkRequestDto> dtoPage = entityPage.map(workRequestMapper::convertToNgDto);
        return ResponseEntity.ok(new NgApiResponse<>(dtoPage, "Successfully fetched work requests"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> getById(@PathVariable Long id) {
        try {
            NgWorkRequestDto dto = workRequestService.getNgDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Successfully got work request"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/empty")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> getEmpty() {
        return ResponseEntity.ok(new NgApiResponse<>(new NgWorkRequestDto(), "Empty work request DTO"));
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> create(@RequestBody NgWorkRequestDto dto) {
        try {
            NgWorkRequestDto saved = workRequestService.saveFromDto(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "Work request created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to create: " + e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> update(@RequestBody NgWorkRequestDto dto) {
        try {
            NgWorkRequestDto saved = workRequestService.saveFromDto(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "Work request updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to update: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> delete(@PathVariable Long id) {
        try {
            WorkRequest entity = workRequestService.softDelete(id);
            NgWorkRequestDto dto = workRequestMapper.convertToNgDto(entity);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Work request deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to delete: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<NgWorkRequestDto>>> getByStatus(@PathVariable String status) {
        try {
            List<NgWorkRequestDto> dtos = workRequestService.getAllNgDtosByStatus(status);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully got work requests with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<NgWorkRequestDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortBy = criteria.getSortColumn() != null ? criteria.getSortColumn() : "id";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection() : "DESC";
            boolean andLogic = true;

            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Page<WorkRequest> entityPage = workRequestService.complexSearchWithPagination(
                    workRequestService.getRepo(), criteria,
                    PageRequest.of(page - 1, pageSize, Sort.by(direction, sortBy)), andLogic);
            Page<NgWorkRequestDto> dtoPage = entityPage.map(workRequestMapper::convertToNgDto);
            return ResponseEntity.ok(new NgApiResponse<>(dtoPage, "Search completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Search failed: " + e.getMessage()));
        }
    }

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValues(
            @PathVariable String column,
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "true") boolean andLogicEnabled) {
        try {
            Page<String> result = workRequestService.getUniqueValuesFiltered(
                    workRequestService.getRepo(), column, criteria, page - 1, pageSize, andLogicEnabled);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Unique values fetched"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<SyncResult>> triggerSync() {
        try {
            SyncResult result = syncService.syncFromSharePoint();
            String message = String.format("Sync completed: created=%d, updated=%d, autoClosed=%d, failed=%d",
                    result.getCreated(), result.getUpdated(), result.getAutoClosed(), result.getFailed());
            return ResponseEntity.ok(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Sync failed: " + e.getMessage()));
        }
    }

    @GetMapping("/change-status/{id}/{status}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> changeStatus(
            @PathVariable Long id, @PathVariable String status) {
        try {
            NgWorkRequestDto dto = workRequestService.setStatus(id, status);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Status changed to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
