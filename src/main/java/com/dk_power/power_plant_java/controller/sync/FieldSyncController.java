package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.PeerRepository;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.PeerDiscoveryService;
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
    private final PeerDiscoveryService peerDiscoveryService;
    private final FieldChangeRepository fieldChangeRepository;
    private final PeerRepository peerRepository;
    private final SyncConfig syncConfig;

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
        fc.setOldValue((String) map.get("oldValue"));
        fc.setNewValue((String) map.get("newValue"));
        fc.setOriginMachineId((String) map.get("originMachineId"));
        fc.setOriginMachineName((String) map.get("originMachineName"));
        fc.setSyncedToMachines((String) map.get("syncedToMachines"));
        fc.setRelationshipType((String) map.get("relationshipType"));

        String timestamp = (String) map.get("timestamp");
        if (timestamp != null) {
            fc.setTimestamp(Instant.parse(timestamp));
        }

        String changeType = (String) map.get("changeType");
        if (changeType != null) {
            fc.setChangeType(FieldChange.ChangeType.valueOf(changeType));
        }

        return fc;
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

        List<Peer> peers = peerDiscoveryService.getActivePeers();
        status.put("activePeers", peers);
        status.put("peerCount", peers.size());

        long totalChanges = fieldSyncService.getTotalChangeCount();
        status.put("totalChangesTracked", totalChanges);

        return ResponseEntity.ok(status);
    }

    /**
     * Manually trigger sync with all peers
     * POST /api/field-sync/trigger
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        Map<String, Object> result = new HashMap<>();

        try {
            fieldSyncService.syncWithAllPeers();
            result.put("success", true);
            result.put("message", "Sync triggered successfully");
            result.put("activePeers", peerDiscoveryService.getActivePeers().size());
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
