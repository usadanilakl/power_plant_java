package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.sevice.hub.HubAttachmentService;
import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Hub attachment REST controller — matches sync-server's AttachmentSyncController API contract.
 * Only active when sync.role=hub.
 *
 * Endpoints consumed by AttachmentSyncHandler on client instances:
 *   POST /api/attachments/upload
 *   GET  /api/attachments/pending
 *   GET  /api/attachments/download/{id}
 */
@RestController
@RequestMapping("/api/attachments")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubAttachmentController {

    private final HubAttachmentService hubAttachmentService;
    private final HubSseService hubSseService;

    /**
     * Accept an attachment upload from a client.
     * Body: JSON with entityType, entityId, fileName, contentType, attachmentType, base64Content, originMachineId.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestBody Map<String, Object> body) {

        String entityType = (String) body.get("entityType");
        Number entityIdNum = (Number) body.get("entityId");
        String fileName = (String) body.get("fileName");
        String contentType = (String) body.get("contentType");
        String attachmentType = (String) body.get("attachmentType");
        String base64Content = (String) body.get("base64Content");
        String contentHash = (String) body.get("contentHash");
        String originMachineId = (String) body.get("originMachineId");
        Boolean deletedFlag = (Boolean) body.get("deleted");
        boolean deleted = Boolean.TRUE.equals(deletedFlag);
        String origin = (String) body.get("origin");

        // For tombstones the bytes are absent; the hub only needs identity to find the row to
        // mark deleted. For a live upload the base64 is still required.
        if (entityType == null || entityIdNum == null || fileName == null || (!deleted && base64Content == null)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Missing required fields: entityType, entityId, fileName" + (deleted ? "" : ", base64Content"),
                "success", false));
        }

        // Use the header machineId as origin if not specified in body
        if (originMachineId == null || originMachineId.isEmpty()) {
            originMachineId = machineId;
        }

        PermitAttachment saved = hubAttachmentService.storeAttachment(
            entityType, entityIdNum.longValue(), fileName,
            contentType, attachmentType, base64Content, contentHash, originMachineId, deleted, origin);

        // Broadcast to other SSE clients
        hubSseService.broadcastFileUpload(entityType, entityIdNum.longValue(),
            fileName, saved.getId(), machineId);

        return ResponseEntity.ok(Map.of("success", true, "id", saved.getId()));
    }

    /**
     * Return attachments not yet downloaded by this client (metadata only, no base64).
     * Matches sync-server's GET /api/attachments/pending.
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingAttachments(@RequestHeader("X-Machine-Id") String machineId) {
        List<com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo.PendingAttachmentView> pending =
            hubAttachmentService.getPendingFor(machineId);

        // Return metadata only — no base64Content (client downloads individually)
        List<Map<String, Object>> result = pending.stream().map(att -> {
            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("id", att.getId());
            meta.put("entityType", att.getEntityType());
            meta.put("entityId", att.getEntityId());
            meta.put("fileName", att.getFileName());
            meta.put("contentType", att.getContentType());
            meta.put("attachmentType", att.getAttachmentType());
            meta.put("originMachineId", att.getOriginMachineId());
            meta.put("deleted", att.isDeleted());
            meta.put("origin", att.getOrigin());
            meta.put("createdAt", att.getCreatedAt() != null ? att.getCreatedAt().toString() : null);
            return meta;
        }).toList();

        return ResponseEntity.ok(result);
    }

    /**
     * Return full attachment including base64Content, and mark as synced to the requesting client.
     * Matches sync-server's GET /api/attachments/download/{id}.
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadAttachment(
            @PathVariable Long id,
            @RequestHeader("X-Machine-Id") String machineId) {

        Optional<PermitAttachment> opt = hubAttachmentService.getAndMarkSynced(id, machineId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PermitAttachment att = opt.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", att.getId());
        result.put("entityType", att.getEntityType());
        result.put("entityId", att.getEntityId());
        result.put("fileName", att.getFileName());
        result.put("contentType", att.getContentType());
        result.put("attachmentType", att.getAttachmentType());
        result.put("contentHash", att.getContentHash());
        result.put("base64Content", att.getBase64Content());
        result.put("originMachineId", att.getOriginMachineId());
        result.put("deleted", att.isDeleted());
        result.put("origin", att.getOrigin());
        result.put("createdAt", att.getCreatedAt() != null ? att.getCreatedAt().toString() : null);

        return ResponseEntity.ok(result);
    }

    /**
     * Return total attachment count on hub.
     */
    @GetMapping("/count")
    public ResponseEntity<?> getCount() {
        return ResponseEntity.ok(Map.of("count", hubAttachmentService.getTotalCount()));
    }
}
