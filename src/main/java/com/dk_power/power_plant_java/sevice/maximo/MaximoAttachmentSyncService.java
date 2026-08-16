package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.util.Base64;

/**
 * Uploads a {@link PermitAttachment} to its parent Maximo record (WO or SR) as a doclink.
 * Same activation gate as the rest of the Maximo bridge — hub-only, feature-flagged.
 *
 * Idempotency: if the attachment already has a {@code maximoDoclinkId}, the call is a no-op
 * (nothing to re-upload). Failure sets {@code maximoAttachPending=true} so the backfill loop
 * in {@link MaximoFieldListSyncJob} retries later.
 *
 * Prerequisites for upload:
 *   1. Parent {@link FieldListItem} exists and has a {@code maximoHref} (i.e. bridge.submit
 *      already routed it to Maximo). If not, we mark the attachment pending and return
 *      false — the row will get routed eventually and the backfill will pick this up.
 *   2. Attachment has bytes (base64 content non-empty).
 *
 * The helper does NOT open a transaction of its own — the caller (event listener or backfill
 * per-row template) provides one via REQUIRES_NEW.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnExpression(
        "'${maximo.api-key:}'.length() > 0 "
        + "and '${maximo.field-list.enabled:false}' == 'true' "
        + "and '${sync.role:}' == 'hub'")
public class MaximoAttachmentSyncService {

    private final MaximoDoclinksAdapter doclinksAdapter;
    private final PermitAttachmentRepo attachmentRepo;
    private final FieldListItemRepo fieldListRepo;

    /**
     * Upload a single attachment to its parent Maximo record. Returns true on success (or
     * no-op if already uploaded). Only handles attachments whose {@code entityType} is
     * {@code "FieldListItem"} — other entity types are silently skipped (returning true so
     * they don't sit as pending forever on a bucket that doesn't apply).
     */
    public boolean uploadOne(Long attachmentId) {
        PermitAttachment att = attachmentRepo.findById(attachmentId).orElse(null);
        if (att == null) {
            log.warn("[MaximoAttach] uploadOne: attachment id={} not found", attachmentId);
            return false;
        }
        if (!"FieldListItem".equals(att.getEntityType())) {
            // Not a field-list attachment — no Maximo bridge for other entity types (yet).
            // Return true so backfill doesn't loop this row.
            return true;
        }
        if (att.getMaximoDoclinkId() != null && !att.getMaximoDoclinkId().isBlank()) {
            // Already uploaded. Clear stale pending flag if set.
            if (Boolean.TRUE.equals(att.getMaximoAttachPending())) {
                att.setMaximoAttachPending(Boolean.FALSE);
                try { attachmentRepo.save(att); } catch (RuntimeException ignore) { /* backfill re-checks */ }
            }
            return true;
        }

        FieldListItem entity = fieldListRepo.findById(att.getEntityId()).orElse(null);
        if (entity == null) {
            log.warn("[MaximoAttach] uploadOne: parent FieldListItem id={} not found for attachment id={}",
                    att.getEntityId(), attachmentId);
            markPending(att);
            return false;
        }
        String href = entity.getMaximoHref();
        String recType = entity.getMaximoRecordType();
        if (href == null || href.isBlank() || recType == null) {
            // Parent not yet routed to Maximo. Backfill will retry after the row is routed.
            log.debug("[MaximoAttach] Parent id={} not routed yet — deferring attachment id={}",
                    entity.getId(), attachmentId);
            markPending(att);
            return false;
        }

        String base64 = att.getBase64Content();
        if (base64 == null || base64.isBlank()) {
            log.warn("[MaximoAttach] Attachment id={} has no bytes — cannot upload; clearing pending",
                    attachmentId);
            att.setMaximoAttachPending(Boolean.FALSE);
            try { attachmentRepo.save(att); } catch (RuntimeException ignore) { /* ok */ }
            return true;
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            log.warn("[MaximoAttach] Attachment id={} has malformed base64: {}", attachmentId, e.getMessage());
            markPending(att);
            return false;
        }

        // WO doclinks use the *detail* object structure — mxapiwo doesn't expose doclinks
        // (Maximo returns BMXAA1649E NPE). Matches PwaMaximoController + ChemInventoryReorderService.
        String parentOs = MaximoFieldListBridge.REC_TYPE_WO.equals(recType) ? "mxapiwodetail" : "mxapisr";
        log.info("[MaximoAttach] UPLOAD-SEND attId={} entityId={} parent={}/{} name={} bytes={}",
                attachmentId, entity.getId(), parentOs, entity.getMaximoRecordId(), att.getFileName(), bytes.length);
        try {
            var doclink = doclinksAdapter.upload(parentOs, href, att.getFileName(),
                    att.getContentType(), bytes, "Attachments");
            att.setMaximoDoclinkId(doclink == null ? null : doclink.getHref());
            att.setMaximoAttachPending(Boolean.FALSE);
            attachmentRepo.save(att);
            log.info("[MaximoAttach] Uploaded attId={} to {} recordId={} doclinkId={}",
                    attachmentId, recType, entity.getMaximoRecordId(),
                    doclink == null ? null : doclink.getHref());
            return true;
        } catch (RuntimeException e) {
            log.warn("[MaximoAttach] Upload failed for attId={}: {}", attachmentId, e.getMessage());
            markPending(att);
            return false;
        }
    }

    private void markPending(PermitAttachment att) {
        att.setMaximoAttachPending(Boolean.TRUE);
        try {
            attachmentRepo.save(att);
        } catch (RuntimeException persistEx) {
            log.warn("[MaximoAttach] Failed to persist pending flag for attId={}: {}",
                    att.getId(), persistEx.getMessage());
        }
    }
}
