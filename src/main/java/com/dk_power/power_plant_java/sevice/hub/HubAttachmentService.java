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
     * Returns the saved attachment (new or existing).
     */
    @Transactional
    public PermitAttachment storeAttachment(String entityType, Long entityId, String fileName,
                                             String contentType, String attachmentType,
                                             String base64Content, String originMachineId) {

        // Dedup: if same file already exists for this entity, skip
        if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(entityType, entityId, fileName)) {
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
        att.setCreatedAt(LocalDateTime.now());
        att.setOriginMachineId(originMachineId);
        att.setSyncedToServer(true); // Hub IS the server
        att.addSyncedMachine(originMachineId); // Origin already has it

        att = attachmentRepo.save(att);
        log.info("[Hub Attachment] Stored: {} for {}#{} from {}", fileName, entityType, entityId, originMachineId);
        return att;
    }

    /**
     * Get attachments not yet synced to a specific client (metadata only, no base64).
     */
    public List<PermitAttachment> getPendingFor(String machineId) {
        return attachmentRepo.findNotSyncedTo(machineId);
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
