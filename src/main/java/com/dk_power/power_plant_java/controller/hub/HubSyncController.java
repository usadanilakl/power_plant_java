package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.hub.HubEntityComparisonService;
import com.dk_power.power_plant_java.sevice.hub.H2ToPostgresMigrationService;
import com.dk_power.power_plant_java.sevice.hub.HubFieldChangeQueryService;
import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import com.dk_power.power_plant_java.sevice.hub.HubSyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.Instant;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Hub sync REST controller — matches sync-server's SyncController API contract exactly.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/sync")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubSyncController {

    private final HubSyncService hubSyncService;
    private final HubSseService hubSseService;
    private final FieldChangeRepository fieldChangeRepository;
    private final HubSyncConfig hubSyncConfig;
    private final HubEntityComparisonService hubEntityComparisonService;
    private final HubFieldChangeQueryService hubFieldChangeQueryService;

    private static final int MAX_BATCH_SIZE = 10000;

    // -------------------------------------------------------------------
    // Main sync exchange
    // -------------------------------------------------------------------

    @PostMapping("/exchange")
    public ResponseEntity<HubSyncService.SyncResponse> syncExchange(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestHeader("X-Machine-Name") String machineName,
            @RequestHeader(value = "X-Device-Number", required = false) Integer deviceNumber,
            @RequestBody SyncRequest request,
            HttpServletRequest httpRequest) {

        if (H2ToPostgresMigrationService.migrationInProgress.get()) {
            log.warn("Rejecting sync from {} — migration in progress", machineId);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(HubSyncService.SyncResponse.builder()
                .success(false)
                .errorMessage("Hub migration in progress, retry later")
                .build());
        }

        if (request.changes != null && request.changes.size() > MAX_BATCH_SIZE) {
            log.warn("Batch size {} exceeds limit {} from {}", request.changes.size(), MAX_BATCH_SIZE, machineId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(HubSyncService.SyncResponse.builder()
                .success(false)
                .errorMessage("Batch size exceeds maximum of " + MAX_BATCH_SIZE)
                .build());
        }

        String ipAddress = getClientIp(httpRequest);

        try {
            HubSyncService.SyncResponse response = hubSyncService.syncExchange(
                machineId, machineName, ipAddress, deviceNumber, request.changes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Hub sync exchange failed for {}: {}", machineId, e.getMessage(), e);
            return ResponseEntity.ok(HubSyncService.SyncResponse.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .build());
        }
    }

    // -------------------------------------------------------------------
    // Pending changes pull
    // -------------------------------------------------------------------

    @GetMapping("/changes/batch")
    public ResponseEntity<List<FieldChange>> getPendingChangesBatch(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestHeader(value = "X-Machine-Name", required = false) String machineName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {

        int safeSize = Math.min(size, 1000);

        // Slice, not Page: avoids a full-table count query per batch (the client reads no total header).
        Slice<FieldChange> changePage = hubSyncService.getPendingChangesPaginated(
            machineId, PageRequest.of(page, safeSize));

        log.debug("Batch request from {}: page={}, size={}, returned={}, hasMore={}",
            machineId, page, safeSize, changePage.getNumberOfElements(), changePage.hasNext());

        return ResponseEntity.ok()
            .header("X-Has-More", String.valueOf(changePage.hasNext()))
            .header("X-Page", String.valueOf(page))
            .body(changePage.getContent());
    }

    /**
     * Compatibility endpoint with sync-server contract.
     * Returns pending changes for this client without explicit pagination controls.
     */
    @GetMapping("/changes")
    public ResponseEntity<List<FieldChange>> getPendingChanges(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam(defaultValue = "500") int size) {

        int safeSize = Math.min(size, 1000);
        Slice<FieldChange> changePage = hubSyncService.getPendingChangesPaginated(
            machineId, PageRequest.of(0, safeSize));

        return ResponseEntity.ok()
            .header("X-Has-More", String.valueOf(changePage.hasNext()))
            .body(changePage.getContent());
    }

    @GetMapping("/changes/count")
    public ResponseEntity<Map<String, Long>> getPendingChangeCount(
            @RequestHeader("X-Machine-Id") String machineId) {
        return ResponseEntity.ok(Map.of("count", hubSyncService.getPendingChangeCount(machineId)));
    }

    /**
     * Mark a client's own changes as already synced to that client.
     * Prevents the hub from sending a client's own changes back to it.
     * POST /api/sync/changes/clear-self/{machineId}
     */
    @PostMapping("/changes/clear-self/{machineId}")
    public ResponseEntity<Map<String, Object>> clearSelfOriginatedChanges(
            @PathVariable String machineId) {
        int cleared = hubSyncService.clearSelfOriginatedChanges(machineId);
        log.info("Cleared self-originated changes for {}: {} marked as synced", machineId, cleared);
        return ResponseEntity.ok(Map.of("cleared", cleared, "machineId", machineId));
    }

    /**
     * Mark ALL changes as synced to a client (used after full DB resync — client now has everything).
     * POST /api/sync/changes/mark-all-synced
     */
    @PostMapping("/changes/mark-all-synced")
    public ResponseEntity<Map<String, Object>> markAllSynced(
            @RequestHeader("X-Machine-Id") String machineId) {
        int marked = hubSyncService.markAllSyncedToClient(machineId);
        log.info("Marked all changes as synced for {} after full resync: {} changes", machineId, marked);
        return ResponseEntity.ok(Map.of("marked", marked, "machineId", machineId));
    }

    /**
     * BOUNDED + ASYNC mark-synced after a wholesale DB-snapshot restore. Marks synced only changes with
     * timestamp &lt;= the snapshot cutoff (so hub changes committed after the snapshot stay pending and are
     * still delivered by normal pull), and runs the potentially multi-million-row UPDATE on a background
     * virtual thread so the client never blocks/times out — returns 202 immediately. Idempotent + safe: a
     * partial/aborted run just leaves rows pending. The cutoff is the X-Sync-Cutoff header the client got
     * with the h2-backup it installed.
     * POST /api/sync/changes/mark-synced-upto?cutoff=&lt;ISO-8601 instant&gt;
     */
    @PostMapping("/changes/mark-synced-upto")
    public ResponseEntity<Map<String, Object>> markSyncedUpTo(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam("cutoff") String cutoff) {
        final Instant cutoffInstant;
        try {
            cutoffInstant = Instant.parse(cutoff);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "cutoff must be an ISO-8601 instant (e.g. 2026-08-13T10:00:00Z)", "cutoff", cutoff));
        }
        // Off-request-thread so a multi-million-row backlog can't time out the client. The transactional
        // work runs in HubSyncService (proxied bean call from the thread → its own tx).
        Thread.ofVirtual().name("mark-synced-upto-" + machineId).start(() -> {
            try {
                int marked = hubSyncService.markSyncedToClientUpTo(machineId, cutoffInstant);
                log.info("Bounded mark-synced complete for {} up to {}: {} changes", machineId, cutoffInstant, marked);
            } catch (Exception e) {
                log.error("Bounded mark-synced failed for {} up to {}: {}", machineId, cutoffInstant, e.getMessage(), e);
            }
        });
        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted", "machineId", machineId, "cutoff", cutoffInstant.toString()));
    }

    /**
     * Reset sync status for a client — marks all changes as pending for re-sync.
     * Use when a client fetched changes but failed to apply them.
     */
    @PostMapping("/changes/reset/{targetMachineId}")
    public ResponseEntity<Map<String, Object>> resetSyncForClient(
            @PathVariable String targetMachineId) {
        int reset = hubSyncService.resetSyncStatusForClient(targetMachineId);
        log.info("Reset sync status for {}: {} changes marked as pending", targetMachineId, reset);
        return ResponseEntity.ok(Map.of("reset", reset, "machineId", targetMachineId));
    }

    @PostMapping("/changes/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeChanges(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestBody List<UUID> changeIds) {
        int acknowledged = hubSyncService.acknowledgeChanges(machineId, changeIds);
        return ResponseEntity.ok(Map.of("acknowledged", acknowledged));
    }

    // -------------------------------------------------------------------
    // Client management
    // -------------------------------------------------------------------

    @PostMapping("/register")
    public ResponseEntity<HubClientInfo> register(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestHeader("X-Machine-Name") String machineName,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        HubClientInfo client = hubSyncService.registerClient(machineId, machineName, ipAddress);
        return ResponseEntity.ok(client);
    }

    @GetMapping("/clients")
    public ResponseEntity<List<HubClientInfo>> getAllClients() {
        return ResponseEntity.ok(hubSyncService.getAllClients());
    }

    @GetMapping("/clients/active")
    public ResponseEntity<List<HubClientInfo>> getActiveClients() {
        return ResponseEntity.ok(hubSyncService.getActiveClients());
    }

    // -------------------------------------------------------------------
    // Device registry
    // -------------------------------------------------------------------

    @GetMapping("/device-registry")
    public ResponseEntity<Map<String, Object>> getDeviceRegistry() {
        List<HubClientInfo> allClients = hubSyncService.getAllClients();

        List<Map<String, Object>> devices = allClients.stream()
            .filter(c -> c.getDeviceNumber() != null)
            .map(c -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("deviceNumber", c.getDeviceNumber());
                entry.put("deviceName", c.getMachineName());
                entry.put("machineId", c.getMachineId());
                entry.put("lastSeen", c.getLastSeen() != null ? c.getLastSeen().toString() : null);
                entry.put("status", c.getStatus().name());
                return entry;
            })
            .collect(Collectors.toList());

        Set<Integer> takenNumbers = allClients.stream()
            .map(HubClientInfo::getDeviceNumber)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<Integer> availableNumbers = new ArrayList<>();
        for (int i = 0; i <= 99; i++) {
            if (!takenNumbers.contains(i)) {
                availableNumbers.add(i);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("devices", devices);
        response.put("takenNumbers", new ArrayList<>(takenNumbers));
        response.put("availableNumbers", availableNumbers);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/device-registry")
    public ResponseEntity<?> registerDevice(
            @RequestBody Map<String, Object> body,
            HttpServletRequest httpRequest) {

        String deviceName = (String) body.get("deviceName");
        Integer requestedNumber = body.get("deviceNumber") != null
            ? ((Number) body.get("deviceNumber")).intValue() : null;

        if (deviceName == null || deviceName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "deviceName is required"));
        }

        if (requestedNumber != null && (requestedNumber < 0 || requestedNumber > 99)) {
            return ResponseEntity.badRequest().body(Map.of("error", "deviceNumber must be between 0 and 99"));
        }

        List<HubClientInfo> allClients = hubSyncService.getAllClients();
        Set<Integer> taken = allClients.stream()
            .map(HubClientInfo::getDeviceNumber)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        if (requestedNumber != null && taken.contains(requestedNumber)) {
            String takenBy = allClients.stream()
                .filter(c -> requestedNumber.equals(c.getDeviceNumber()))
                .map(HubClientInfo::getMachineName)
                .findFirst().orElse("unknown");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "Device number " + requestedNumber + " is already taken by " + takenBy
            ));
        }

        int deviceNumber;
        if (requestedNumber != null) {
            deviceNumber = requestedNumber;
        } else {
            int assigned = -1;
            for (int i = 0; i <= 99; i++) {
                if (!taken.contains(i)) {
                    assigned = i;
                    break;
                }
            }
            if (assigned == -1) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "All device numbers (0-99) are taken"
                ));
            }
            deviceNumber = assigned;
        }

        String machineId = deviceName.toUpperCase()
            .replaceAll("\\s+", "-")
            .replaceAll("[^A-Z0-9\\-]", "");
        if (machineId.isEmpty()) machineId = "DEVICE-" + deviceNumber;

        String ipAddress = getClientIp(httpRequest);
        hubSyncService.registerClient(machineId, deviceName, ipAddress, deviceNumber);

        log.info("Device registered: #{} '{}' machineId={}", deviceNumber, deviceName, machineId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deviceNumber", deviceNumber);
        result.put("deviceName", deviceName);
        result.put("machineId", machineId);

        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------
    // Status and health
    // -------------------------------------------------------------------

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "online",
            "totalChanges", fieldChangeRepository.count(),
            "totalClients", (long) hubSyncService.getAllClients().size(),
            "activeClients", hubSyncService.getActiveClients().size(),
            "sseConnections", hubSseService.getConnectionCount(),
            "sseMachinesConnected", hubSseService.getUniqueMachineCount(),
            "realtimeEnabled", true
        ));
    }

    /**
     * Compatibility endpoint with sync-server metrics contract.
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        List<HubClientInfo> clients = hubSyncService.getAllClients();
        long totalPushed = clients.stream().mapToLong(HubClientInfo::getTotalChangesPushed).sum();
        long totalPulled = clients.stream().mapToLong(HubClientInfo::getTotalChangesPulled).sum();

        return ResponseEntity.ok(Map.of(
            "totalChangesInDb", fieldChangeRepository.count(),
            "totalClients", clients.size(),
            "activeClients", hubSyncService.getActiveClients().size(),
            "sseConnections", hubSseService.getConnectionCount(),
            "totalChangesPushedByClients", totalPushed,
            "totalChangesPulledByClients", totalPulled
        ));
    }

    /**
     * Per-client metrics view.
     */
    @GetMapping("/metrics/{machineId}")
    public ResponseEntity<Map<String, Object>> getMetricsByMachine(@PathVariable String machineId) {
        Optional<HubClientInfo> clientOpt = hubSyncService.getAllClients().stream()
            .filter(c -> machineId.equals(c.getMachineId()))
            .findFirst();

        if (clientOpt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("error", "Client not found");
            body.put("machineId", machineId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }

        HubClientInfo c = clientOpt.get();
        Map<String, Object> body = new HashMap<>();
        body.put("machineId", c.getMachineId());
        body.put("machineName", c.getMachineName());
        body.put("status", c.getStatus().name());
        body.put("lastSeen", c.getLastSeen() != null ? c.getLastSeen().toString() : null);
        body.put("lastSyncTime", c.getLastSyncTime() != null ? c.getLastSyncTime().toString() : null);
        body.put("totalChangesPushed", c.getTotalChangesPushed());
        body.put("totalChangesPulled", c.getTotalChangesPulled());
        body.put("pendingChanges", hubSyncService.getPendingChangeCount(machineId));

        return ResponseEntity.ok(body);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");

        try {
            File storageDir = new File(hubSyncConfig.getFilesRootPath());
            boolean storageExists = storageDir.exists();
            boolean storageWritable = storageDir.canWrite();
            long freeSpaceBytes = storageDir.getFreeSpace();

            health.put("fileStorage", Map.of(
                "available", storageExists && storageWritable,
                "path", storageDir.getAbsolutePath(),
                "exists", storageExists,
                "writable", storageWritable,
                "freeSpaceMB", freeSpaceBytes / (1024 * 1024)
            ));

            if (!storageExists || !storageWritable) {
                health.put("status", "degraded");
                health.put("warning", "File storage is not available or not writable");
            }

            if (freeSpaceBytes < 1024L * 1024 * 1024) {
                health.put("status", "degraded");
                health.put("warning", "Low disk space: " + (freeSpaceBytes / (1024 * 1024)) + " MB remaining");
            }
        } catch (Exception e) {
            log.error("Error checking file storage health: {}", e.getMessage());
            health.put("fileStorage", Map.of("available", false, "error", e.getMessage()));
            health.put("status", "degraded");
        }

        health.put("sseConnections", hubSseService.getConnectionCount());
        health.put("activeClients", hubSyncService.getActiveClients().size());

        return ResponseEntity.ok(health);
    }

    // -------------------------------------------------------------------
    // Failed sync items (stubs — hub applies changes directly, no separate failure table)
    // -------------------------------------------------------------------

    @GetMapping("/failed/count")
    public ResponseEntity<Map<String, Long>> getFailedCount() {
        return ResponseEntity.ok(Map.of("count", 0L));
    }

    @GetMapping("/failed")
    public ResponseEntity<List<?>> getFailedItems() {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/failed/{id}/retry")
    public ResponseEntity<Map<String, Object>> retryFailed(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true, "message", "No failed items in hub mode"));
    }

    @DeleteMapping("/failed/{id}")
    public ResponseEntity<Void> dismissFailed(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/failed/retry-all")
    public ResponseEntity<Map<String, Object>> retryAllFailed() {
        return ResponseEntity.ok(Map.of("success", true, "retried", 0));
    }

    // -------------------------------------------------------------------
    // Entity comparison (for desktop mismatch detection)
    // -------------------------------------------------------------------

    @GetMapping("/entity-ids/{entityType}")
    public ResponseEntity<?> getEntityIds(@PathVariable String entityType) {
        try {
            Set<Long> ids = hubEntityComparisonService.getEntityIds(entityType);
            return ResponseEntity.ok(ids);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<?> getEntityData(@PathVariable String entityType, @PathVariable Long entityId) {
        try {
            Map<String, String> data = hubEntityComparisonService.getEntityData(entityType, entityId);
            if (data == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Entity not found: " + entityType + "#" + entityId));
            }
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Batch human labels (id -&gt; "01-VCND100 · …") for the drift UI. One call for a whole list of ids —
     * the desktop previously fetched full entity data once per id, which was N sequential round-trips for
     * a single "missing from local" strip. Ids the hub doesn't have are omitted, not errors.
     */
    @PostMapping("/entity-labels/{entityType}")
    public ResponseEntity<?> getEntityLabels(
            @PathVariable String entityType,
            @RequestBody List<Long> entityIds) {
        try {
            return ResponseEntity.ok(hubEntityComparisonService.getEntityLabels(entityType, entityIds));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/entity-timestamps/{entityType}")
    public ResponseEntity<?> getEntityTimestamps(
            @PathVariable String entityType,
            @RequestBody List<Long> entityIds) {
        try {
            Map<Long, java.time.Instant> timestamps = hubEntityComparisonService.getEntityTimestamps(entityType, entityIds);
            return ResponseEntity.ok(timestamps);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Cheap per-type content-drift probe: {count, typeDigest}. (Inc 0b harness) */
    @GetMapping("/entity-content-hash-summary/{entityType}")
    public ResponseEntity<?> getContentHashSummary(@PathVariable String entityType) {
        try {
            return ResponseEntity.ok(hubEntityComparisonService.getContentHashSummary(entityType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Full id->rowHash map for a type, for drilling into which rows differ. (Inc 0b harness) */
    @GetMapping("/entity-content-hashes/{entityType}")
    public ResponseEntity<?> getContentHashes(@PathVariable String entityType) {
        try {
            return ResponseEntity.ok(hubEntityComparisonService.getContentHashes(entityType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------
    // Changes by entity type (for per-type resync)
    // -------------------------------------------------------------------

    @GetMapping("/changes/by-type/{entityType}")
    public ResponseEntity<List<FieldChange>> getChangesByEntityType(
            @PathVariable String entityType,
            @RequestParam String since) {
        try {
            java.time.Instant sinceInstant = java.time.Instant.parse(since);
            List<FieldChange> changes = hubFieldChangeQueryService.findChangesByEntityTypeSince(entityType, sinceInstant);
            return ResponseEntity.ok(changes);
        } catch (Exception e) {
            log.error("Failed to fetch changes by type {}: {}", entityType, e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    // -------------------------------------------------------------------
    // Helpers / DTOs
    // -------------------------------------------------------------------

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    @lombok.Data
    public static class SyncRequest {
        private String machineId;
        private String machineName;
        private List<FieldChange> changes;
    }
}
