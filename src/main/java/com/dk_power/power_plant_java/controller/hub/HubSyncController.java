package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import com.dk_power.power_plant_java.sevice.hub.HubSyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;
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

    private static final int MAX_BATCH_SIZE = 1000;

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

        Page<FieldChange> changePage = hubSyncService.getPendingChangesPaginated(
            machineId, PageRequest.of(page, safeSize));

        log.debug("Batch request from {}: page={}, size={}, returned={}, hasMore={}",
            machineId, page, safeSize, changePage.getNumberOfElements(), changePage.hasNext());

        return ResponseEntity.ok()
            .header("X-Total-Count", String.valueOf(changePage.getTotalElements()))
            .header("X-Total-Pages", String.valueOf(changePage.getTotalPages()))
            .header("X-Has-More", String.valueOf(changePage.hasNext()))
            .header("X-Page", String.valueOf(page))
            .body(changePage.getContent());
    }

    @GetMapping("/changes/count")
    public ResponseEntity<Map<String, Long>> getPendingChangeCount(
            @RequestHeader("X-Machine-Id") String machineId) {
        return ResponseEntity.ok(Map.of("count", hubSyncService.getPendingChangeCount(machineId)));
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
        for (int i = 1; i <= 9; i++) {
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

        if (requestedNumber != null && (requestedNumber < 1 || requestedNumber > 9)) {
            return ResponseEntity.badRequest().body(Map.of("error", "deviceNumber must be between 1 and 9"));
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
            for (int i = 1; i <= 9; i++) {
                if (!taken.contains(i)) {
                    assigned = i;
                    break;
                }
            }
            if (assigned == -1) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "All device numbers (1-9) are taken"
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
