package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaInsulationCompleteRequest;
import com.dk_power.power_plant_java.dto.pwa.PwaInsulationItemDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.sevice.pwa.PwaInsulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * PWA endpoints for insulation contractors. Access is gated by SecurityConfig to
 * {@code ROLE_INSULATION}, {@code ROLE_PLANT}, or {@code ROLE_ADMIN} on
 * {@code /api/pwa/secured/insulation/**} — plant supervisors can see the same queue.
 *
 * Two operations only:
 *   GET  /active       — list of active insulation WOs across the plant
 *   POST /{id}/complete — mark done, COMPs the Maximo WO
 *
 * Deliberately minimal — contractors don't submit new field lists (that path lives
 * at {@code /api/pwa/field-list-item/**}, gated to PLANT+ADMIN only).
 */
@RestController
@RequestMapping("/api/pwa/secured/insulation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaInsulationController {

    private final PwaInsulationService insulationService;

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<PwaInsulationItemDto>>> listActive() {
        try {
            List<PwaInsulationItemDto> items = insulationService.listActive();
            return ResponseEntity.ok(new NgApiResponse<>(items,
                    "Active insulation items: " + items.size()));
        } catch (Exception e) {
            log.error("[PwaInsulation] listActive failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to load: " + e.getMessage()));
        }
    }

    /**
     * Recently-closed insulation items — powers the "Show recently closed" toggle on the
     * contractor list so an accidental complete can be reopened. Query param {@code days}
     * caps the lookback window (default 30, max 90); anything older is out of scope for a
     * contractor undo. Uses the same DTO shape as {@link #listActive} so the client can
     * merge the two lists into one view.
     */
    @GetMapping("/recent-closed")
    public ResponseEntity<NgApiResponse<List<PwaInsulationItemDto>>> listRecentClosed(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer days) {
        try {
            List<PwaInsulationItemDto> items = insulationService.listRecentClosed(days);
            return ResponseEntity.ok(new NgApiResponse<>(items,
                    "Recently closed insulation items: " + items.size()));
        } catch (Exception e) {
            log.error("[PwaInsulation] listRecentClosed failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to load: " + e.getMessage()));
        }
    }

    /**
     * Complete an insulation item. Body is optional to keep the old "just close it" one-tap
     * path working; when supplied, {@code comment} goes to the WO worklog + status memo and
     * each {@code attachments} entry is saved to H2 + pushed to SharePoint + uploaded to the
     * Maximo WO as a doclink (event-driven). See {@link PwaInsulationService#markCompleteWithDetails}.
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<NgApiResponse<Boolean>> markComplete(
            @PathVariable Long id,
            @RequestBody(required = false) PwaInsulationCompleteRequest body) {
        try {
            boolean hasExtras = body != null && (
                    (body.getComment() != null && !body.getComment().isBlank())
                            || (body.getAttachments() != null && !body.getAttachments().isEmpty()));
            boolean ok = hasExtras
                    ? insulationService.markCompleteWithDetails(id, currentUserHandle(),
                            body.getComment(), body.getAttachments())
                    : insulationService.markComplete(id, currentUserHandle());
            return ResponseEntity.ok(new NgApiResponse<>(ok, ok
                    ? "WO closed"
                    : "Could not close WO — see hub logs"));
        } catch (Exception e) {
            log.error("[PwaInsulation] markComplete id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(false, "Failed to complete: " + e.getMessage()));
        }
    }

    /**
     * Save contractor progress WITHOUT completing the WO — appends the comment to local
     * notes + the Maximo WO worklog, and persists new photos to H2 + SharePoint + Maximo
     * doclinks. Lets contractors capture photos + notes across multiple visits without
     * being forced to close the WO to make anything stick. Same request shape as
     * {@link #markComplete} so the client can reuse the DTO.
     */
    @PostMapping("/{id}/save-progress")
    public ResponseEntity<NgApiResponse<Boolean>> saveProgress(
            @PathVariable Long id,
            @RequestBody(required = false) PwaInsulationCompleteRequest body) {
        try {
            String comment = body == null ? null : body.getComment();
            var attachments = body == null ? null : body.getAttachments();
            boolean anything = (comment != null && !comment.isBlank())
                    || (attachments != null && !attachments.isEmpty());
            if (!anything) {
                return ResponseEntity.ok(new NgApiResponse<>(false, "Nothing to save"));
            }
            boolean ok = insulationService.savePartialProgress(id, currentUserHandle(), comment, attachments);
            return ResponseEntity.ok(new NgApiResponse<>(ok, ok
                    ? "Progress saved"
                    : "Could not save progress — see hub logs"));
        } catch (Exception e) {
            log.error("[PwaInsulation] saveProgress id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(false, "Save failed: " + e.getMessage()));
        }
    }

    /**
     * Live-refresh one item's cached Maximo status by probing the WO. Returns the updated
     * item so the PWA dialog / list can show the fresh status without waiting up to 60s for
     * the passive status-poll job to catch up. Motivated by ops-side reopens (COMP → WAPPR
     * done in Maximo Web UI) that left the cached maximoStatus stale, hiding the item from
     * the contractor's active queue and producing false-positive drift.
     */
    @PostMapping("/{id}/refresh-status")
    public ResponseEntity<NgApiResponse<PwaInsulationItemDto>> refreshStatus(@PathVariable Long id) {
        try {
            PwaInsulationItemDto fresh = insulationService.refreshMaximoStatus(id);
            if (fresh == null) return ResponseEntity.ok(new NgApiResponse<>(null, "Item not found"));
            return ResponseEntity.ok(new NgApiResponse<>(fresh, "Refreshed"));
        } catch (Exception e) {
            log.error("[PwaInsulation] refreshStatus id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Refresh failed: " + e.getMessage()));
        }
    }

    /**
     * Reopen a closed insulation item. Sets local FieldListStatus back to "Open" + clears
     * the contractor-close markers + pushes to SharePoint. Does NOT reopen the Maximo WO —
     * COMP is terminal on this tenant's OSLC API, so ops must reopen manually in Maximo if
     * the mistake needs to propagate. The response message calls that out.
     */
    @PostMapping("/{id}/reopen")
    public ResponseEntity<NgApiResponse<Boolean>> reopen(@PathVariable Long id) {
        try {
            String note = insulationService.reopen(id);
            boolean ok = note == null || !note.startsWith("Item ");
            String msg = note == null ? "Reopened" : note;
            return ResponseEntity.ok(new NgApiResponse<>(ok, msg));
        } catch (Exception e) {
            log.error("[PwaInsulation] reopen id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(false, "Failed to reopen: " + e.getMessage()));
        }
    }

    /**
     * Attachments (photos / docs) for one insulation item — powers the details dialog's
     * inline image grid. Enforces the listType gate service-side so contractors can't fish
     * attachments from other feature rows through this endpoint. Never throws — a not-found
     * or wrong-type id returns [].
     */
    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> listAttachments(@PathVariable Long id) {
        try {
            List<PermitAttachment> atts = insulationService.listAttachments(id);
            List<Map<String, Object>> out = new java.util.ArrayList<>();
            for (PermitAttachment a : atts) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", a.getId());
                row.put("fileName", a.getFileName());
                row.put("contentType", a.getContentType());
                row.put("base64Content", a.getBase64Content());
                out.add(row);
            }
            return ResponseEntity.ok(new NgApiResponse<>(out, out.size() + " attachment(s)"));
        } catch (Exception e) {
            log.error("[PwaInsulation] listAttachments id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed to load attachments"));
        }
    }

    /**
     * Best-effort attribution — used in the memo passed to Maximo's changeStatus. Returns null
     * if security context is empty (shouldn't happen inside /secured but defensive since a
     * SecurityContext holder call can theoretically return null).
     */
    private static String currentUserHandle() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getName() == null || a.getName().isBlank()) return null;
        return a.getName();
    }
}
