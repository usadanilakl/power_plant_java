package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Handles synchronization with a central sync server.
 * This replaces peer-to-peer sync when sync.server.enabled=true.
 *
 * Key improvements for large data handling:
 * - Batched sync with configurable batch size (default 500)
 * - Pagination support for retrieving changes
 * - Progress tracking for long-running syncs
 * - Graceful handling of partial failures
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CentralSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final SyncContext syncContext;
    private final FieldSyncService fieldSyncService;
    // Records changes abandoned by the deferral give-up budget, so the budget can't become a slow
    // silent drop for the relationship data that now routes through it.
    private final SyncDeadLetterService syncDeadLetterService;
    private final ApplicationContext applicationContext;
    private final WorkRequestMergeService workRequestMergeService;
    private final JhaMergeService jhaMergeService;
    private final SharePointSyncSettings syncIntervals;
    private final SyncUpdateController syncUpdateController;

    // Lazily fetched to avoid circular dependency
    private ServerSseClient serverSseClient;

    // Independent locks for send and receive — so local changes can reach the hub
    // immediately even while the receive phase is downloading a large backlog.
    private final AtomicBoolean sending = new AtomicBoolean(false);
    private final AtomicBoolean receiving = new AtomicBoolean(false);
    private volatile boolean serverAvailable = false;

    private volatile boolean backlogTooLarge = false;

    // Sync metrics
    private final AtomicLong totalChangesSent = new AtomicLong(0);
    private final AtomicLong totalChangesReceived = new AtomicLong(0);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    // D6: how many times a change may be deferred (parent not yet arrived) before we give up and ack
    // it anyway, so a change whose referenced entity never arrives can't re-pull forever. In-memory,
    // per-client; resets on restart (a restart legitimately re-attempts).
    private static final int MAX_DEFERRALS = 15;
    private final java.util.Map<java.util.UUID, Integer> deferralAttempts = new java.util.concurrent.ConcurrentHashMap<>();

    private static final int DEFAULT_SEND_BATCH_SIZE = 5000;
    private static final int DEFAULT_RECEIVE_BATCH_SIZE = 100;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;
    private static final long DEFAULT_RECEIVE_MAX_DURATION_MS = 1500;

    @Value("${sync.receive.batch-size:100}")
    private int receiveBatchSize = DEFAULT_RECEIVE_BATCH_SIZE;

    @Value("${sync.receive.max-duration-ms:1500}")
    private long receiveMaxDurationMs = DEFAULT_RECEIVE_MAX_DURATION_MS;

    private ServerSseClient getServerSseClient() {
        if (serverSseClient == null) {
            serverSseClient = applicationContext.getBean(ServerSseClient.class);
        }
        return serverSseClient;
    }

    /**
     * Get the configured batch size for sync operations.
     */
    private int getSendBatchSize() {
        return DEFAULT_SEND_BATCH_SIZE;
    }

    int getReceiveBatchSize() {   // package-visible so the ack-gate/head-of-line test can control page size
        return receiveBatchSize;
    }

    /**
     * Sync with central server on application startup.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (syncConfig.isHubMode()) {
            log.info("server_sync.startup.skipped reason=hub_mode");
            return;
        }
        if (!syncConfig.isServerSyncEnabled()) {
            log.info("server_sync.startup.skipped reason=disabled");
            return;
        }

        log.info("server_sync.startup.begin url={}", syncConfig.getSyncServerUrl());

        try { Thread.sleep(5000); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        // Send first, then receive — send is fast and critical
        sendToServer();
        receiveFromServer();
    }

    /**
     * Triggered when local changes are detected.
     * Only sends — does NOT wait for receive. This ensures local changes
     * reach the hub within seconds regardless of any receive backlog.
     */
    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncEnabled()) return;
        if (event.getChanges() == null || event.getChanges().isEmpty()) return;

        int eventSize = event.getChanges().size();
        log.debug("Changes detected ({} changes), sending to server", eventSize);

        // No commit-wait needed anymore: every emission path now PUBLISHES on afterCommit of its own
        // transaction (Inc 1) — UPDATE in the caller's tx; CREATE/DELETE/backfill in their own
        // REQUIRES_NEW tx — so the FieldChange rows are always committed when this @Async handler runs.
        // The old Thread.sleep(500) worked around the CREATE path that used to publish pre-commit.
        //
        // restoreMissingEventChanges is retained as a (now-expected-no-op) per-event safety net and
        // should log NOTHING; once the content-hash harness confirms zero restores over a release it
        // becomes a pure assertion. It is unconditional (never gated on the global pending count) so a
        // concurrent sibling change-set can't mask this event's own rows failing to persist.
        long pendingForServer = restoreMissingEventChanges(event.getChanges());
        log.info("server_sync.changes_detected eventChanges={} pendingForServer={}",
            eventSize, pendingForServer);

        sendToServer();
    }

    /**
     * Ensure every change carried by a just-published event is durably persisted as an
     * outbound (SERVER-pending) row, re-saving any that failed to persist. Runs on every
     * change event and is never gated on the global pending count, so a concurrent event's
     * pending rows cannot mask this event's own changes leaking. Returns the current
     * SERVER-pending count (for the caller's diagnostic log).
     */
    private long restoreMissingEventChanges(List<FieldChange> eventChanges) {
        List<FieldChange> restorable = eventChanges.stream()
            .filter(change -> change.getId() != null)
            .filter(change -> !change.isSyncedTo("SERVER"))
            .toList();

        if (!restorable.isEmpty()) {
            Set<java.util.UUID> persistedIds = new HashSet<>();
            fieldChangeRepository.findAllById(
                restorable.stream().map(FieldChange::getId).toList()
            ).forEach(change -> persistedIds.add(change.getId()));

            List<FieldChange> missing = restorable.stream()
                .filter(change -> !persistedIds.contains(change.getId()))
                .toList();

            if (!missing.isEmpty()) {
                fieldChangeRepository.saveAll(missing);
                log.warn("server_sync.restored_missing count={} ids={} "
                    + "(published changes had not persisted as SERVER-pending rows)",
                    missing.size(),
                    missing.stream().map(change -> change.getId().toString()).toList());
            }
        }

        return fieldChangeRepository.countPendingChangesFor("SERVER");
    }

    /**
     * Polls every 15s; runs send + receive when interval has elapsed.
     * markPeerSynced() is called only when the full backlog has been drained.
     * If receive yields early (wall-clock budget), the next poll fires again
     * without waiting for the full peer sync interval.
     */
    @Scheduled(fixedDelay = 15000, initialDelay = 60000)
    public void periodicSync() {
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncEnabled()) return;
        if (!syncIntervals.isPeerSyncDue()) return;
        sendToServer();
        SyncResult receiveResult = receiveFromServer();
        if (!receiveResult.isMorePending()) {
            syncIntervals.markPeerSynced();
        }
    }

    /**
     * Send local pending changes to the hub. Independent of receive — can run
     * even while receive is downloading. Uses its own lock so sends are never
     * blocked by a slow receive phase.
     */
    public SyncResult sendToServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        if (!sending.compareAndSet(false, true)) {
            // Surfaced at INFO so a wedged send lock (held by a stuck/long-running send)
            // is visible without DEBUG. If this repeats while pendingForServer>0, the
            // lock — not the data — is blocking outbound sync.
            log.info("server_sync.send.skipped reason=sendInProgress pendingForServer={}",
                fieldChangeRepository.countPendingChangesFor("SERVER"));
            return new SyncResult(false, "Send in progress", 0, 0, 0);
        }

        SyncResult result = new SyncResult();
        try {
            int totalSent = sendOutgoingChangesInBatches();
            result.setChangesSent(totalSent);
            result.setSuccess(true);
            serverAvailable = true;
            consecutiveFailures.set(0);
            totalChangesSent.addAndGet(totalSent);

            if (totalSent > 0) {
                log.info("server_sync.send.done sent={}", totalSent);
            }
        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            consecutiveFailures.incrementAndGet();
            log.error("server_sync.send.failed: {}", e.getMessage());
        } finally {
            sending.set(false);
        }
        return result;
    }

    /**
     * Receive pending changes from the hub. Independent of send — uses its own lock.
     * If the backlog exceeds BACKLOG_THRESHOLD, skips incremental receive and sets
     * backlogTooLarge flag so the UI can recommend a full resync.
     */
    public SyncResult receiveFromServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        if (!receiving.compareAndSet(false, true)) {
            log.debug("Receive already in progress, skipping");
            return new SyncResult(false, "Receive in progress", 0, 0, 0);
        }

        SyncResult result = new SyncResult();
        try {
            // Check backlog size before committing to a long download
            long pendingCount = getPendingChangeCountFromServer();
            if (pendingCount < 0) {
                throw new RuntimeException("Server unreachable");
            }
            backlogTooLarge = false;

            BatchedReceiveResult receiveResult = receiveIncomingChangesInBatches();
            result.setChangesReceived(receiveResult.totalReceived);
            result.setChangesApplied(receiveResult.totalApplied);
            result.setMorePending(receiveResult.morePending);
            result.setSuccess(true);
            serverAvailable = true;

            totalChangesReceived.addAndGet(receiveResult.totalReceived);

            if (receiveResult.totalReceived > 0) {
                log.info("server_sync.receive.done received={} applied={} morePending={}",
                    receiveResult.totalReceived, receiveResult.totalApplied, receiveResult.morePending);
            }

            // Post-receive dedup — skip when more batches are pending to avoid
            // repeated expensive merge scans during backlog catch-up
            if (receiveResult.totalApplied > 0 && !receiveResult.morePending) {
                try { workRequestMergeService.mergeIfDuplicatesExist(); } catch (Exception ex) {
                    log.error("Post-sync WorkRequest merge failed: {}", ex.getMessage(), ex);
                }
                try { jhaMergeService.mergeIfDuplicatesExist(); } catch (Exception ex) {
                    log.error("Post-sync JHA merge failed: {}", ex.getMessage(), ex);
                }
            }
        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            consecutiveFailures.incrementAndGet();
            log.error("server_sync.receive.failed: {}", e.getMessage());
        } finally {
            receiving.set(false);
        }
        return result;
    }

    /**
     * Combined sync — kept for backward compatibility (trigger endpoint, etc.).
     * Calls send then receive independently.
     */
    public SyncResult syncWithServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        // Circuit breaker
        if (consecutiveFailures.get() >= MAX_CONSECUTIVE_FAILURES) {
            int failures = consecutiveFailures.incrementAndGet();
            if (failures > MAX_CONSECUTIVE_FAILURES * 2) {
                log.info("server_sync.circuit_breaker.self_heal failures={}", failures);
                consecutiveFailures.set(0);
            } else {
                log.warn("Too many consecutive sync failures ({}), backing off", failures);
                return new SyncResult(false, "Circuit breaker open - too many failures", 0, 0, 0);
            }
        }

        SyncResult sendResult = sendToServer();
        SyncResult receiveResult = receiveFromServer();

        SyncResult combined = new SyncResult();
        combined.setSuccess(sendResult.isSuccess() || receiveResult.isSuccess());
        combined.setChangesSent(sendResult.getChangesSent());
        combined.setChangesReceived(receiveResult.getChangesReceived());
        combined.setChangesApplied(receiveResult.getChangesApplied());
        if (!combined.isSuccess()) {
            combined.setErrorMessage(sendResult.getErrorMessage() != null ?
                sendResult.getErrorMessage() : receiveResult.getErrorMessage());
        }

        log.info("server_sync.run.complete sent={} received={} applied={}",
            combined.getChangesSent(), combined.getChangesReceived(), combined.getChangesApplied());

        return combined;
    }

    /**
     * Send outgoing changes to server in batches.
     * This prevents memory issues with large change sets.
     */
    protected int sendOutgoingChangesInBatches() {
        int batchSize = getSendBatchSize();
        int totalSent = 0;
        int batchNumber = 0;

        // First, count total pending changes
        long totalPending = fieldChangeRepository.countPendingChangesFor("SERVER");
        if (totalPending == 0) {
            log.debug("No outgoing changes to send");
            return 0;
        }

        log.info("server_sync.send.start pending={} batchSize={}", totalPending, batchSize);

        // Process in batches until no more changes
        while (true) {
            Page<FieldChange> batch = fieldChangeRepository.findChangesNotSyncedTo(
                "SERVER", PageRequest.of(0, batchSize)); // Always page 0 since we mark as synced

            if (batch.isEmpty()) {
                break;
            }

            List<FieldChange> changes = batch.getContent();
            batchNumber++;

            try {
                // Send this batch
                SyncResponse response = sendBatchToServer(changes);

                if (response != null && response.isSuccess()) {
                    // Mark changes as synced
                    for (FieldChange change : changes) {
                        change.addSyncedMachine("SERVER");
                    }
                    fieldChangeRepository.saveAll(changes);
                    totalSent += changes.size();

                    // Emit activity events for sent changes
                    for (FieldChange change : changes) {
                        try {
                            syncUpdateController.broadcastSyncActivity(
                                SyncUpdateController.SyncActivityEvent.builder()
                                    .direction("SENDING")
                                    .entityType(change.getEntityType())
                                    .entityId(String.valueOf(change.getEntityId()))
                                    .changeType(change.getChangeType() != null ? change.getChangeType().name() : "UPDATE")
                                    .status("SUCCESS")
                                    .timestamp(System.currentTimeMillis())
                                    .build());
                        } catch (Exception ignored) {}
                    }

                    log.debug("Batch {}: sent {} changes successfully", batchNumber, changes.size());
                } else {
                    log.warn("Batch {} failed: {}", batchNumber,
                        response != null ? response.getErrorMessage() : "null response");
                    break; // Stop on failure, will retry next sync
                }
            } catch (Exception e) {
                log.error("Error sending batch {}: {}", batchNumber, e.getMessage());
                break; // Stop on error, will retry next sync
            }

            // Safety check to prevent infinite loop
            if (batchNumber > 1000) {
                log.warn("Too many batches ({}), stopping to prevent infinite loop", batchNumber);
                break;
            }
        }

        log.info("server_sync.send.complete sent={} batches={}", totalSent, batchNumber);
        return totalSent;
    }

    /**
     * Send a single batch of changes to the server.
     */
    private SyncResponse sendBatchToServer(List<FieldChange> changes) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/exchange";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("Accept-Encoding", "gzip"); // Request compressed response

        Map<String, Object> request = new HashMap<>();
        request.put("machineId", syncConfig.getMachineId());
        request.put("machineName", syncConfig.getMachineName());
        request.put("changes", changes);
        request.put("batchMode", true); // Indicate batched sync

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        ResponseEntity<SyncResponse> response = restTemplate.exchange(
            url, HttpMethod.POST, entity,
            new ParameterizedTypeReference<SyncResponse>() {}
        );

        return response.getBody();
    }

    /**
     * Receive incoming changes from server in batches.
     */
    protected BatchedReceiveResult receiveIncomingChangesInBatches() {
        BatchedReceiveResult result = new BatchedReceiveResult();
        int batchSize = getReceiveBatchSize();
        int batchNumber = 0;
        long startTime = System.currentTimeMillis();

        // First, check how many changes the server has for us
        long pendingCount = getPendingChangeCountFromServer();
        if (pendingCount < 0) {
            // Server is unreachable - propagate as error so circuit breaker works
            throw new RuntimeException("Server unreachable - cannot get pending change count");
        }
        if (pendingCount == 0) {
            log.debug("No incoming changes from server");
            return result;
        }

        log.info("server_sync.receive.start pending={} batchSize={} budgetMs={}", pendingCount, batchSize, receiveMaxDurationMs);

        // Request changes in batches using the paginated endpoint
        int page = 0;
        // D6: count each deferred change at most ONCE per drain (not per loop iteration), so the
        // MAX_DEFERRALS give-up budget spans real sync cycles (minutes) rather than one fast spin.
        java.util.Set<java.util.UUID> countedThisDrain = new java.util.HashSet<>();
        while (true) {
            // Wall-clock budget: yield between batches to let HTTP requests through.
            // The next scheduled run (or immediate follow-up) will continue draining.
            if (batchNumber > 0 && (System.currentTimeMillis() - startTime) >= receiveMaxDurationMs) {
                result.morePending = true;
                log.info("server_sync.receive.yield elapsed={}ms batches={} received={} applied={}",
                    System.currentTimeMillis() - startTime, batchNumber, result.totalReceived, result.totalApplied);
                break;
            }

            try {
                List<FieldChange> batch = fetchBatchFromServer(page, batchSize);

                if (batch == null || batch.isEmpty()) {
                    break;
                }

                batchNumber++;
                result.totalReceived += batch.size();

                // Apply this batch, collecting DEFERRED change ids (relationship changes whose parent
                // hasn't arrived yet — transient, will retry).
                java.util.Set<java.util.UUID> deferred = new java.util.HashSet<>();
                int applied = applyIncomingChanges(batch, deferred);
                result.totalApplied += applied;

                // Bound deferral: a change whose referenced entity never arrives must not re-pull
                // forever. After MAX_DEFERRALS attempts, give up and let it be acked (matches the old
                // drop behavior, but only after real retries — so a transient parent-lag converges).
                if (!deferred.isEmpty()) {
                    deferred.removeIf(id -> {
                        // Advance the attempt counter only on this id's FIRST appearance in this drain,
                        // so a spinning/mixed drain can't burn the whole MAX_DEFERRALS budget at once.
                        int n = countedThisDrain.add(id)
                                ? deferralAttempts.merge(id, 1, Integer::sum)
                                : deferralAttempts.getOrDefault(id, 0);
                        if (n >= MAX_DEFERRALS) {
                            // Giving up and acking is correct — an unresolvable change must not re-pull
                            // forever and stall the pipeline behind it. But the change IS being
                            // abandoned, so it must be RECORDED. Without this, the retry budget is just
                            // a slower silent drop — and now that every incomplete ManyToMany and
                            // missing parent lands here, this valve drains exactly the LOTO data we care
                            // about. Dead-letter first, then ack.
                            FieldChange abandoned = batch.stream()
                                    .filter(c -> id.equals(c.getId()))
                                    .findFirst().orElse(null);
                            log.error("server_sync.receive.deferred_giveup changeId={} attempts={} entity={}#{} field={} "
                                            + "— dead-lettering, then acking to stop the re-pull loop", id, n,
                                    abandoned != null ? abandoned.getEntityType() : "?",
                                    abandoned != null ? abandoned.getEntityId() : "?",
                                    abandoned != null ? abandoned.getFieldName() : "?");
                            syncDeadLetterService.recordUnresolvedAfterRetries(abandoned, n);
                            deferralAttempts.remove(id);
                            return true; // drop from deferred -> gets acked (recorded, no longer silent)
                        }
                        return false;
                    });
                }

                // Acknowledge only TERMINAL changes (applied, or LWW-superseded as older). Deferred
                // changes are NOT acked, so the hub keeps them pending and re-sends them next cycle.
                // Previously ALL received ids were acked — a deferred change got marked synced on the
                // hub and was then silently dropped (D6). LWW-superseded changes are still acked (the
                // client has the newer value and never needs them again).
                List<java.util.UUID> ackIds = batch.stream()
                    .map(FieldChange::getId)
                    .filter(java.util.Objects::nonNull)
                    .filter(id -> !deferred.contains(id))
                    .collect(java.util.stream.Collectors.toList());
                try {
                    if (!ackIds.isEmpty()) {
                        acknowledgeChangesToServer(ackIds);
                        // Clear retry budgets ONLY after the ack actually lands. Clearing before the call
                        // meant a failed ack re-delivered the same rows with their budget reset, so a
                        // change could defer indefinitely without ever reaching the give-up valve —
                        // turning a bounded stall into an unbounded one.
                        ackIds.forEach(deferralAttempts::remove);
                    }
                } catch (Exception ackEx) {
                    log.warn("Failed to acknowledge changes: {}", ackEx.getMessage());
                }
                if (!deferred.isEmpty()) {
                    log.info("server_sync.receive.deferred count={} (kept pending for retry, not acked)",
                        deferred.size());
                }

                // Head-of-line fix: a FULL page that acked NOTHING (every change deferred — e.g. a parent
                // that hasn't arrived) must not stall the healthy changes queued BEHIND it for up to
                // MAX_DEFERRALS cycles. Advance past it THIS drain so those get through now.
                //   Skip-safe: we advance ONLY on a full all-deferred page, and deferred changes are never
                //   acked, so every offset we step over — [0 .. page*batchSize) — stays occupied by exactly
                //   those still-pending deferred rows. The next unacked change is therefore always at
                //   page*batchSize; nothing is skipped. The paged-over deferred rows stay pending and are
                //   retried next cycle (give-up budget advances once per cycle via countedThisDrain).
                if (ackIds.isEmpty() && !deferred.isEmpty()) {
                    result.morePending = true;
                    if (batch.size() < batchSize) {
                        // Partial trailing page, entirely deferred — nothing healthy behind it; yield.
                        log.info("server_sync.receive.all_deferred count={} (tail) — yielding to next cycle", deferred.size());
                        break;
                    }
                    page++;
                    log.info("server_sync.receive.page_all_deferred count={} — paging past to reach changes behind it (page={})",
                        deferred.size(), page);
                    if (batchNumber > 1000) {
                        log.warn("Too many receive batches ({}), stopping", batchNumber);
                        break;
                    }
                    continue;
                }

                log.debug("Batch {}: received {} changes, applied {}", batchNumber, batch.size(), applied);

                // If we got less than batch size, we've reached the end
                if (batch.size() < batchSize) {
                    break;
                }

                // Re-fetch the SAME page: acknowledged changes are removed from the pending set, shifting
                // the next unacknowledged batch DOWN into this page's window. `page` is only ever advanced
                // above (to step over a full, still-deferred page); it is never reset within a drain, so
                // the deferred prefix we have paged over is neither re-fetched nor skipped.

                // Safety check
                if (batchNumber > 1000) {
                    log.warn("Too many receive batches ({}), stopping", batchNumber);
                    break;
                }
            } catch (Exception e) {
                log.error("Error receiving batch {}: {}", batchNumber, e.getMessage());
                break;
            }
        }

        log.info("server_sync.receive.complete received={} applied={} batches={} morePending={}",
            result.totalReceived, result.totalApplied, batchNumber, result.morePending);
        return result;
    }

    /**
     * Get the count of pending changes from server.
     * Returns -1 if the server is unreachable, so callers can distinguish
     * "no changes" from "server is down".
     */
    long getPendingChangeCountFromServer() {
        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/count";

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Long>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity,
                new ParameterizedTypeReference<Map<String, Long>>() {}
            );

            Map<String, Long> body = response.getBody();
            return body != null ? body.getOrDefault("count", 0L) : 0L;
        } catch (Exception e) {
            log.warn("Failed to get pending change count: {}", e.getMessage());
            return -1L;
        }
    }

    /**
     * Fetch a batch of changes from the server.
     */
    List<FieldChange> fetchBatchFromServer(int page, int size) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/batch?page=" + page + "&size=" + size;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("Accept-Encoding", "gzip");

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
            url, HttpMethod.GET, entity,
            new ParameterizedTypeReference<List<FieldChange>>() {}
        );

        return response.getBody();
    }

    /**
     * Acknowledge successfully applied changes to the server.
     * The server only marks changes as synced after this call,
     * so if the client fails to apply, the changes will be re-sent next cycle.
     */
    void acknowledgeChangesToServer(List<java.util.UUID> changeIds) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/acknowledge";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());

        HttpEntity<List<java.util.UUID>> entity = new HttpEntity<>(changeIds, headers);
        restTemplate.postForEntity(url, entity, Map.class);

        log.debug("Acknowledged {} changes to server", changeIds.size());
    }

    /**
     * Helper class for batched receive results.
     */
    static class BatchedReceiveResult {
        int totalReceived = 0;
        int totalApplied = 0;
        boolean morePending = false;
    }

    /**
     * Apply incoming changes from server using LWW.
     */
    private int applyIncomingChanges(List<FieldChange> incomingChanges) {
        return applyIncomingChanges(incomingChanges, null);
    }

    /** Apply variant that also collects deferred change ids (D6) so the caller can avoid acking them.
     *  Package-visible (not private) so the ack-gate loop test can stub deferral deterministically. */
    int applyIncomingChanges(List<FieldChange> incomingChanges, java.util.Set<java.util.UUID> deferredOut) {
        syncContext.startSync();
        try {
            return fieldSyncService.applyIncomingChanges(incomingChanges, false, deferredOut);
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * Check if server is available.
     */
    public boolean isServerAvailable() {
        return serverAvailable;
    }

    /**
     * Check if SSE real-time connection is active.
     */
    public boolean isSseConnected() {
        try {
            ServerSseClient client = getServerSseClient();
            return client != null && client.isConnected();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get pending changes count (not yet synced to server).
     * Uses count query instead of loading all changes.
     */
    public long getPendingChangeCount() {
        return fieldChangeRepository.countPendingChangesFor("SERVER");
    }

    /**
     * Check server health.
     */
    public boolean checkServerHealth() {
        if (!syncConfig.isServerSyncEnabled()) {
            return false;
        }

        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            serverAvailable = response.getStatusCode().is2xxSuccessful();
            return serverAvailable;
        } catch (Exception e) {
            serverAvailable = false;
            return false;
        }
    }

    /**
     * Get sync metrics for monitoring.
     */
    public boolean isBacklogTooLarge() {
        return backlogTooLarge;
    }

    public SyncMetrics getMetrics() {
        return new SyncMetrics(
            totalChangesSent.get(),
            totalChangesReceived.get(),
            consecutiveFailures.get(),
            sending.get() || receiving.get(),
            serverAvailable,
            isSseConnected(),
            getPendingChangeCount()
        );
    }

    /**
     * Reset consecutive failure counter and mark server as available.
     * Called when server connectivity is confirmed (e.g., SSE connection established).
     */
    public void resetCircuitBreaker() {
        consecutiveFailures.set(0);
        serverAvailable = true;
        log.info("server_sync.circuit_breaker.reset");
    }

    // DTOs
    @lombok.Data
    public static class SyncResponse {
        private boolean success;
        private int changesReceived;
        private int duplicatesSkipped;
        private int changesSent;
        private List<FieldChange> changes;
        private String errorMessage;
        // Pagination support
        private int page;
        private int totalPages;
        private long totalElements;
        private boolean hasMore;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    public static class SyncResult {
        private boolean success;
        private String errorMessage;
        private int changesSent;
        private int changesReceived;
        private int changesApplied;
        private boolean morePending;

        public SyncResult(boolean success, String errorMessage, int changesSent, int changesReceived, int changesApplied) {
            this.success = success;
            this.errorMessage = errorMessage;
            this.changesSent = changesSent;
            this.changesReceived = changesReceived;
            this.changesApplied = changesApplied;
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SyncMetrics {
        private long totalChangesSent;
        private long totalChangesReceived;
        private int consecutiveFailures;
        private boolean syncInProgress;
        private boolean serverAvailable;
        private boolean sseConnected;
        private long pendingChanges;
    }
}
