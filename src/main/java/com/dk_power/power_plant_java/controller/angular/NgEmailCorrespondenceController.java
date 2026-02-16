package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.base_dtos.EmailCorrespondenceDto;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.angular.NgEmailCorrespondenceService;
import com.dk_power.power_plant_java.sevice.email.EmailPollingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for EmailCorrespondence.
 * Provides endpoints for querying, searching, and managing email correspondence.
 */
@RestController
@RequestMapping("/ng/email-correspondence")
@RequiredArgsConstructor
@Slf4j
public class NgEmailCorrespondenceController {
    private final NgEmailCorrespondenceService service;
    private final EmailPollingService emailPollingService;

    /**
     * Get correspondence for a specific entity (polymorphic query)
     * Example: GET /ng/email-correspondence/WorkRequest/123
     *
     * @param entityType The type of entity (e.g., "WorkRequest", "LotoPoint")
     * @param entityId The ID of the entity
     * @return List of correspondence for that entity
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<List<EmailCorrespondenceDto>>>
        getForEntity(@PathVariable String entityType, @PathVariable Long entityId) {
        log.debug("[EmailCorrespondence] Getting correspondence for {} #{}", entityType, entityId);
        List<EmailCorrespondenceDto> dtos = service.getCorrespondenceForEntity(entityType, entityId);
        return ResponseEntity.ok(new NgApiResponse<>(dtos, "Retrieved " + dtos.size() + " correspondence items"));
    }

    /**
     * Search correspondence with criteria (for dedicated page)
     *
     * @param criteria Search criteria (filters, sort, etc.)
     * @param page Page number (1-indexed)
     * @param pageSize Number of items per page
     * @return Page of correspondence DTOs
     */
    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<EmailCorrespondenceDto>>>
        search(@RequestBody SearchCriteria criteria,
               @RequestParam(defaultValue = "1") int page,
               @RequestParam(defaultValue = "50") int pageSize) {
        log.debug("[EmailCorrespondence] Searching with criteria: {}", criteria);

        // Use complexSearch from NgCrudService
        Page<EmailCorrespondenceDto> dtoPage = service.complexSearch(
            criteria,
            page - 1,  // complexSearch uses 0-based paging
            pageSize,
            "sentDateTime",  // default sort by date
            "DESC",  // most recent first
            true  // AND logic
        );

        return ResponseEntity.ok(new NgApiResponse<>(dtoPage, "Search complete"));
    }

    /**
     * Mark correspondence as read
     *
     * @param id The correspondence ID
     * @return Success response
     */
    @PostMapping("/{id}/mark-read")
    public ResponseEntity<NgApiResponse<Void>> markRead(@PathVariable Long id) {
        log.debug("[EmailCorrespondence] Marking correspondence {} as read", id);
        service.markAsRead(id);
        return ResponseEntity.ok(new NgApiResponse<>(null, "Marked as read"));
    }

    /**
     * Manual trigger for email polling (for testing/on-demand refresh)
     *
     * @return Success response
     */
    @PostMapping("/poll")
    public ResponseEntity<NgApiResponse<Void>> triggerPoll() {
        log.info("[EmailCorrespondence] Manual poll triggered via API");
        emailPollingService.triggerManualPoll();
        return ResponseEntity.ok(new NgApiResponse<>(null, "Poll triggered"));
    }

    /**
     * Count unread correspondence for an entity
     *
     * @param entityType The type of entity
     * @param entityId The ID of the entity
     * @return Count of unread correspondence
     */
    @GetMapping("/{entityType}/{entityId}/unread-count")
    public ResponseEntity<NgApiResponse<Long>>
        getUnreadCount(@PathVariable String entityType, @PathVariable Long entityId) {
        log.debug("[EmailCorrespondence] Getting unread count for {} #{}", entityType, entityId);
        long count = service.countUnreadForEntity(entityType, entityId);
        return ResponseEntity.ok(new NgApiResponse<>(count, "Unread count retrieved"));
    }
}
