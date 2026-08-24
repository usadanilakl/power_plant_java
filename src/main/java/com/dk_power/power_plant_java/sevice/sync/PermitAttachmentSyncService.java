package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentLogSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryItemSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.JhaSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermitAttachmentSyncService {

    private final WorkRequestSharePointAdapter wrAdapter;
    private final JhaSharePointAdapter jhaAdapter;
    private final InstrumentLogSharePointAdapter instrumentLogAdapter;
    private final FieldListItemSharePointAdapter fieldListItemAdapter;
    private final InventoryItemSharePointAdapter inventoryItemAdapter;
    private final SdsChemicalSharePointAdapter sdsChemicalAdapter;
    private final PermitAttachmentRepo attachmentRepo;
    private final SyncConfig syncConfig;

    public int syncAttachmentsForWorkRequest(Long entityId, String sharepointId) {
        return syncAttachments("WorkRequest", entityId, sharepointId,
                () -> wrAdapter.getAttachments(sharepointId));
    }

    public int syncAttachmentsForJha(Long entityId, String sharepointId) {
        return syncAttachments("Jha", entityId, sharepointId,
                () -> jhaAdapter.getAttachments(sharepointId));
    }

    public int syncAttachmentsForInstrumentLog(Long entityId, String sharepointId) {
        return syncAttachments("InstrumentLog", entityId, sharepointId,
                () -> instrumentLogAdapter.getAttachments(sharepointId));
    }

    public int syncAttachmentsForFieldListItem(Long entityId, String sharepointId) {
        return syncAttachments("FieldListItem", entityId, sharepointId,
                () -> fieldListItemAdapter.getAttachments(sharepointId));
    }

    public int syncAttachmentsForInventoryItem(Long entityId, String sharepointId) {
        return syncAttachments("InventoryItem", entityId, sharepointId,
                () -> inventoryItemAdapter.getAttachments(sharepointId));
    }

    public int syncAttachmentsForSdsChemical(Long entityId, String sharepointId) {
        return syncAttachments("SdsChemical", entityId, sharepointId,
                () -> sdsChemicalAdapter.getAttachments(sharepointId));
    }

    private int syncAttachments(String entityType, Long entityId, String sharepointId,
                                java.util.function.Supplier<List<PaAttachmentDto>> fetcher) {
        try {
            List<PaAttachmentDto> remoteAttachments = fetcher.get();
            if (remoteAttachments == null || remoteAttachments.isEmpty()) return 0;

            int created = 0;
            for (PaAttachmentDto remote : remoteAttachments) {
                if (remote.getFileName() == null || remote.getFileName().isEmpty()) continue;
                String contentHash = computeContentHash(remote.getBase64Content());

                // Content-hash dedup: fast path for rows written with the same hash convention
                // (this service + AttachmentSyncHandler + NgFieldListItemService all hash the
                // DECODED bytes).
                if (contentHash != null && !contentHash.isEmpty()) {
                    Optional<PermitAttachment> existing = attachmentRepo
                        .findFirstByEntityTypeAndEntityIdAndFileNameAndContentHashOrderByIdAsc(
                            entityType, entityId, remote.getFileName(), contentHash);
                    if (existing.isPresent()) {
                        continue;
                    }
                }
                // Filename-only fallback. Covers the SP round-trip case where we pushed a
                // photo via a PWA path (sevice/pwa/*, which historically hashed the base64
                // STRING instead of decoded bytes), then this poll fetches it back — the
                // two hashes disagree so the check above misses, and without this we'd
                // create a duplicate PermitAttachment for the same file. Assumption: SP
                // never legitimately serves a different-content-same-name attachment for
                // the same list row, so filename-alone is a safe dedup key here.
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(
                    entityType, entityId, remote.getFileName())) {
                    continue;
                }

                PermitAttachment att = new PermitAttachment();
                att.setEntityType(entityType);
                att.setEntityId(entityId);
                att.setFileName(remote.getFileName());
                att.setContentType(remote.getContentType());
                att.setAttachmentType(guessAttachmentType(remote.getContentType()));
                att.setBase64Content(remote.getBase64Content());
                att.setContentHash(contentHash);
                att.setOriginMachineId(syncConfig.getMachineId());
                att.setSyncedToServer(false);
                attachmentRepo.save(att);
                created++;
            }

            if (created > 0) {
                log.debug("[Attachment Sync] Created {} attachments for {} spId={}", created, entityType, sharepointId);
            }
            return created;
        } catch (Exception e) {
            log.warn("[Attachment Sync] Failed to sync attachments for {} spId={}: {}",
                    entityType, sharepointId, e.getMessage());
            return 0;
        }
    }

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        return "document";
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) {
            return null;
        }

        try {
            byte[] bytes = java.util.Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception decodeError) {
            try {
                byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(base64Content.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder(hash.length * 2);
                for (byte b : hash) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception hashError) {
                log.warn("[Attachment Sync] Could not hash attachment payload: {}", hashError.getMessage());
                return null;
            }
        }
    }
}
