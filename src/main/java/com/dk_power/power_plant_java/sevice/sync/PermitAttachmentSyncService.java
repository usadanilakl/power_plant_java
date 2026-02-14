package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.JhaSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermitAttachmentSyncService {

    private final WorkRequestSharePointAdapter wrAdapter;
    private final JhaSharePointAdapter jhaAdapter;
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

    private int syncAttachments(String entityType, Long entityId, String sharepointId,
                                java.util.function.Supplier<List<PaAttachmentDto>> fetcher) {
        try {
            List<PaAttachmentDto> remoteAttachments = fetcher.get();
            if (remoteAttachments == null || remoteAttachments.isEmpty()) return 0;

            int created = 0;
            for (PaAttachmentDto remote : remoteAttachments) {
                if (remote.getFileName() == null || remote.getFileName().isEmpty()) continue;
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(entityType, entityId, remote.getFileName())) {
                    continue;
                }

                PermitAttachment att = new PermitAttachment();
                att.setEntityType(entityType);
                att.setEntityId(entityId);
                att.setFileName(remote.getFileName());
                att.setContentType(remote.getContentType());
                att.setAttachmentType(guessAttachmentType(remote.getContentType()));
                att.setBase64Content(remote.getBase64Content());
                att.setOriginMachineId(syncConfig.getMachineId());
                att.setSyncedToServer(false);
                attachmentRepo.save(att);
                created++;
            }

            if (created > 0) {
                log.info("[Attachment Sync] Created {} attachments for {} spId={}", created, entityType, sharepointId);
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
}
