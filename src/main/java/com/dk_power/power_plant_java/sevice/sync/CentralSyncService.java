package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Handles synchronization with a central sync server.
 * This replaces peer-to-peer sync when sync.server.enabled=true.
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
    private final ApplicationContext applicationContext;

    // Lazily fetched to avoid circular dependency
    private ServerSseClient serverSseClient;

    private volatile boolean syncing = false;
    private volatile boolean serverAvailable = false;
    private volatile boolean pendingSyncRequest = false; // Queue another sync if one is in progress

    private ServerSseClient getServerSseClient() {
        if (serverSseClient == null) {
            serverSseClient = applicationContext.getBean(ServerSseClient.class);
        }
        return serverSseClient;
    }

    /**
     * Sync with central server on application startup.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!syncConfig.isServerSyncEnabled()) {
            log.info("Central server sync is disabled");
            return;
        }

        log.info("Application ready - syncing with central server: {}", syncConfig.getSyncServerUrl());

        // Small delay to ensure all services are initialized
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        syncWithServer();
    }

    /**
     * Triggered when local changes are detected.
     * Uses small delay to ensure the transaction that created the changes has committed.
     */
    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (!syncConfig.isServerSyncEnabled()) {
            return; // Let peer-to-peer handle it
        }

        if (event.getChanges() == null || event.getChanges().isEmpty()) {
            return;
        }

        log.info("Changes detected ({} changes), scheduling sync with central server", event.getChanges().size());

        // Small delay to ensure the transaction that created the FieldChange records has committed
        // This prevents race condition where we query for changes before they're visible
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        // If sync is in progress, wait for it to finish then retry
        int retries = 0;
        while (syncing && retries < 5) {
            try {
                Thread.sleep(1000);
                retries++;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }

        syncWithServer();
    }

    /**
     * Periodic sync with server (backup in case event-driven sync misses something).
     */
    @Scheduled(fixedDelayString = "${sync.interval.seconds:30}000", initialDelay = 60000)
    public void periodicSync() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }
        syncWithServer();
    }

    /**
     * Main sync method - sends local changes to server, receives changes from server.
     */
    @Transactional
    public SyncResult syncWithServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        if (syncing) {
            log.debug("Sync already in progress, marking pending sync request");
            pendingSyncRequest = true;
            return new SyncResult(false, "Sync in progress", 0, 0, 0);
        }

        syncing = true;
        pendingSyncRequest = false;
        SyncResult result = new SyncResult();

        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/exchange";

            // Get changes that haven't been synced to server yet
            List<FieldChange> outgoingChanges = fieldChangeRepository.findChangesNotSyncedTo("SERVER");
            result.setChangesSent(outgoingChanges.size());

            log.info("Found {} changes to send to server", outgoingChanges.size());
            if (!outgoingChanges.isEmpty()) {
                log.debug("Changes: {}", outgoingChanges.stream()
                    .map(c -> c.getEntityType() + "#" + c.getEntityId() + "." + c.getFieldName())
                    .toList());
            }

            // Prepare request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Machine-Name", syncConfig.getMachineName());

            Map<String, Object> request = new HashMap<>();
            request.put("machineId", syncConfig.getMachineId());
            request.put("machineName", syncConfig.getMachineName());
            request.put("changes", outgoingChanges);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            // Exchange with server
            log.debug("Sending {} changes to server", outgoingChanges.size());
            ResponseEntity<SyncResponse> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<SyncResponse>() {}
            );

            serverAvailable = true;
            SyncResponse serverResponse = response.getBody();

            if (serverResponse != null && serverResponse.isSuccess()) {
                // Mark outgoing changes as synced to server
                for (FieldChange change : outgoingChanges) {
                    change.addSyncedMachine("SERVER");
                }
                if (!outgoingChanges.isEmpty()) {
                    fieldChangeRepository.saveAll(outgoingChanges);
                }

                // Apply incoming changes from server
                List<FieldChange> incomingChanges = serverResponse.getChanges();
                result.setChangesReceived(incomingChanges != null ? incomingChanges.size() : 0);

                if (incomingChanges != null && !incomingChanges.isEmpty()) {
                    int applied = applyIncomingChanges(incomingChanges);
                    result.setChangesApplied(applied);
                }

                result.setSuccess(true);
                log.info("Server sync complete: sent={}, received={}, applied={}",
                    result.getChangesSent(), result.getChangesReceived(), result.getChangesApplied());
            } else {
                result.setSuccess(false);
                result.setErrorMessage(serverResponse != null ? serverResponse.getErrorMessage() : "Unknown error");
                log.error("Server sync failed: {}", result.getErrorMessage());
            }

        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            log.error("Failed to sync with server: {}", e.getMessage());
            // Changes remain in local DB, will be synced when server is available
        } finally {
            syncing = false;

            // If another sync was requested while we were syncing, trigger it now
            if (pendingSyncRequest) {
                log.info("Processing pending sync request");
                pendingSyncRequest = false;
                // Use async to avoid stack overflow with recursive calls
                new Thread(() -> {
                    try {
                        Thread.sleep(200);
                        syncWithServer();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
            }
        }

        return result;
    }

    /**
     * Apply incoming changes from server using LWW.
     */
    private int applyIncomingChanges(List<FieldChange> incomingChanges) {
        syncContext.startSync();
        try {
            return fieldSyncService.applyIncomingChanges(incomingChanges);
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
     */
    public long getPendingChangeCount() {
        return fieldChangeRepository.findChangesNotSyncedTo("SERVER").size();
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

    // DTOs
    @lombok.Data
    public static class SyncResponse {
        private boolean success;
        private int changesReceived;
        private int duplicatesSkipped;
        private int changesSent;
        private List<FieldChange> changes;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncResult {
        private boolean success;
        private String errorMessage;
        private int changesSent;
        private int changesReceived;
        private int changesApplied;
    }
}
