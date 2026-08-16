package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftDto;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListDriftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoint powering the "Maximo Field List Drift" panel in JG Portal. Returns a
 * snapshot of six drift buckets — create backlog, cancel backlog, complete backlog,
 * attachment upload backlog, Maximo-closed/local-open, local-closed/Maximo-open — with
 * row-level drill-down. Not gated by the Maximo feature flag so the panel is always
 * mount-able (zero counts when the feature is off).
 *
 * <p>Also exposes per-row retry / accept endpoints so an admin can resolve a stuck row
 * without navigating to the field-list form. Mirrors the sync-drift resolution pattern
 * ({@code NgSyncResolutionController}) — this controller is the Maximo-peer equivalent.
 */
@RestController
@RequestMapping("/ng/admin/maximo-field-list-drift")
@RequiredArgsConstructor
public class NgMaximoFieldListDriftController {

    private final MaximoFieldListDriftService driftService;

    /**
     * Snapshot with per-bucket sample rows. {@code limit} caps rows per bucket (1..200,
     * default 25). Total counts always reflect the full table regardless of limit.
     */
    @GetMapping("/snapshot")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftDto>> snapshot(
            @RequestParam(defaultValue = "25") int limit) {
        try {
            MaximoFieldListDriftDto snap = driftService.snapshot(limit);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(snap, "Maximo field list drift snapshot"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error computing drift snapshot: " + e.getMessage()));
        }
    }

    /** Retry the Maximo submit call for a row stuck in create-pending. */
    @PostMapping("/retry-submit/{id}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> retrySubmit(
            @PathVariable Long id) {
        return okResult(driftService.retrySubmit(id));
    }

    /** Retry the Maximo cancel call for a soft-deleted row stuck in cancel-pending. */
    @PostMapping("/retry-cancel/{id}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> retryCancel(
            @PathVariable Long id) {
        return okResult(driftService.retryCancel(id));
    }

    /** Retry the Maximo WO COMP call for a row stuck in complete-pending. */
    @PostMapping("/retry-complete/{id}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> retryComplete(
            @PathVariable Long id) {
        return okResult(driftService.retryComplete(id));
    }

    /** Retry a single stuck attachment upload. Path id is the PermitAttachment id (not the parent). */
    @PostMapping("/retry-attachment/{attachmentId}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> retryAttachment(
            @PathVariable Long attachmentId) {
        return okResult(driftService.retryAttachment(attachmentId));
    }

    /**
     * Adopt Maximo's terminal status into the local FieldListItem. For rows where Maximo went
     * COMP/CLOSE/CANCELLED via a route outside our bridge and the local mirror is still open.
     * Does NOT touch Maximo — one-way local-catch-up.
     */
    @PostMapping("/accept-maximo-status/{id}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> acceptMaximoStatus(
            @PathVariable Long id) {
        return okResult(driftService.acceptMaximoStatus(id));
    }

    /**
     * Re-push local Closed status to Maximo (re-fires bridge.complete). For rows where the local
     * side is Closed but the WO is still open — bridge.complete failed silently on the original
     * status change. Sets complete-pending so the backfill loop keeps retrying on transient errors.
     */
    @PostMapping("/push-local-close/{id}")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> pushLocalClose(
            @PathVariable Long id) {
        return okResult(driftService.pushLocalClose(id));
    }

    private static ResponseEntity<NgApiResponse<MaximoFieldListDriftService.ResolveResult>> okResult(
            MaximoFieldListDriftService.ResolveResult r) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(r, r.message()));
    }
}
