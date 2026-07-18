package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Attachment storage and per-client tracking service for hub mode.
 * Accepts PermitAttachments from clients, tracks which clients have downloaded them.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubAttachmentService {

    private final PermitAttachmentRepo attachmentRepo;

    /**
     * Store an attachment uploaded by a client.
     * Deduplicates by entityType + entityId + fileName.
     * When {@code deleted=true} the payload is a tombstone: find the matching live local row
     * and mark it deleted so subsequent /pending polls carry the tombstone to peers.
     * Returns the saved attachment (new or existing).
     */
    @Transactional
    public PermitAttachment storeAttachment(String entityType, Long entityId, String fileName,
                                             String contentType, String attachmentType,
                                             String base64Content, String contentHash,
                                             String originMachineId, boolean deleted, String origin) {

        // Tombstone path: convert an existing live row on the hub to deleted=true so the /pending
        // endpoint carries the delete signal to every other machine that hasn't seen it.
        if (deleted) {
            java.util.Optional<PermitAttachment> matchOpt = contentHash != null && !contentHash.isEmpty()
                ? attachmentRepo.findFirstByEntityTypeAndEntityIdAndContentHashAndDeletedFalseOrderByIdAsc(
                    entityType, entityId, contentHash)
                : attachmentRepo.findFirstByEntityTypeAndEntityIdAndFileNameOrderByIdAsc(
                    entityType, entityId, fileName);
            if (matchOpt.isPresent()) {
                PermitAttachment existing = matchOpt.get();
                existing.setDeleted(true);
                existing.addSyncedMachine(originMachineId);
                // Reset the propagation trail so every peer picks up the tombstone. The uploader
                // (originMachineId) already applied the delete locally, so we mark it synced.
                existing.setSyncedToMachines("|" + originMachineId + "|");
                PermitAttachment saved = attachmentRepo.save(existing);
                log.info("[Hub Attachment] Tombstone applied: {} for {}#{} from {}",
                    fileName, entityType, entityId, originMachineId);
                return saved;
            }
            // Tombstone for a row the hub never had — accept it as a pre-tombstoned row so any
            // peer that DOES have the row picks up the delete.
            PermitAttachment att = new PermitAttachment();
            att.setEntityType(entityType);
            att.setEntityId(entityId);
            att.setFileName(fileName);
            att.setContentHash(contentHash);
            att.setOriginMachineId(originMachineId);
            att.setOrigin(origin);
            att.setDeleted(true);
            att.setCreatedAt(LocalDateTime.now());
            att.setSyncedToServer(true);
            att.addSyncedMachine(originMachineId);
            att = attachmentRepo.save(att);
            log.info("[Hub Attachment] Tombstone stored (no local match): {} for {}#{} from {}",
                fileName, entityType, entityId, originMachineId);
            return att;
        }

        // Dedup by filename + content hash when available.
        if (contentHash != null && !contentHash.isEmpty() &&
            attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                entityType, entityId, fileName, contentHash)) {
            log.debug("[Hub Attachment] Duplicate skipped by hash: {} for {}#{}", fileName, entityType, entityId);
            var existing = attachmentRepo.findFirstByEntityTypeAndEntityIdAndFileNameAndContentHashOrderByIdAsc(
                entityType, entityId, fileName, contentHash);
            if (existing.isPresent()) {
                PermitAttachment att = existing.get();
                att.addSyncedMachine(originMachineId);
                return attachmentRepo.save(att);
            }
        } else if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(entityType, entityId, fileName)) {
            log.debug("[Hub Attachment] Duplicate skipped: {} for {}#{}", fileName, entityType, entityId);
            // Find existing and mark origin as synced
            List<PermitAttachment> existing = attachmentRepo.findByEntityTypeAndEntityId(entityType, entityId);
            for (PermitAttachment att : existing) {
                if (fileName.equals(att.getFileName())) {
                    att.addSyncedMachine(originMachineId);
                    return attachmentRepo.save(att);
                }
            }
        }

        PermitAttachment att = new PermitAttachment();
        att.setEntityType(entityType);
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(attachmentType);
        att.setBase64Content(base64Content);
        att.setContentHash(contentHash);
        att.setCreatedAt(LocalDateTime.now());
        att.setOriginMachineId(originMachineId);
        att.setOrigin(origin);
        att.setSyncedToServer(true); // Hub IS the server
        att.addSyncedMachine(originMachineId); // Origin already has it

        att = attachmentRepo.save(att);
        log.info("[Hub Attachment] Stored: {} for {}#{} from {}", fileName, entityType, entityId, originMachineId);
        return att;
    }

    /**
     * Get attachments not yet synced to a specific client (metadata-only projection — does NOT load
     * the out-of-row base64 blob; clients fetch content individually via /download).
     */
    public List<com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo.PendingAttachmentView>
            getPendingFor(String machineId) {
        return attachmentRepo.findPendingMetadataNotSyncedTo(machineId);
    }

    /**
     * Get a full attachment by ID and mark it as synced to the requesting client.
     */
    @Transactional
    public Optional<PermitAttachment> getAndMarkSynced(Long id, String machineId) {
        Optional<PermitAttachment> opt = attachmentRepo.findById(id);
        if (opt.isPresent()) {
            PermitAttachment att = opt.get();
            att.addSyncedMachine(machineId);
            attachmentRepo.save(att);
        }
        return opt;
    }

    public long getTotalCount() {
        return attachmentRepo.count();
    }
}
