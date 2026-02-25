package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.NgJhaDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.permits.JhaMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJhaService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/jha-api")
@RequiredArgsConstructor
public class JhaRestController {

    private final NgJhaService jhaService;
    private final JhaMapper jhaMapper;
    private final SharePointSyncOrchestrator syncOrchestrator;
    private final JdbcTemplate jdbcTemplate;
    private final PermitAttachmentRepo permitAttachmentRepo;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<NgJhaDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<Jha> entityPage = jhaService.getRepo().findAll(
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "id")));
        Page<NgJhaDto> dtoPage = entityPage.map(jhaMapper::convertToNgDto);
        return ResponseEntity.ok(new NgApiResponse<>(dtoPage, "Successfully fetched JHAs"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<NgJhaDto>> getById(@PathVariable Long id) {
        try {
            NgJhaDto dto = jhaService.getNgDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Successfully got JHA"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/empty")
    public ResponseEntity<NgApiResponse<NgJhaDto>> getEmpty() {
        return ResponseEntity.ok(new NgApiResponse<>(new NgJhaDto(), "Empty JHA DTO"));
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<NgJhaDto>> create(@RequestBody NgJhaDto dto) {
        try {
            NgJhaDto saved = jhaService.saveFromDto(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "JHA created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to create: " + e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<NgJhaDto>> update(@RequestBody NgJhaDto dto) {
        try {
            NgJhaDto saved = jhaService.saveFromDto(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "JHA updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to update: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<NgJhaDto>> delete(@PathVariable Long id) {
        try {
            Jha entity = jhaService.softDelete(id);
            NgJhaDto dto = jhaMapper.convertToNgDto(entity);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "JHA deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to delete: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<NgJhaDto>>> getByStatus(@PathVariable String status) {
        try {
            List<NgJhaDto> dtos = jhaService.getAllNgDtosByStatus(status);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully got JHAs with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-work-request/{workRequestId}")
    public ResponseEntity<NgApiResponse<List<NgJhaDto>>> getByWorkRequest(@PathVariable Long workRequestId) {
        try {
            List<NgJhaDto> dtos = jhaService.getByWorkRequestId(workRequestId);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully got JHAs for work request"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<NgJhaDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortBy = criteria.getSortColumn() != null ? criteria.getSortColumn() : "id";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection() : "DESC";

            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Page<Jha> entityPage = jhaService.complexSearchWithPagination(
                    jhaService.getRepo(), criteria,
                    PageRequest.of(page - 1, pageSize, Sort.by(direction, sortBy)), true);
            Page<NgJhaDto> dtoPage = entityPage.map(jhaMapper::convertToNgDto);
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
            Page<String> result = jhaService.getUniqueValuesFiltered(
                    jhaService.getRepo(), column, criteria, page - 1, pageSize, andLogicEnabled);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Unique values fetched"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<PermitAttachment>>> getAttachments(@PathVariable Long id) {
        try {
            List<PermitAttachment> attachments = permitAttachmentRepo.findByEntityTypeAndEntityId("Jha", id);
            return ResponseEntity.ok(new NgApiResponse<>(attachments, "Attachments fetched"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/revoke/{id}")
    public ResponseEntity<NgApiResponse<NgJhaDto>> revokeJha(@PathVariable Long id) {
        try {
            NgJhaDto dto = jhaService.revokeJha(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "JHA revoked"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to revoke: " + e.getMessage()));
        }
    }

    @GetMapping("/change-status/{id}/{status}")
    public ResponseEntity<NgApiResponse<NgJhaDto>> changeStatus(
            @PathVariable Long id, @PathVariable String status) {
        try {
            NgJhaDto dto = jhaService.setStatus(id, status);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Status changed to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/db-check")
    public ResponseEntity<NgApiResponse<java.util.Map<String, Object>>> debugDbCheck() {
        java.util.Map<String, Object> info = new java.util.LinkedHashMap<>();
        try {
            Long totalCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM JHA", Long.class);
            Long activeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM JHA WHERE DELETED = FALSE", Long.class);
            Long deletedCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM JHA WHERE DELETED = TRUE", Long.class);
            info.put("totalRows", totalCount);
            info.put("activeRows", activeCount);
            info.put("deletedRows", deletedCount);

            var rows = jdbcTemplate.queryForList(
                    "SELECT ID, JOB_NAME, LOCAL_UUID, DELETED, SHAREPOINT_ID, DATE_CREATED FROM JHA ORDER BY ID DESC");
            info.put("rows", rows.size() > 20 ? rows.subList(0, 20) : rows);

            Long wrCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM WORK_REQUEST", Long.class);
            info.put("workRequestTotalRows", wrCount);

            String dbUrl = jdbcTemplate.queryForObject("CALL DATABASE_PATH()", String.class);
            info.put("databasePath", dbUrl);
        } catch (Exception e) {
            info.put("error", e.getMessage());
        }
        return ResponseEntity.ok(new NgApiResponse<>(info, "DB diagnostic"));
    }

    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<SyncResult>> triggerSync() {
        try {
            SyncResult result = syncOrchestrator.syncEntityType("Jha");
            String message = String.format("Sync completed: created=%d, updated=%d, failed=%d",
                    result.getCreated(), result.getUpdated(), result.getFailed());
            return ResponseEntity.ok(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Sync failed: " + e.getMessage()));
        }
    }
}
