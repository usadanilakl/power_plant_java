package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.dto.sync.WorkRequestHealResultDto;
import com.dk_power.power_plant_java.dto.sync.WorkRequestHealSnapshotDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkRequestHealService {

    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final WorkAreaRepo workAreaRepo;
    private final NgValueService valueService;
    private final WorkRequestSharePointAdapter workRequestSharePointAdapter;
    private final WorkRequestSyncRepairService workRequestSyncRepairService;
    private final SyncContext syncContext;
    private final SyncConfig syncConfig;
    @Lazy private final CentralSyncService centralSyncService;
    private final RestTemplate restTemplate;

    public WorkRequestHealResultDto healLocalView() {
        if (syncConfig.isHubMode()) {
            WorkRequestHealSnapshotDto snapshot = getHubSnapshot();
            return WorkRequestHealResultDto.builder()
                .hubAvailable(true)
                .sharePointAvailable(snapshot.isSharePointAvailable())
                .repairedCreateHistory(snapshot.getRepairedCreateHistory())
                .importedFromSharePoint(snapshot.getImportedFromSharePoint())
                .importedFromHub(0)
                .localCount(snapshot.getLocalCount())
                .message(buildHubMessage(snapshot))
                .build();
        }

        boolean hubReachable = centralSyncService.checkServerHealth();
        if (!hubReachable) {
            log.info("[WR Heal] Hub is not reachable (healthCheck=false, cachedAvailable={})",
                centralSyncService.isServerAvailable());
            int localCount = getLocalItems().size();
            return WorkRequestHealResultDto.builder()
                .hubAvailable(false)
                .sharePointAvailable(false)
                .repairedCreateHistory(0)
                .importedFromSharePoint(0)
                .importedFromHub(0)
                .localCount(localCount)
                .message(String.format("Hub offline. Showing %d local work requests.", localCount))
                .build();
        }

        WorkRequestHealSnapshotDto snapshot = fetchHubSnapshot();
        if (snapshot == null) {
            int localCount = getLocalItems().size();
            return WorkRequestHealResultDto.builder()
                .hubAvailable(true)
                .sharePointAvailable(false)
                .repairedCreateHistory(0)
                .importedFromSharePoint(0)
                .importedFromHub(0)
                .localCount(localCount)
                .message(String.format("Hub is online but heal-snapshot failed (check hub logs). Showing %d local work requests.", localCount))
                .build();
        }

        int importedFromHub = importMissingFromHub(snapshot.getItems());
        int localCount = getLocalItems().size();

        return WorkRequestHealResultDto.builder()
            .hubAvailable(true)
            .sharePointAvailable(snapshot.isSharePointAvailable())
            .repairedCreateHistory(snapshot.getRepairedCreateHistory())
            .importedFromSharePoint(snapshot.getImportedFromSharePoint())
            .importedFromHub(importedFromHub)
            .localCount(localCount)
            .message(buildClientMessage(snapshot, importedFromHub, localCount))
            .build();
    }

    public WorkRequestHealSnapshotDto getHubSnapshot() {
        // Return what the hub has immediately — SP orchestrator keeps it up to date.
        // Run SP import + backfill in background as safety net for any gaps.
        Thread.ofVirtual().name("wr-heal-bg").start(() -> {
            try {
                int imported = importMissingFromSharePoint();
                if (imported > 0) {
                    log.info("[WR Heal] Background SP import filled {} gaps", imported);
                    workRequestSyncRepairService.backfillMissingCreateHistory();
                }
            } catch (Exception e) {
                log.debug("[WR Heal] Background heal failed (non-critical): {}", e.getMessage());
            }
        });

        List<NgWorkRequestDto> items = getLocalItems().stream()
            .map(workRequestMapper::convertToNgDto)
            .toList();

        return WorkRequestHealSnapshotDto.builder()
            .items(items)
            .sharePointAvailable(true)
            .repairedCreateHistory(0)
            .importedFromSharePoint(0)
            .localCount(items.size())
            .message(String.format("Hub has %d work requests.", items.size()))
            .build();
    }

    private WorkRequestHealSnapshotDto fetchHubSnapshot() {
        String hubUrl = syncConfig.getSyncServerUrl() + "/work-requests-api/heal-snapshot";
        try {
            log.info("[WR Heal] Fetching hub snapshot from: {}", hubUrl);
            ResponseEntity<NgApiResponse<WorkRequestHealSnapshotDto>> response = restTemplate.exchange(
                hubUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );
            if (response.getBody() == null) {
                log.warn("[WR Heal] Hub returned null response body from {}", hubUrl);
                return null;
            }
            if (response.getBody().getResponseData() == null) {
                log.warn("[WR Heal] Hub returned null responseData. Message: {}", response.getBody().getMessage());
                return null;
            }
            WorkRequestHealSnapshotDto snapshot = response.getBody().getResponseData();
            log.info("[WR Heal] Hub snapshot received: {} items, SP available={}, repaired={}, imported from SP={}",
                snapshot.getLocalCount(), snapshot.isSharePointAvailable(),
                snapshot.getRepairedCreateHistory(), snapshot.getImportedFromSharePoint());
            return snapshot;
        } catch (Exception e) {
            log.error("[WR Heal] Failed to fetch hub snapshot from {}: {} ({})",
                hubUrl, e.getMessage(), e.getClass().getSimpleName(), e);
            return null;
        }
    }

    private int importMissingFromSharePoint() {
        // Only fetch WRs modified in the last 2 days — not the full 800+ list
        List<WorkRequestDto> remoteItems = workRequestSharePointAdapter.getModifiedSince(
            java.time.Instant.now().minus(2, java.time.temporal.ChronoUnit.DAYS));
        if (remoteItems.isEmpty()) {
            return 0;
        }

        List<WorkRequest> localItems = getLocalItems();
        Map<String, WorkRequest> bySharePointId = new HashMap<>();
        Map<String, WorkRequest> byLocalUuid = new HashMap<>();
        for (WorkRequest local : localItems) {
            if (hasText(local.getSharepointId())) {
                bySharePointId.put(local.getSharepointId(), local);
            }
            if (hasText(local.getLocalUuid())) {
                byLocalUuid.put(local.getLocalUuid(), local);
            }
        }

        int imported = 0;
        for (WorkRequestDto remote : remoteItems) {
            WorkRequest existingBySharePointId = hasText(remote.getSharepointId())
                ? bySharePointId.get(remote.getSharepointId())
                : null;
            WorkRequest existingByLocalUuid = hasText(remote.getLocalUuid())
                ? byLocalUuid.get(remote.getLocalUuid())
                : null;

            if (existingBySharePointId != null) {
                continue;
            }

            if (existingByLocalUuid != null) {
                updateLocalFromSharePoint(existingByLocalUuid, remote);
                workRequestRepo.save(existingByLocalUuid);
                if (hasText(existingByLocalUuid.getSharepointId())) {
                    bySharePointId.put(existingByLocalUuid.getSharepointId(), existingByLocalUuid);
                }
                imported++;
                continue;
            }

            WorkRequest entity = workRequestMapper.fromSharePointDto(remote);
            entity.setPermitStatus(valueService.createValue("Permit Status", defaultStatus(remote.getStatus())));
            WorkRequest saved = workRequestRepo.save(entity);
            if (hasText(saved.getSharepointId())) {
                bySharePointId.put(saved.getSharepointId(), saved);
            }
            if (hasText(saved.getLocalUuid())) {
                byLocalUuid.put(saved.getLocalUuid(), saved);
            }
            imported++;
        }

        if (imported > 0) {
            log.info("[WR Heal] Hub imported or bound {} missing Work Requests from SharePoint", imported);
        }
        return imported;
    }

    private int importMissingFromHub(List<NgWorkRequestDto> hubItems) {
        if (hubItems == null || hubItems.isEmpty()) {
            return 0;
        }

        List<WorkRequest> localItems = getLocalItems();
        Map<Long, WorkRequest> byId = new HashMap<>();
        Map<String, WorkRequest> bySharePointId = new HashMap<>();
        Map<String, WorkRequest> byLocalUuid = new HashMap<>();
        for (WorkRequest local : localItems) {
            if (local.getId() != null) {
                byId.put(local.getId(), local);
            }
            if (hasText(local.getSharepointId())) {
                bySharePointId.put(local.getSharepointId(), local);
            }
            if (hasText(local.getLocalUuid())) {
                byLocalUuid.put(local.getLocalUuid(), local);
            }
        }

        AtomicInteger imported = new AtomicInteger();
        syncContext.executeInSyncContext(() -> {
            for (NgWorkRequestDto hubItem : hubItems) {
                if (hubItem.getId() == null) {
                    continue;
                }
                if (byId.containsKey(hubItem.getId())) {
                    continue;
                }
                if (hasText(hubItem.getSharepointId()) && bySharePointId.containsKey(hubItem.getSharepointId())) {
                    continue;
                }
                if (hasText(hubItem.getLocalUuid()) && byLocalUuid.containsKey(hubItem.getLocalUuid())) {
                    continue;
                }

                WorkRequest entity = buildLocalClone(hubItem);
                WorkRequest saved = workRequestRepo.save(entity);
                byId.put(saved.getId(), saved);
                if (hasText(saved.getSharepointId())) {
                    bySharePointId.put(saved.getSharepointId(), saved);
                }
                if (hasText(saved.getLocalUuid())) {
                    byLocalUuid.put(saved.getLocalUuid(), saved);
                }
                imported.incrementAndGet();
            }
        });

        if (imported.get() > 0) {
            log.info("[WR Heal] Client imported {} missing Work Requests from hub", imported.get());
        }
        return imported.get();
    }

    private WorkRequest buildLocalClone(NgWorkRequestDto source) {
        WorkRequest entity = new WorkRequest();
        entity.setId(source.getId());
        entity.setName(source.getName());
        entity.setNote(source.getNote());
        entity.setDateOfWorkToBePerformed(source.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(source.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(source.getRequestedBy());
        entity.setCompany(source.getCompany());
        entity.setLocation(source.getLocation());
        entity.setAffectedEquipment(source.getAffectedEquipment());
        entity.setWorkScope(source.getWorkScope());
        entity.setIsHotWorkRequired(source.getIsHotWorkRequired());
        entity.setForeman(source.getForeman());
        entity.setFireWatch(source.getFireWatch());
        entity.setIsLotoRequired(source.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(source.getIsConfinedSpaceEntryRequired());
        entity.setSpace(source.getSpace());
        entity.setSharepointId(source.getSharepointId());
        entity.setLocalUuid(source.getLocalUuid());
        entity.setPermitStatus(valueService.createValue("Permit Status", defaultStatus(source.getStatus())));

        if (source.getWorkCategory() != null && hasText(source.getWorkCategory().getName())) {
            entity.setWorkCategory(valueService.createValue("Work Category", source.getWorkCategory().getName()));
        }

        String workAreaName = source.getWorkArea() != null ? source.getWorkArea().getName() : null;
        if (hasText(workAreaName)) {
            workAreaRepo.findFirstByNameIgnoreCase(workAreaName).ifPresent(entity::setWorkArea);
        } else if (hasText(source.getLocation())) {
            workAreaRepo.findFirstByNameIgnoreCase(source.getLocation()).ifPresent(entity::setWorkArea);
        }

        return entity;
    }

    private void updateLocalFromSharePoint(WorkRequest entity, WorkRequestDto remote) {
        if (!Objects.equals(entity.getSharepointId(), remote.getSharepointId())) {
            entity.setSharepointId(remote.getSharepointId());
        }
        workRequestMapper.updateEntityFromSharePoint(entity, remote);
        entity.setPermitStatus(valueService.createValue("Permit Status", defaultStatus(remote.getStatus())));
    }

    private List<WorkRequest> getLocalItems() {
        return workRequestRepo.findAllByDeletedFalseOrderByDateModifiedDesc();
    }

    private String buildHubMessage(WorkRequestHealSnapshotDto snapshot) {
        return String.format(
            "Hub ready. %d local work requests, imported %d from SharePoint, repaired %d sync-history gaps.",
            snapshot.getLocalCount(),
            snapshot.getImportedFromSharePoint(),
            snapshot.getRepairedCreateHistory()
        );
    }

    private String buildClientMessage(WorkRequestHealSnapshotDto snapshot, int importedFromHub, int localCount) {
        return String.format(
            "WR healing complete. Imported %d missing from hub. Hub imported %d from SharePoint. Local list now has %d work requests.",
            importedFromHub,
            snapshot.getImportedFromSharePoint(),
            localCount
        );
    }

    private String defaultStatus(String status) {
        return hasText(status) ? status : "Active";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
