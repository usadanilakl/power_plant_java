package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.hub.HubClientInfoRepository;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * Core sync orchestration service for hub mode.
 * Replicates sync-server's SyncService logic using existing power_plant_java infrastructure.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final HubClientInfoRepository hubClientInfoRepository;
    private final HubSseService hubSseService;
    private final FieldSyncService fieldSyncService;
    private final SyncConfig syncConfig;
    private final HubSyncConfig hubSyncConfig;

    private final AtomicBoolean pendingEntityRetry = new AtomicBoolean(false);

    // -------------------------------------------------------------------
    // Main sync exchange
    // -------------------------------------------------------------------

    /**
     * Process incoming changes from a client and return sync response.
     * This is the hub equivalent of sync-server's SyncService.syncExchange().
     */
    @Transactional
    public SyncResponse syncExchange(String machineId, String machineName,
                                      String ipAddress, List<FieldChange> incomingChanges) {
        log.info("Hub sync exchange from {} ({}): {} incoming changes",
            machineName, machineId, incomingChanges != null ? incomingChanges.size() : 0);

        // Register/update client
        HubClientInfo client = registerClient(machineId, machineName, ipAddress);
        client.setStatus(HubClientInfo.ClientStatus.SYNCING);
        hubClientInfoRepository.save(client);

        // Process incoming changes (dedup + LWW)
        ProcessingResult result = processIncomingChangesBatched(incomingChanges, machineId);

        // Count pending changes for this client
        long pendingForClient = fieldChangeRepository.countPendingChangesFor(machineId);

        // Update client stats
        client.recordSync(result.changesReceived, 0);
        client.setStatus(HubClientInfo.ClientStatus.ONLINE);
        hubClientInfoRepository.save(client);

        log.info("Hub sync complete for {}: received={}, skipped={}, pending={}",
            machineName, result.changesReceived, result.duplicatesSkipped, pendingForClient);

        // Post-processing: apply to entities, broadcast, and dedup
        if (!result.savedChanges.isEmpty()) {
            // Apply to hub's own real entities
            try {
                int applied = fieldSyncService.applyIncomingChanges(result.savedChanges, true);
                log.debug("Applied {} changes to hub entities", applied);
            } catch (Exception e) {
                log.error("Failed to apply changes to hub entities, retrying: {}", e.getMessage());
                try {
                    int retried = fieldSyncService.applyIncomingChanges(result.savedChanges, true);
                    log.info("Retry succeeded: applied {} changes to hub entities", retried);
                } catch (Exception retry) {
                    log.error("Retry also failed — scheduling for periodic retry: {}", retry.getMessage());
                    pendingEntityRetry.set(true);
                }
            }

            // Broadcast to other connected clients via SSE (batched)
            broadcastChangesInBatches(result.savedChanges, machineId);

            // Dedup is handled by FieldSyncService afterCommit callback —
            // no need to run again here (double-execution was causing excessive
            // FieldChange generation and broadcaster spam).
        }

        return SyncResponse.builder()
            .success(true)
            .changesReceived(result.changesReceived)
            .duplicatesSkipped(result.duplicatesSkipped)
            .changesSent(0)
            .changes(List.of())
            .totalPending(pendingForClient)
            .build();
    }

    // -------------------------------------------------------------------
    // Pending changes for clients
    // -------------------------------------------------------------------

    /**
     * Get paginated pending changes for a client and mark them as synced.
     */
    @Transactional
    public Page<FieldChange> getPendingChangesPaginated(String machineId, Pageable pageable) {
        Page<FieldChange> page = fieldChangeRepository.findChangesNotSyncedTo(machineId, pageable);

        List<FieldChange> changes = page.getContent();
        for (FieldChange change : changes) {
            change.addSyncedMachine(machineId);
        }
        if (!changes.isEmpty()) {
            fieldChangeRepository.saveAll(changes);
        }

        return page;
    }

    /**
     * Get count of pending changes for a client.
     */
    public long getPendingChangeCount(String machineId) {
        return fieldChangeRepository.countPendingChangesFor(machineId);
    }

    // -------------------------------------------------------------------
    // Client management
    // -------------------------------------------------------------------

    @Transactional
    public HubClientInfo registerClient(String machineId, String machineName, String ipAddress) {
        HubClientInfo client = hubClientInfoRepository.findById(machineId)
            .orElse(new HubClientInfo(machineId, machineName, ipAddress));

        client.setMachineName(machineName);
        client.setIpAddress(ipAddress);
        client.recordActivity();

        return hubClientInfoRepository.save(client);
    }

    public List<HubClientInfo> getAllClients() {
        return hubClientInfoRepository.findAll();
    }

    public List<HubClientInfo> getActiveClients() {
        Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
        return hubClientInfoRepository.findByLastSeenAfter(cutoff);
    }

    // -------------------------------------------------------------------
    // Scheduled tasks
    // -------------------------------------------------------------------

    @Scheduled(fixedDelay = 30000)
    public void sendSseHeartbeat() {
        hubSseService.sendHeartbeat();
    }

    @Scheduled(fixedDelay = 300000)
    public void markInactiveClients() {
        Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
        List<HubClientInfo> onlineClients = hubClientInfoRepository
            .findByStatus(HubClientInfo.ClientStatus.ONLINE);

        for (HubClientInfo client : onlineClients) {
            if (client.getLastSeen() != null && client.getLastSeen().isBefore(cutoff)) {
                client.setStatus(HubClientInfo.ClientStatus.OFFLINE);
                hubClientInfoRepository.save(client);
                log.debug("Marked client {} as offline", client.getMachineName());
            }
        }
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 120_000)
    public void retryPendingEntityApplication() {
        if (!pendingEntityRetry.compareAndSet(true, false)) return;

        log.info("Retrying pending hub entity application...");
        List<FieldChange> unapplied = fieldChangeRepository.findRecentIncomingChanges(
            syncConfig.getMachineId(), Instant.now().minus(1, ChronoUnit.HOURS));

        if (unapplied.isEmpty()) {
            log.info("No unapplied changes found for retry");
            return;
        }

        try {
            int applied = fieldSyncService.applyIncomingChanges(unapplied, true);
            log.info("Periodic retry: applied {} changes to hub entities", applied);
        } catch (Exception e) {
            log.error("Periodic retry failed — will retry next cycle: {}", e.getMessage());
            pendingEntityRetry.set(true);
        }
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldChanges() {
        Instant cutoff = Instant.now().minus(hubSyncConfig.getRetentionDays(), ChronoUnit.DAYS);
        int deleted = fieldChangeRepository.deleteChangesBefore(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} field changes older than {} days", deleted, hubSyncConfig.getRetentionDays());
        }
    }

    // -------------------------------------------------------------------
    // Internal processing
    // -------------------------------------------------------------------

    private ProcessingResult processIncomingChangesBatched(List<FieldChange> incomingChanges, String machineId) {
        ProcessingResult result = new ProcessingResult();

        if (incomingChanges == null || incomingChanges.isEmpty()) {
            return result;
        }

        // Optional compaction
        List<FieldChange> changesToProcess = hubSyncConfig.isCompactionEnabled()
            ? compactChanges(incomingChanges)
            : incomingChanges;

        String hubMachineId = syncConfig.getMachineId();

        // Group by entity type for batch processing
        Map<String, List<FieldChange>> changesByType = changesToProcess.stream()
            .collect(Collectors.groupingBy(FieldChange::getEntityType));

        for (Map.Entry<String, List<FieldChange>> entry : changesByType.entrySet()) {
            String entityType = entry.getKey();
            List<FieldChange> typeChanges = entry.getValue();

            List<Long> entityIds = typeChanges.stream()
                .map(FieldChange::getEntityId)
                .distinct()
                .collect(Collectors.toList());

            // Batch dedup check
            Set<String> existingKeys = new HashSet<>(
                fieldChangeRepository.findExistingChangeKeys(entityType, entityIds));

            // Batch LWW check
            Map<String, FieldChange> latestChanges = fieldChangeRepository
                .findLatestChangesForEntities(entityType, entityIds)
                .stream()
                .collect(Collectors.toMap(
                    fc -> fc.getEntityType() + ":" + fc.getEntityId() + ":" + fc.getFieldName(),
                    fc -> fc,
                    (a, b) -> a.getTimestamp().isAfter(b.getTimestamp()) ? a : b
                ));

            for (FieldChange change : typeChanges) {
                String changeKey = buildChangeKey(change);

                if (existingKeys.contains(changeKey)) {
                    result.duplicatesSkipped++;
                    continue;
                }

                if (shouldAcceptChange(change, latestChanges)) {
                    // Create a NEW entity to avoid Hibernate persistence context conflicts.
                    // The incoming 'change' may share a UUID with a managed entity loaded by
                    // findLatestChangesForEntities(), and mutating its ID (setId(null)) would
                    // cause "identifier was altered" errors at commit time.
                    FieldChange newChange = new FieldChange();
                    newChange.setEntityType(change.getEntityType());
                    newChange.setEntityId(change.getEntityId());
                    newChange.setFieldName(change.getFieldName());
                    newChange.setOldValue(change.getOldValue());
                    newChange.setNewValue(change.getNewValue());
                    newChange.setTimestamp(change.getTimestamp());
                    newChange.setOriginMachineId(change.getOriginMachineId());
                    newChange.setOriginMachineName(change.getOriginMachineName());
                    newChange.setChangeType(change.getChangeType());
                    newChange.setRelationshipType(change.getRelationshipType());
                    newChange.setReceivedAt(Instant.now());
                    newChange.addSyncedMachine(machineId);    // Mark as synced to origin client
                    newChange.addSyncedMachine(hubMachineId);  // Mark as synced to hub itself
                    FieldChange saved = fieldChangeRepository.save(newChange);
                    result.savedChanges.add(saved);
                    result.changesReceived++;
                } else {
                    log.debug("Skipping change for {}.{} - newer change exists",
                        change.getEntityType(), change.getFieldName());
                    result.duplicatesSkipped++;
                }
            }
        }

        return result;
    }

    private String buildChangeKey(FieldChange change) {
        return change.getEntityType() + ":" + change.getEntityId() + ":" +
               change.getFieldName() + ":" + change.getTimestamp() + ":" + change.getOriginMachineId();
    }

    private boolean shouldAcceptChange(FieldChange incoming, Map<String, FieldChange> latestChanges) {
        String key = incoming.getEntityType() + ":" + incoming.getEntityId() + ":" + incoming.getFieldName();
        FieldChange latest = latestChanges.get(key);

        if (latest == null) {
            return true;
        }

        if (incoming.getTimestamp().isAfter(latest.getTimestamp())) {
            return true;
        }

        // Same timestamp — machine ID tiebreaker
        if (incoming.getTimestamp().equals(latest.getTimestamp())) {
            return incoming.getOriginMachineId().compareTo(latest.getOriginMachineId()) > 0;
        }

        return false;
    }

    private List<FieldChange> compactChanges(List<FieldChange> changes) {
        Map<String, FieldChange> latestByField = new LinkedHashMap<>();

        for (FieldChange change : changes) {
            String key = change.getEntityType() + ":" + change.getEntityId() + ":" + change.getFieldName();
            FieldChange existing = latestByField.get(key);
            if (existing == null || change.getTimestamp().isAfter(existing.getTimestamp())) {
                latestByField.put(key, change);
            }
        }

        int originalSize = changes.size();
        int compactedSize = latestByField.size();
        if (compactedSize < originalSize) {
            log.debug("Compacted {} changes to {} (removed {} duplicates)",
                originalSize, compactedSize, originalSize - compactedSize);
        }

        return new ArrayList<>(latestByField.values());
    }

    private void broadcastChangesInBatches(List<FieldChange> changes, String originMachineId) {
        int sseBatchSize = 100;
        for (int i = 0; i < changes.size(); i += sseBatchSize) {
            int end = Math.min(i + sseBatchSize, changes.size());
            List<FieldChange> batch = changes.subList(i, end);
            hubSseService.broadcastChanges(batch, originMachineId);
        }
    }

    // -------------------------------------------------------------------
    // DTOs
    // -------------------------------------------------------------------

    private static class ProcessingResult {
        int changesReceived = 0;
        int duplicatesSkipped = 0;
        List<FieldChange> savedChanges = new ArrayList<>();
    }

    @Builder
    @Getter
    public static class SyncResponse {
        private boolean success;
        private int changesReceived;
        private int duplicatesSkipped;
        private int changesSent;
        private List<FieldChange> changes;
        private String errorMessage;
        private long totalPending;
        private boolean hasMore;
    }

    @Builder
    @Getter
    public static class SyncRequest {
        private String machineId;
        private String machineName;
        private List<FieldChange> changes;
    }
}
