package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.PeerRepository;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler;
import com.dk_power.power_plant_java.sevice.sync.FullSyncToServerService;
import com.dk_power.power_plant_java.sevice.sync.PeerDiscoveryService;
import com.dk_power.power_plant_java.sevice.sync.ServerSseClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/field-sync")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FieldSyncController {

    private final FieldSyncService fieldSyncService;
    private final CentralSyncService centralSyncService;
    private final PeerDiscoveryService peerDiscoveryService;
    private final FieldChangeRepository fieldChangeRepository;
    private final PeerRepository peerRepository;
    private final SyncConfig syncConfig;
    private final FileObjectSyncHandler fileObjectSyncHandler;
    private final FullSyncToServerService fullSyncToServerService;
    private final ServerSseClient serverSseClient;

    /**
     * Exchange changes with a peer
     * POST /api/field-sync/exchange
     *
     * This is the main sync endpoint called by peers
     */
    @PostMapping("/exchange")
    public ResponseEntity<List<FieldChange>> exchangeChanges(
            @RequestHeader(value = "X-Machine-Id", required = false) String fromMachineId,
            @RequestHeader(value = "X-Machine-Name", required = false) String fromMachineName,
            @RequestBody Map<String, Object> request) {

        // Extract from body if not in headers
        if (fromMachineId == null) {
            fromMachineId = (String) request.get("machineId");
        }
        if (fromMachineName == null) {
            fromMachineName = (String) request.get("machineName");
        }

        log.info("Received sync exchange request from {} ({})", fromMachineName, fromMachineId);

        @SuppressWarnings("unchecked")
        List<FieldChange> incomingChanges = parseIncomingChanges(request.get("changes"));

        List<FieldChange> ourChanges = fieldSyncService.receiveChangesAndRespond(
            fromMachineId, fromMachineName, incomingChanges);

        log.info("Responding with {} changes to {} ({})", ourChanges.size(), fromMachineName, fromMachineId);

        return ResponseEntity.ok(ourChanges);
    }

    @SuppressWarnings("unchecked")
    private List<FieldChange> parseIncomingChanges(Object changesObj) {
        if (changesObj == null) return List.of();

        if (changesObj instanceof List) {
            List<?> list = (List<?>) changesObj;
            if (list.isEmpty()) return List.of();

            // If already FieldChange objects, return as-is
            if (list.get(0) instanceof FieldChange) {
                return (List<FieldChange>) list;
            }

            // If maps, convert to FieldChange objects
            if (list.get(0) instanceof Map) {
                return list.stream()
                    .map(item -> convertMapToFieldChange((Map<String, Object>) item))
                    .toList();
            }
        }

        return List.of();
    }

    private FieldChange convertMapToFieldChange(Map<String, Object> map) {
        FieldChange fc = new FieldChange();
        fc.setEntityType((String) map.get("entityType"));
        fc.setEntityId(((Number) map.get("entityId")).longValue());
        fc.setFieldName((String) map.get("fieldName"));
        fc.setOldValue(getStringValue(map.get("oldValue")));
        fc.setNewValue(getStringValue(map.get("newValue")));
        fc.setOriginMachineId((String) map.get("originMachineId"));
        fc.setOriginMachineName((String) map.get("originMachineName"));
        fc.setSyncedToMachines((String) map.get("syncedToMachines"));
        fc.setRelationshipType((String) map.get("relationshipType"));

        // Handle timestamp - can be String (ISO format) or Number (epoch seconds)
        Object timestampObj = map.get("timestamp");
        if (timestampObj != null) {
            if (timestampObj instanceof String) {
                fc.setTimestamp(Instant.parse((String) timestampObj));
            } else if (timestampObj instanceof Number) {
                // Timestamp as epoch seconds (possibly with decimal for nanos)
                double epochSeconds = ((Number) timestampObj).doubleValue();
                long seconds = (long) epochSeconds;
                long nanos = (long) ((epochSeconds - seconds) * 1_000_000_000);
                fc.setTimestamp(Instant.ofEpochSecond(seconds, nanos));
            }
        }

        String changeType = (String) map.get("changeType");
        if (changeType != null) {
            fc.setChangeType(FieldChange.ChangeType.valueOf(changeType));
        }

        return fc;
    }

    private String getStringValue(Object value) {
        if (value == null) return null;
        if (value instanceof String) return (String) value;
        return String.valueOf(value);
    }

    /**
     * Get changes since a timestamp
     * GET /api/field-sync/changes?since=2024-01-01T00:00:00Z
     */
    @GetMapping("/changes")
    public ResponseEntity<List<FieldChange>> getChanges(
            @RequestParam(required = false) Instant since,
            @RequestHeader(value = "X-Machine-Id", required = false) String excludeMachineId) {

        List<FieldChange> changes;
        if (since != null) {
            changes = fieldChangeRepository.findChangesSince(
                since, excludeMachineId != null ? excludeMachineId : "");
        } else {
            changes = fieldChangeRepository.findAll();
        }

        return ResponseEntity.ok(changes);
    }

    /**
     * Get sync status and peer information
     * GET /api/field-sync/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();

        status.put("machineId", syncConfig.getMachineId());
        status.put("machineName", syncConfig.getMachineName());
        status.put("localIp", peerDiscoveryService.getLocalIpAddress());
        status.put("syncPort", syncConfig.getSyncPort());
        status.put("discoveryPort", syncConfig.getDiscoveryPort());
        status.put("discoveryEnabled", syncConfig.isDiscoveryEnabled());
        status.put("syncIntervalSeconds", syncConfig.getSyncIntervalSeconds());

        // Server sync status
        status.put("serverSyncEnabled", syncConfig.isServerSyncEnabled());
        status.put("syncRuntimeEnabled", syncConfig.isSyncRuntimeEnabled());
        status.put("serverSyncConfigured", syncConfig.isServerSyncConfigured());
        status.put("syncServerUrl", syncConfig.getSyncServerUrl());
        if (syncConfig.isServerSyncEnabled()) {
            status.put("serverAvailable", centralSyncService.isServerAvailable());
            status.put("sseConnected", centralSyncService.isSseConnected());
            status.put("pendingServerChanges", centralSyncService.getPendingChangeCount());
            status.put("syncMode", "SERVER");
            status.put("realtimeEnabled", centralSyncService.isSseConnected());
        } else {
            status.put("syncMode", "PEER_TO_PEER");
            status.put("realtimeEnabled", false);
        }

        List<Peer> peers = peerDiscoveryService.getActivePeers();
        status.put("activePeers", peers);
        status.put("peerCount", peers.size());

        long totalChanges = fieldSyncService.getTotalChangeCount();
        status.put("totalChangesTracked", totalChanges);

        return ResponseEntity.ok(status);
    }

    /**
     * Manually trigger sync (with server or peers depending on mode)
     * POST /api/field-sync/trigger
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        Map<String, Object> result = new HashMap<>();

        try {
            if (syncConfig.isServerSyncEnabled()) {
                // Server sync mode
                CentralSyncService.SyncResult syncResult = centralSyncService.syncWithServer();
                result.put("success", syncResult.isSuccess());
                result.put("message", syncResult.isSuccess() ? "Server sync triggered successfully" : syncResult.getErrorMessage());
                result.put("changesSent", syncResult.getChangesSent());
                result.put("changesReceived", syncResult.getChangesReceived());
                result.put("changesApplied", syncResult.getChangesApplied());
                result.put("syncMode", "SERVER");
            } else {
                // Peer-to-peer mode
                fieldSyncService.syncWithAllPeers();
                result.put("success", true);
                result.put("message", "Peer sync triggered successfully");
                result.put("activePeers", peerDiscoveryService.getActivePeers().size());
                result.put("syncMode", "PEER_TO_PEER");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Sync failed: " + e.getMessage());
            log.error("Manual sync trigger failed", e);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get list of discovered peers
     * GET /api/field-sync/peers
     */
    @GetMapping("/peers")
    public ResponseEntity<List<Peer>> getPeers() {
        return ResponseEntity.ok(peerDiscoveryService.getActivePeers());
    }

    /**
     * Get all known peers (including offline)
     * GET /api/field-sync/peers/all
     */
    @GetMapping("/peers/all")
    public ResponseEntity<List<Peer>> getAllPeers() {
        return ResponseEntity.ok(peerDiscoveryService.getAllPeers());
    }

    /**
     * Get changes for a specific entity
     * GET /api/field-sync/changes/{entityType}/{entityId}
     */
    @GetMapping("/changes/{entityType}/{entityId}")
    public ResponseEntity<List<FieldChange>> getEntityChanges(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        List<FieldChange> changes = fieldChangeRepository
            .findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);

        return ResponseEntity.ok(changes);
    }

    /**
     * Get changes by origin machine
     * GET /api/field-sync/changes/machine/{machineId}
     */
    @GetMapping("/changes/machine/{machineId}")
    public ResponseEntity<List<FieldChange>> getChangesByMachine(
            @PathVariable String machineId) {

        List<FieldChange> changes = fieldChangeRepository
            .findByOriginMachineIdOrderByTimestampDesc(machineId);

        return ResponseEntity.ok(changes);
    }

    /**
     * Health check endpoint
     * GET /api/field-sync/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("machineId", syncConfig.getMachineId());
        health.put("machineName", syncConfig.getMachineName());
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }

    /**
     * Broadcast presence manually (for testing)
     * POST /api/field-sync/broadcast
     */
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> broadcast() {
        Map<String, Object> result = new HashMap<>();
        try {
            peerDiscoveryService.broadcastPresence();
            result.put("success", true);
            result.put("message", "Presence broadcasted");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Get detailed sync metrics for monitoring.
     * GET /api/field-sync/metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Central sync metrics
        if (syncConfig.isServerSyncEnabled()) {
            CentralSyncService.SyncMetrics syncMetrics = centralSyncService.getMetrics();
            metrics.put("syncMetrics", Map.of(
                "totalChangesSent", syncMetrics.getTotalChangesSent(),
                "totalChangesReceived", syncMetrics.getTotalChangesReceived(),
                "consecutiveFailures", syncMetrics.getConsecutiveFailures(),
                "syncInProgress", syncMetrics.isSyncInProgress(),
                "serverAvailable", syncMetrics.isServerAvailable(),
                "sseConnected", syncMetrics.isSseConnected(),
                "pendingChanges", syncMetrics.getPendingChanges()
            ));
        }

        // Database stats
        metrics.put("totalChangesInDb", fieldChangeRepository.count());
        metrics.put("pendingToServer", fieldChangeRepository.countPendingChangesFor("SERVER"));

        return ResponseEntity.ok(metrics);
    }

    /**
     * Generate test data for sync testing.
     * POST /api/field-sync/test/generate?count=1000
     */
    @PostMapping("/test/generate")
    public ResponseEntity<Map<String, Object>> generateTestData(
            @RequestParam(defaultValue = "100") int count) {
        Map<String, Object> result = new HashMap<>();

        try {
            long startTime = System.currentTimeMillis();

            for (int i = 0; i < count; i++) {
                FieldChange change = new FieldChange();
                change.setEntityType("TestEntity");
                change.setEntityId((long) (i % 100)); // 100 different entities
                change.setFieldName("testField" + (i % 10)); // 10 different fields
                change.setOldValue("\"oldValue" + i + "\"");
                change.setNewValue("\"newValue" + i + "\"");
                change.setTimestamp(Instant.now().minusSeconds(count - i)); // Spread over time
                change.setOriginMachineId(syncConfig.getMachineId());
                change.setOriginMachineName(syncConfig.getMachineName());
                change.setChangeType(FieldChange.ChangeType.UPDATE);
                change.setSyncedToMachines(""); // Not synced to anyone yet
                fieldChangeRepository.save(change);
            }

            long duration = System.currentTimeMillis() - startTime;

            result.put("success", true);
            result.put("message", "Generated " + count + " test changes");
            result.put("count", count);
            result.put("durationMs", duration);
            result.put("pendingToServer", fieldChangeRepository.countPendingChangesFor("SERVER"));

            log.info("Generated {} test changes in {}ms", count, duration);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed: " + e.getMessage());
            log.error("Failed to generate test data", e);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Clear test data.
     * DELETE /api/field-sync/test/clear
     */
    @DeleteMapping("/test/clear")
    public ResponseEntity<Map<String, Object>> clearTestData() {
        Map<String, Object> result = new HashMap<>();

        try {
            long countBefore = fieldChangeRepository.count();

            // Delete all TestEntity changes
            List<FieldChange> testChanges = fieldChangeRepository.findAll().stream()
                .filter(c -> "TestEntity".equals(c.getEntityType()))
                .toList();

            fieldChangeRepository.deleteAll(testChanges);

            result.put("success", true);
            result.put("deleted", testChanges.size());
            result.put("remaining", fieldChangeRepository.count());

            log.info("Cleared {} test changes", testChanges.size());

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get sync toggle state.
     * GET /api/field-sync/sync-toggle
     */
    @GetMapping("/sync-toggle")
    public ResponseEntity<Map<String, Object>> getSyncToggle() {
        Map<String, Object> result = new HashMap<>();
        result.put("enabled", syncConfig.isSyncRuntimeEnabled());
        result.put("configured", syncConfig.isServerSyncConfigured());
        result.put("effectivelyEnabled", syncConfig.isServerSyncEnabled());
        return ResponseEntity.ok(result);
    }

    /**
     * Toggle sync on or off at runtime.
     * POST /api/field-sync/sync-toggle
     * Body: { "enabled": true/false }
     */
    @PostMapping("/sync-toggle")
    public ResponseEntity<Map<String, Object>> setSyncToggle(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();
        Boolean enabled = (Boolean) request.get("enabled");

        if (enabled == null) {
            result.put("success", false);
            result.put("message", "'enabled' field is required");
            return ResponseEntity.badRequest().body(result);
        }

        if (!syncConfig.isServerSyncConfigured()) {
            result.put("success", false);
            result.put("message", "Server sync is not configured (sync.server.enabled=false or no URL)");
            return ResponseEntity.badRequest().body(result);
        }

        boolean wasEnabled = syncConfig.isServerSyncEnabled();
        syncConfig.setSyncRuntimeEnabled(enabled);
        boolean isNowEnabled = syncConfig.isServerSyncEnabled();

        log.info("Sync toggle changed: {} -> {} (runtime={})", wasEnabled, isNowEnabled, enabled);

        // Handle SSE connection based on toggle state
        if (!wasEnabled && isNowEnabled) {
            // Turning ON: reconnect SSE and trigger sync
            serverSseClient.startSseConnection();
            log.info("Sync enabled - SSE connection started");
        } else if (wasEnabled && !isNowEnabled) {
            // Turning OFF: disconnect SSE
            serverSseClient.stop();
            log.info("Sync disabled - SSE connection stopped");
        }

        result.put("success", true);
        result.put("enabled", enabled);
        result.put("effectivelyEnabled", isNowEnabled);
        result.put("message", isNowEnabled ? "Sync enabled" : "Sync disabled");
        return ResponseEntity.ok(result);
    }

    /**
     * Reset circuit breaker (manual intervention).
     * POST /api/field-sync/reset-circuit-breaker
     */
    @PostMapping("/reset-circuit-breaker")
    public ResponseEntity<Map<String, Object>> resetCircuitBreaker() {
        Map<String, Object> result = new HashMap<>();
        centralSyncService.resetCircuitBreaker();
        result.put("success", true);
        result.put("message", "Circuit breaker reset");
        return ResponseEntity.ok(result);
    }

    /**
     * Get file sync status and queue information.
     * GET /api/field-sync/file-sync/status
     */
    @GetMapping("/file-sync/status")
    public ResponseEntity<Map<String, Object>> getFileSyncStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", syncConfig.isServerSyncEnabled());
        status.put("syncServerUrl", syncConfig.getSyncServerUrl());
        status.put("queues", fileObjectSyncHandler.getQueueStats());
        return ResponseEntity.ok(status);
    }

    // ==================== FULL SYNC TO SERVER ====================

    /**
     * Start a full sync of all entities to the server.
     * This is a one-time operation to populate the server with all existing data.
     *
     * POST /api/field-sync/full-sync/start
     */
    @PostMapping("/full-sync/start")
    public ResponseEntity<Map<String, Object>> startFullSync() {
        Map<String, Object> result = new HashMap<>();

        if (!syncConfig.isServerSyncEnabled()) {
            result.put("success", false);
            result.put("message", "Server sync is not enabled");
            return ResponseEntity.badRequest().body(result);
        }

        if (fullSyncToServerService.isInProgress()) {
            result.put("success", false);
            result.put("message", "Full sync is already in progress");
            result.put("status", fullSyncToServerService.getStatus());
            return ResponseEntity.ok(result);
        }

        try {
            fullSyncToServerService.startFullSync();
            result.put("success", true);
            result.put("message", "Full sync started. Use /full-sync/status to monitor progress.");
            result.put("status", fullSyncToServerService.getStatus());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to start full sync: " + e.getMessage());
            log.error("Failed to start full sync", e);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get the status of the current or last full sync operation.
     *
     * GET /api/field-sync/full-sync/status
     */
    @GetMapping("/full-sync/status")
    public ResponseEntity<Map<String, Object>> getFullSyncStatus() {
        Map<String, Object> result = new HashMap<>();

        FullSyncToServerService.FullSyncStatus status = fullSyncToServerService.getStatus();
        result.put("inProgress", fullSyncToServerService.isInProgress());
        result.put("status", status);

        return ResponseEntity.ok(result);
    }

    // ==================== BULK EXPORT (FAST FULL SYNC) ====================

    /**
     * Get export statistics before starting bulk export.
     * Shows entity counts and file stats to estimate export size.
     *
     * GET /api/field-sync/full-sync/bulk/stats
     */
    @GetMapping("/full-sync/bulk/stats")
    public ResponseEntity<Map<String, Object>> getBulkExportStats() {
        Map<String, Object> result = new HashMap<>();

        try {
            FullSyncToServerService.BulkExportStats stats = fullSyncToServerService.getBulkExportStats();
            result.put("success", true);
            result.put("totalEntities", stats.totalEntities());
            result.put("totalJoinRecords", stats.totalJoinRecords());
            result.put("fileCount", stats.fileCount());
            result.put("totalFileSize", stats.totalFileSize());
            result.put("totalFileSizeMB", String.format("%.2f", stats.totalFileSize() / (1024.0 * 1024.0)));
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to get stats: " + e.getMessage());
            log.error("Failed to get bulk export stats", e);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Start a fast bulk export sync to the server.
     * This creates an H2 database export + files ZIP and uploads both.
     * Much faster than the FieldChange approach (2-5 minutes vs 30-60 minutes).
     *
     * POST /api/field-sync/full-sync/bulk/start
     *
     * @param force If true, overwrite existing data on server
     */
    @PostMapping("/full-sync/bulk/start")
    public ResponseEntity<Map<String, Object>> startBulkExportSync(
            @RequestParam(defaultValue = "false") boolean force) {
        Map<String, Object> result = new HashMap<>();

        if (!syncConfig.isServerSyncEnabled()) {
            result.put("success", false);
            result.put("message", "Server sync is not enabled");
            return ResponseEntity.badRequest().body(result);
        }

        if (fullSyncToServerService.isInProgress()) {
            result.put("success", false);
            result.put("message", "Full sync is already in progress");
            result.put("status", fullSyncToServerService.getStatus());
            return ResponseEntity.ok(result);
        }

        try {
            fullSyncToServerService.startFullSyncViaBulkExport(force);
            result.put("success", true);
            result.put("message", "Bulk export sync started (force=" + force + "). Use /full-sync/status to monitor progress.");
            result.put("method", "BULK_EXPORT");
            result.put("status", fullSyncToServerService.getStatus());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to start bulk export sync: " + e.getMessage());
            log.error("Failed to start bulk export sync", e);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Manually register a peer (bypasses UDP discovery)
     * POST /api/field-sync/peers/register
     * Body: { "ip": "192.168.1.100", "port": 8082, "name": "OtherMachine" }
     */
    @PostMapping("/peers/register")
    public ResponseEntity<Map<String, Object>> registerPeer(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();

        String ip = (String) request.get("ip");
        Integer port = request.get("port") != null ? ((Number) request.get("port")).intValue() : 8082;
        String name = (String) request.get("name");

        if (ip == null || ip.isEmpty()) {
            result.put("success", false);
            result.put("message", "IP address is required");
            return ResponseEntity.badRequest().body(result);
        }

        try {
            // Try to fetch the peer's status to get their machine ID
            String statusUrl = "http://" + ip + ":" + port + "/api/field-sync/status";
            log.info("Attempting to register peer at {}", statusUrl);

            @SuppressWarnings("unchecked")
            Map<String, Object> peerStatus = new org.springframework.web.client.RestTemplate()
                .getForObject(statusUrl, Map.class);

            if (peerStatus == null) {
                result.put("success", false);
                result.put("message", "Could not connect to peer at " + ip + ":" + port);
                return ResponseEntity.ok(result);
            }

            String machineId = (String) peerStatus.get("machineId");
            String machineName = name != null ? name : (String) peerStatus.get("machineName");

            // Check if peer has same machine ID as us (invalid configuration)
            if (machineId.equals(syncConfig.getMachineId())) {
                result.put("success", false);
                result.put("message", "ERROR: Peer has the SAME machine ID as this machine (" + machineId + "). " +
                    "Delete 'machine-id.properties' file on one of the machines and restart to generate a unique ID.");
                result.put("peer", Map.of(
                    "machineId", machineId,
                    "machineName", machineName,
                    "ip", ip,
                    "port", port
                ));
                log.error("Cannot register peer - same machine ID: {} ({})", machineName, machineId);
                return ResponseEntity.ok(result);
            }

            // Register the peer
            Peer peer = peerDiscoveryService.getAllPeers().stream()
                .filter(p -> p.getMachineId().equals(machineId))
                .findFirst()
                .orElse(new Peer(machineId, machineName, ip, port));

            peer.setIpAddress(ip);
            peer.setPort(port);
            peer.setMachineName(machineName);
            peer.setLastSeen(Instant.now());
            peer.setStatus(Peer.PeerStatus.ONLINE);

            // Save via repository directly
            peerRepository.save(peer);

            result.put("success", true);
            result.put("message", "Peer registered successfully");
            result.put("peer", Map.of(
                "machineId", machineId,
                "machineName", machineName,
                "ip", ip,
                "port", port
            ));

            log.info("Manually registered peer: {} ({}) at {}:{}", machineName, machineId, ip, port);

        } catch (Exception e) {
            log.error("Failed to register peer at {}:{} - {}", ip, port, e.getMessage());
            result.put("success", false);
            result.put("message", "Failed to connect to peer: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }
}
