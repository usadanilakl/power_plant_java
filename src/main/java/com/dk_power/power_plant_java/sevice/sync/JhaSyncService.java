package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.mappers.permits.JhaMapper;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.JhaSharePointAdapter;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JhaSyncService {

    private final JhaSharePointAdapter jhaAdapter;
    private final JhaRepo jhaRepo;
    private final WorkRequestRepo workRequestRepo;
    private final JhaMapper jhaMapper;
    private final NgValueService valueService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;

    /**
     * Legacy sync method — kept for backward compatibility.
     * New code should use SharePointSyncOrchestrator.syncEntityType("Jha").
     * Scheduling is now handled by SharePointSyncOrchestrator.
     */
    @Transactional
    public SyncResult syncFromSharePoint() {
        SyncResult result = new SyncResult();
        try {
            List<JhaDto> remoteJhas = jhaAdapter.getAll();
            if (remoteJhas == null || remoteJhas.isEmpty()) {
                log.debug("[JHA Sync] No JHAs returned from SharePoint");
                return result;
            }

            log.info("[JHA Sync] Fetched {} JHAs from SharePoint", remoteJhas.size());

            for (JhaDto remote : remoteJhas) {
                if (remote == null || remote.getSharepointId() == null) {
                    result.incrementSkipped();
                    continue;
                }

                try {
                    Jha existing = jhaRepo.findFirstBySharepointIdOrderByIdAsc(remote.getSharepointId()).orElse(null);
                    String remoteStatus = remote.getStatus();
                    if (remoteStatus == null || remoteStatus.isEmpty()) {
                        remoteStatus = "Active";
                    }

                    if (existing == null) {
                        Jha entity = jhaMapper.fromSharePointDto(remote);
                        entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
                        entity.setCreatedBy("SharePoint Sync");
                        linkToWorkRequest(entity, remote.getWorkRequestSharepointId());
                        jhaRepo.save(entity);
                        result.incrementCreated();
                        log.debug("[JHA Sync] Created new JHA: sharepointId={}", remote.getSharepointId());
                        try {
                            permitAttachmentSyncService.syncAttachmentsForJha(entity.getId(), remote.getSharepointId());
                        } catch (Exception attEx) {
                            log.warn("[JHA Sync] Attachment sync failed for JHA spId={}: {}", remote.getSharepointId(), attEx.getMessage());
                        }
                    } else {
                        String existingStatus = existing.getPermitStatus() != null ? existing.getPermitStatus().getName() : "";
                        boolean statusChanged = !existingStatus.equalsIgnoreCase(remoteStatus);

                        jhaMapper.updateEntityFromSharePoint(existing, remote);
                        if (statusChanged) {
                            existing.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
                        }
                        linkToWorkRequest(existing, remote.getWorkRequestSharepointId());
                        jhaRepo.save(existing);
                        if (statusChanged) {
                            result.incrementUpdated();
                            log.debug("[JHA Sync] Updated status for sharepointId={}: {} -> {}",
                                    remote.getSharepointId(), existingStatus, remoteStatus);
                        }
                    }
                } catch (Exception e) {
                    result.incrementFailed();
                    log.error("[JHA Sync] Failed to process JHA sharepointId={}: {}",
                            remote.getSharepointId(), e.getMessage(), e);
                }
            }

            if (result.getTotalChanges() > 0) {
                log.info("[JHA Sync] Completed: created={}, updated={}, failed={}",
                        result.getCreated(), result.getUpdated(), result.getFailed());
            } else {
                log.debug("[JHA Sync] Completed, no changes");
            }

        } catch (Exception e) {
            log.error("[JHA Sync] Failed to fetch from SharePoint: {}", e.getMessage(), e);
            result.setErrorMessage(e.getMessage());
        }
        return result;
    }

    private void linkToWorkRequest(Jha entity, String workRequestSharepointId) {
        if (workRequestSharepointId == null || workRequestSharepointId.isEmpty()) return;
        entity.setWorkRequestSharepointId(workRequestSharepointId);
        if (entity.getWorkRequest() == null) {
            workRequestRepo.findFirstBySharepointIdOrderByIdAsc(workRequestSharepointId)
                    .ifPresent(entity::setWorkRequest);
        }
    }
}
