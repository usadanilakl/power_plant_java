package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkRequestSyncService {

    private final SharepointAccessService sharepointAccessService;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final NgValueService valueService;

    @Value("${sharepoint.sync.enabled:true}")
    private boolean syncEnabled;

    /**
     * Periodically sync work requests from SharePoint.
     * Runs every 2 minutes (configurable), with 30s initial delay to let the app start.
     */
    @Scheduled(fixedDelayString = "${sharepoint.sync.interval:120000}", initialDelay = 30000)
    public void scheduledSync() {
        if (!syncEnabled) {
            return;
        }
        syncFromSharePoint();
    }

    /**
     * Sync work requests from SharePoint. Can be called manually or by scheduler.
     * Returns the number of new/updated records.
     */
    @Transactional
    public int syncFromSharePoint() {
        int changes = 0;
        try {
            List<WorkRequestDto> remoteRequests = sharepointAccessService.getAllWorkRequests();
            if (remoteRequests == null || remoteRequests.isEmpty()) {
                log.debug("[SharePoint Sync] No work requests returned from SharePoint");
                return 0;
            }

            log.info("[SharePoint Sync] Fetched {} work requests from SharePoint", remoteRequests.size());

            // Collect all remote SharePoint IDs for auto-close check
            Set<String> remoteIds = remoteRequests.stream()
                    .filter(r -> r.getSharepointId() != null)
                    .map(r -> r.getSharepointId().toLowerCase())
                    .collect(Collectors.toSet());

            // Process each remote request
            for (WorkRequestDto remote : remoteRequests) {
                if (remote == null || remote.getSharepointId() == null) {
                    continue;
                }

                WorkRequest existing = workRequestRepo.findBySharepointId(remote.getSharepointId()).orElse(null);
                String remoteStatus = remote.getStatus();
                if (remoteStatus == null || remoteStatus.isEmpty()) {
                    remoteStatus = "Active";
                }

                if (existing == null) {
                    // New record from SharePoint
                    WorkRequest entity = workRequestMapper.fromSharePointDto(remote);
                    entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
                    workRequestRepo.save(entity);
                    changes++;
                    log.debug("[SharePoint Sync] Created new work request: sharepointId={}", remote.getSharepointId());
                } else {
                    // Existing record — update fields and status if changed
                    String existingStatus = existing.getPermitStatus() != null ? existing.getPermitStatus().getName() : "";
                    boolean statusChanged = !existingStatus.equalsIgnoreCase(remoteStatus);

                    workRequestMapper.updateEntityFromSharePoint(existing, remote);
                    if (statusChanged) {
                        existing.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
                    }
                    workRequestRepo.save(existing);
                    if (statusChanged) {
                        changes++;
                        log.debug("[SharePoint Sync] Updated status for sharepointId={}: {} → {}", remote.getSharepointId(), existingStatus, remoteStatus);
                    }
                }
            }

            // Auto-close local "Active" records that are no longer in SharePoint
            List<WorkRequest> localActive = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");
            for (WorkRequest local : localActive) {
                String spId = local.getSharepointId();
                if (spId != null && !remoteIds.contains(spId.toLowerCase())) {
                    local.setPermitStatus(valueService.createValue("Permit Status", "Closed"));
                    workRequestRepo.save(local);
                    changes++;
                    log.debug("[SharePoint Sync] Auto-closed work request: sharepointId={}", spId);
                }
            }

            if (changes > 0) {
                log.info("[SharePoint Sync] Completed with {} changes", changes);
            } else {
                log.debug("[SharePoint Sync] Completed, no changes");
            }

        } catch (Exception e) {
            log.warn("[SharePoint Sync] Failed: {}", e.getMessage());
        }
        return changes;
    }
}
