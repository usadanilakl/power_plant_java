package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_point.*;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ng/loto-points/conflicts")
@RequiredArgsConstructor
public class NgLotoPointConflictController {
    private final NgLotoPointService ngLotoPointService;

    /**
     * Get conflict summary with counts per type.
     */
    @GetMapping("/summary")
    public ResponseEntity<NgApiResponse<ConflictSummaryDto>> getConflictSummary() {
        try {
            ConflictSummaryDto summary = ngLotoPointService.getConflictSummary();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(summary, "Conflict summary retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get paginated LOTO points for a specific conflict type.
     */
    @PostMapping("/by-type")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> getConflictsByType(
            @RequestBody ConflictSearchRequest request) {
        try {
            Page<LotoPointDto> results = ngLotoPointService.getConflictsByType(
                    request.getConflictType(),
                    request.getPage() - 1, // Convert 1-indexed to 0-indexed
                    request.getPageSize()
            );
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(results, "Conflicts retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get duplicate tag groups (normalized tag -> list of LOTO points).
     */
    @GetMapping("/duplicate-groups")
    public ResponseEntity<NgApiResponse<List<DuplicateGroupDto>>> getDuplicateTagGroups() {
        try {
            List<DuplicateGroupDto> groups = ngLotoPointService.getDuplicateTagGroups();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(groups, "Duplicate groups retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Merge duplicate LOTO points.
     * Supports single merge (keepId + removeId) or batch merge (keepId + removeIds[]).
     * Transfers relationships from removed points to kept point, then soft-deletes removed points.
     */
    @PostMapping("/merge")
    public ResponseEntity<NgApiResponse<LotoPointDto>> mergeDuplicates(
            @RequestBody MergeRequest request) {
        try {
            LotoPointDto result;
            if (request.getRemoveIds() != null && !request.getRemoveIds().isEmpty()) {
                result = ngLotoPointService.mergeLotoPointsBatch(
                        request.getKeepId(), request.getRemoveIds());
            } else {
                result = ngLotoPointService.mergeLotoPoints(
                        request.getKeepId(), request.getRemoveId());
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "LOTO points merged successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
