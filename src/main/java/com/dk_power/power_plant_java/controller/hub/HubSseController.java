package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import com.dk_power.power_plant_java.sevice.hub.HubSyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Hub SSE controller — matches sync-server's SseController API contract exactly.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/sync/sse")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubSseController {

    private final HubSseService hubSseService;
    private final HubSyncService hubSyncService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestHeader(value = "X-Machine-Name", defaultValue = "Unknown") String machineName,
            HttpServletRequest httpRequest) {

        log.info("Hub SSE subscription request from {} ({})", machineName, machineId);

        // Register/update client on SSE connect
        String ipAddress = httpRequest.getRemoteAddr();
        hubSyncService.registerClient(machineId, machineName, ipAddress);

        // Get pending change count so client knows if it needs to sync
        long pendingChanges = hubSyncService.getPendingChangeCount(machineId);

        return hubSseService.createEmitter(machineId, machineName, pendingChanges);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "totalConnections", hubSseService.getConnectionCount(),
            "uniqueMachines", hubSseService.getUniqueMachineCount()
        ));
    }

    @GetMapping("/connected/{machineId}")
    public ResponseEntity<Map<String, Object>> isMachineConnected(@PathVariable String machineId) {
        return ResponseEntity.ok(Map.of(
            "machineId", machineId,
            "connected", hubSseService.isMachineConnected(machineId)
        ));
    }
}
