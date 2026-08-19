package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubClientDirectiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

/**
 * Hub endpoints a RUNNING client's Electron agent polls to pick up + acknowledge immediate commands
 * (shutdown / restart). Distinct from the next-boot directive served by {@code /api/update/check}. Under
 * {@code /api/sync/clients/*}, which SecurityConfigSpring restricts to internal/LAN callers.
 */
@RestController
@RequestMapping("/api/sync/clients")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubClientCommandController {

    private final HubClientDirectiveService directiveService;

    /** The command this client should execute now, or {@code {"command": null}} when there is none. */
    @GetMapping("/command")
    public ResponseEntity<Map<String, Object>> pendingCommand(
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId) {
        return directiveService.pendingCommandFor(machineId)
                .map(cmd -> ResponseEntity.ok(Map.<String, Object>of("command", cmd.command(), "id", cmd.id())))
                .orElseGet(() -> ResponseEntity.ok(Collections.singletonMap("command", null)));
    }

    /** The client reports it executed {@code {"id": "cmd-..."}}. Idempotent: a stale/unknown id is a no-op. */
    @PostMapping("/command-applied")
    public ResponseEntity<Map<String, Object>> commandApplied(
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId,
            @RequestBody Map<String, String> body) {
        String id = body != null ? body.get("id") : null;
        boolean applied = directiveService.markCommandApplied(machineId, id);
        return ResponseEntity.ok(Map.of("ok", applied, "id", String.valueOf(id)));
    }
}
