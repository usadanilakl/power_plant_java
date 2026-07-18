package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.hub.HubClientInfoRepository;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.DispositionLedger;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.HubApplyStateSink;
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
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
    private final TransactionTemplate transactionTemplate;
    private final SharePointSyncOrchestrator sharePointSyncOrchestrator;
    private final HubApplyStateSink hubApplyStateSink;

    // Legacy in-memory apply-failure recovery. Used ONLY when the durable apply-state path is off
    // (hubApplyStateSink.isDurableEnabled() == false). A hub restart wipes this queue — that IS the D7
    // defect the durable path (Inc 7) fixes. The two paths are mutually exclusive: when durable is on,
    // the vthread never offers here and retryPendingEntityApplication early-returns, so a change is never
    // recovered by both.
    private final AtomicBoolean pendingEntityRetry = new AtomicBoolean(false);
    private final java.util.concurrent.ConcurrentLinkedQueue<List<FieldChange>> failedBatches = new java.util.concurrent.ConcurrentLinkedQueue<>();

    public SyncResponse syncExchange(String machineId, String machineName,
                                     String ipAddress, Integer deviceNumber,
                                     List<FieldChange> incomingChanges) {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openSyncScope("hub.syncExchange", syncConfig.getMachineId())) {
            LoggingContext.setMachineId(machineId);
            log.info("Hub sync exchange from {} ({}): {} incoming changes",
                machineName, machineId, incomingChanges != null ? incomingChanges.size() : 0);

            // Phase 1: Register client
            transactionTemplate.executeWithoutResult(status -> {
                HubClientInfo client = doRegisterClient(machineId, machineName, ipAddress, deviceNumber);
                client.setStatus(HubClientInfo.ClientStatus.SYNCING);
                hubClientInfoRepository.save(client);
            });

            // Phase 2: Save FieldChange records.
            // Signal SP sync to yield between items — SP checks clientSyncInProgress
            // and pauses its per-item processing loop, freeing the H2 table lock.
            sharePointSyncOrchestrator.setClientSyncInProgress(true);
            ProcessingResult result;
            try {
                result = processIncomingChangesBatched(incomingChanges, machineId);
            } finally {
                sharePointSyncOrchestrator.setClientSyncInProgress(false);
            }

            // Phase 3: Update client status
            transactionTemplate.executeWithoutResult(status -> {
                HubClientInfo client = hubClientInfoRepository.findById(machineId)
                    .orElse(new HubClientInfo(machineId, machineName, ipAddress));
                client.recordSync(result.changesReceived, 0);
                client.setStatus(HubClientInfo.ClientStatus.ONLINE);
                hubClientInfoRepository.save(client);
            });

            log.info("Hub sync complete for {}: received={}, skipped={}, durationMs={}",
                machineName, result.changesReceived, result.duplicatesSkipped,
                System.currentTimeMillis() - start);

            // Phase 4: Apply to hub entities + broadcast asynchronously.
            // Safe because FieldChanges are already saved — apply failures are recovered by either the
            // durable rescan (Inc 7, HubApplyStateRecovery) or the legacy in-memory queue, per the flag.
            if (!result.savedChanges.isEmpty()) {
                List<FieldChange> savedCopy = new ArrayList<>(result.savedChanges);
                String originMachine = machineId;
                boolean durable = hubApplyStateSink.isDurableEnabled();
                Thread.ofVirtual().name("hub-apply-" + machineId).start(() -> {
                    try {
                        if (durable) {
                            // Co-commit B runs INSIDE the apply tx; then advance the retry budget for
                            // anything still non-terminal (separate tx, so it survives an apply rollback).
                            DispositionLedger ledger = fieldSyncService.applyIncomingChangesTracked(savedCopy, true);
                            hubApplyStateSink.bumpRetryable(ledger.idDispositions());
                        } else {
                            int applied = fieldSyncService.applyIncomingChanges(savedCopy, true);
                            log.debug("Applied {} changes to hub entities from {}", applied, originMachine);
                        }
                    } catch (Exception e) {
                        log.error("Failed to apply changes to hub entities from {}: {}", originMachine, e.getMessage());
                        if (!durable) {
                            // Legacy path only. Under the durable path the co-committed PENDING/FAILED rows
                            // + the restart-safe rescan handle recovery — no in-memory queue to lose.
                            failedBatches.offer(savedCopy);
                            pendingEntityRetry.set(true);
                        }
                    }
                    broadcastChangesInBatches(savedCopy, originMachine);
                });
            }

            return SyncResponse.builder()
                .success(true)
                .changesReceived(result.changesReceived)
                .duplicatesSkipped(result.duplicatesSkipped)
                .changesSent(0)
                .changes(List.of())
                .totalPending(0)
                .build();
        }
    }

    @Transactional(readOnly = true)
    public Page<FieldChange> getPendingChangesPaginated(String machineId, Pageable pageable) {
        // Return pending changes WITHOUT marking as synced.
        // Client must call acknowledgeChanges() after successful apply.
        // Excludes changes that originated FROM this client — no point sending them back.
        return fieldChangeRepository.findChangesNotSyncedToExcludingOrigin(machineId, pageable);
    }

    /**
     * Mark changes as synced to a client AFTER the client confirms successful apply.
     * This prevents changes from being lost if the client fetches but fails to apply.
     */
    @Transactional
    public int acknowledgeChanges(String machineId, List<UUID> changeIds) {
        if (changeIds == null || changeIds.isEmpty()) return 0;

        List<FieldChange> changes = fieldChangeRepository.findAllById(changeIds);
        for (FieldChange change : changes) {
            change.addSyncedMachine(machineId);
        }
        if (!changes.isEmpty()) {
            fieldChangeRepository.saveAll(changes);
        }
        log.debug("Acknowledged {} changes for {}", changes.size(), machineId);
        return changes.size();
    }

    /**
     * Reset sync status for a client — removes machine ID from all syncedToMachines fields.
     * All changes become pending for this client again.
     */
    @Transactional
    public int resetSyncStatusForClient(String machineId) {
        int reset = fieldChangeRepository.removeMachineFromSynced(machineId);
        log.info("Reset sync status for {}: {} changes re-queued", machineId, reset);
        return reset;
    }

    @Transactional
    public int markAllSyncedToClient(String machineId) {
        int marked = fieldChangeRepository.markAllChangesSyncedTo(machineId);
        log.info("Marked all {} changes as synced to {} (full resync)", marked, machineId);
        return marked;
    }

    @Transactional
    public int clearSelfOriginatedChanges(String machineId) {
        int cleared = fieldChangeRepository.markOwnChangesSyncedTo(machineId);
        log.info("Cleared self-originated changes for {}: {} marked as synced", machineId, cleared);
        return cleared;
    }

    public long getPendingChangeCount(String machineId) {
        return fieldChangeRepository.countPendingChangesForExcludingOrigin(machineId);
    }

    @Transactional
    public HubClientInfo registerClient(String machineId, String machineName, String ipAddress) {
        return doRegisterClient(machineId, machineName, ipAddress, null);
    }

    @Transactional
    public HubClientInfo registerClient(String machineId, String machineName,
                                        String ipAddress, Integer deviceNumber) {
        return doRegisterClient(machineId, machineName, ipAddress, deviceNumber);
    }

    private HubClientInfo doRegisterClient(String machineId, String machineName,
                                           String ipAddress, Integer deviceNumber) {
        HubClientInfo client = hubClientInfoRepository.findById(machineId)
            .orElse(new HubClientInfo(machineId, machineName, ipAddress));

        client.setMachineName(machineName);
        client.setIpAddress(ipAddress);
        client.recordActivity();
        if (deviceNumber != null && deviceNumber >= 0) {
            client.setDeviceNumber(deviceNumber);
        }

        return hubClientInfoRepository.save(client);
    }

    public List<HubClientInfo> getAllClients() {
        return hubClientInfoRepository.findAll();
    }

    public List<HubClientInfo> getActiveClients() {
        Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
        return hubClientInfoRepository.findByLastSeenAfter(cutoff);
    }

    @Scheduled(fixedDelay = 30000)
    public void sendSseHeartbeat() {
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("hub.sendSseHeartbeat")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            hubSseService.sendHeartbeat();
        }
    }

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void markInactiveClients() {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("hub.markInactiveClients")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
            int onlineClients = hubClientInfoRepository.findByStatus(HubClientInfo.ClientStatus.ONLINE).size();
            int markedOffline = hubClientInfoRepository.markClientsOfflineBefore(
                cutoff,
                HubClientInfo.ClientStatus.ONLINE,
                HubClientInfo.ClientStatus.OFFLINE
            );

            log.info("hub.markInactiveClients.complete onlineChecked={} markedOffline={} durationMs={}",
                onlineClients, markedOffline, System.currentTimeMillis() - start);
        }
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 120_000)
    public void retryPendingEntityApplication() {
        // Mutually exclusive with the durable path: when it is on, HubApplyStateRecovery's rescan owns
        // recovery and the vthread never populates failedBatches, so this must not also run.
        if (hubApplyStateSink.isDurableEnabled()) return;
        if (!pendingEntityRetry.compareAndSet(true, false)) return;

        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("hub.retryPendingEntityApplication")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());

            int totalRetried = 0;
            boolean anyFailed = false;
            List<FieldChange> batch;

            while ((batch = failedBatches.poll()) != null) {
                try {
                    int applied = fieldSyncService.applyIncomingChanges(batch, true);
                    totalRetried += applied;
                } catch (Exception e) {
                    log.error("Retry failed for batch of {} changes: {}", batch.size(), e.getMessage());
                    failedBatches.offer(batch); // Re-queue for next cycle
                    anyFailed = true;
                    break; // Don't retry remaining batches if one fails
                }
            }

            if (totalRetried > 0) {
                log.info("Periodic retry: applied {} changes in {} ms", totalRetried, System.currentTimeMillis() - start);
            }
            if (anyFailed) {
                pendingEntityRetry.set(true); // Schedule another retry
            }
        }
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldChanges() {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("hub.cleanupOldChanges")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            Instant cutoff = Instant.now().minus(hubSyncConfig.getRetentionDays(), ChronoUnit.DAYS);
            int deleted = fieldChangeRepository.deleteChangesBefore(cutoff);
            log.info("hub.cleanupOldChanges.complete deleted={} retentionDays={} durationMs={}",
                deleted, hubSyncConfig.getRetentionDays(), System.currentTimeMillis() - start);
        }
    }

    private ProcessingResult processIncomingChangesBatched(List<FieldChange> incomingChanges, String machineId) {
        ProcessingResult result = new ProcessingResult();

        if (incomingChanges == null || incomingChanges.isEmpty()) {
            return result;
        }

        List<FieldChange> changesToProcess = hubSyncConfig.isCompactionEnabled()
            ? compactChanges(incomingChanges)
            : incomingChanges;

        String hubMachineId = syncConfig.getMachineId();
        Map<String, List<FieldChange>> changesByType = changesToProcess.stream()
            .collect(Collectors.groupingBy(FieldChange::getEntityType));

        // Process each entity type in its own transaction to keep connections short-lived
        for (Map.Entry<String, List<FieldChange>> entry : changesByType.entrySet()) {
            String entityType = entry.getKey();
            List<FieldChange> typeChanges = entry.getValue();

            transactionTemplate.executeWithoutResult(status -> {
                List<Long> entityIds = typeChanges.stream()
                    .map(FieldChange::getEntityId)
                    .distinct()
                    .collect(Collectors.toList());

                // Dedup re-delivered changes by their GLOBAL id (Inc 4). The old key-based gate
                // (findExistingChangeKeys + buildChangeKey) was a dead no-op — a Java-vs-SQL timestamp
                // format mismatch meant its keys never matched — so re-delivered changes were minted
                // fresh ids and accumulated as duplicate rows. Preserving the origin id would turn that
                // into a PK violation on saveAll, so the id-preserve and this gate MUST land together.
                java.util.Set<java.util.UUID> incomingIds = typeChanges.stream()
                    .map(FieldChange::getId).filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
                Set<java.util.UUID> existingIds = incomingIds.isEmpty()
                    ? java.util.Set.of()
                    : new HashSet<>(fieldChangeRepository.findExistingIds(incomingIds));

                Map<String, FieldChange> latestChanges = fieldChangeRepository
                    .findLatestChangesForEntities(entityType, entityIds)
                    .stream()
                    .collect(Collectors.toMap(
                        fc -> fc.getEntityType() + ":" + fc.getEntityId() + ":" + fc.getFieldName(),
                        fc -> fc,
                        com.dk_power.power_plant_java.sevice.sync.SyncOrder::max, // was `? a : b` (arbitrary on tie)
                        LinkedHashMap::new
                    ));

                List<FieldChange> batch = new ArrayList<>();
                java.util.Set<java.util.UUID> seenInThisBatch = new HashSet<>();
                for (FieldChange change : typeChanges) {
                    // Already stored (re-delivery), or a duplicate within this same batch — skip so the
                    // saveAll below can never hit a PK collision on the preserved id.
                    java.util.UUID cid = change.getId();
                    if (cid != null && (existingIds.contains(cid) || !seenInThisBatch.add(cid))) {
                        result.duplicatesSkipped++;
                        continue;
                    }

                    if (shouldAcceptChange(change, latestChanges)) {
                        FieldChange newChange = new FieldChange();
                        // Preserve the origin's global id (see the dedup note above); the custom id
                        // generator keeps a pre-set id where Hibernate's default UUID strategy re-mints.
                        newChange.setId(cid);
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
                        newChange.addSyncedMachine(machineId);
                        newChange.addSyncedMachine(hubMachineId);
                        batch.add(newChange);
                        result.changesReceived++;
                    } else {
                        log.debug("Skipping change for {}.{} - newer change exists",
                            change.getEntityType(), change.getFieldName());
                        result.duplicatesSkipped++;
                    }
                }

                if (!batch.isEmpty()) {
                    List<FieldChange> saved = fieldChangeRepository.saveAll(batch);
                    result.savedChanges.addAll(saved);
                    // Co-commit A (Inc 7): write a PENDING apply-state row for each newly-saved change in
                    // THIS SAME transaction. So no saved change ever lacks a durable "needs apply" marker,
                    // even if the hub crashes before the Phase-4 apply thread runs. No-op unless the
                    // durable path is enabled. (This is the exact hole the in-memory failedBatches had: a
                    // change saved-but-not-yet-applied at crash time had no durable record at all.)
                    hubApplyStateSink.ensurePending(saved);
                }
            });
        }

        return result;
    }

    private boolean shouldAcceptChange(FieldChange incoming, Map<String, FieldChange> latestChanges) {
        String key = incoming.getEntityType() + ":" + incoming.getEntityId() + ":" + incoming.getFieldName();
        FieldChange latest = latestChanges.get(key);
        // Same total order the clients use (SyncOrder). Was an inline copy with no final tiebreak.
        return com.dk_power.power_plant_java.sevice.sync.SyncOrder.incomingWins(incoming, latest);
    }

    private List<FieldChange> compactChanges(List<FieldChange> changes) {
        Map<String, FieldChange> latestByField = new LinkedHashMap<>();

        for (FieldChange change : changes) {
            String key = change.getEntityType() + ":" + change.getEntityId() + ":" + change.getFieldName();
            FieldChange existing = latestByField.get(key);
            // Same total order (SyncOrder). The old `isAfter` kept the first-encountered change on a
            // tie, so which duplicate survived depended on input order.
            if (existing == null || com.dk_power.power_plant_java.sevice.sync.SyncOrder.incomingWins(change, existing)) {
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
