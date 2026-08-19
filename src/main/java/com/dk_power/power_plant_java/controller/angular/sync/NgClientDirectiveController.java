package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.sevice.hub.HubClientDirectiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Hub-admin surface for the per-client next-boot directive: list every known client with its current
 * directive + apply state, and set/clear the directive for one client. Hub-only (the directive service and
 * client registry live only on the hub). The client itself never calls these — it reads its directive from
 * {@code GET /api/update/check} and reports back to {@code POST /api/update/applied}.
 */
@RestController
@RequestMapping("/ng/sync/clients")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class NgClientDirectiveController {

    private final HubClientDirectiveService directiveService;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<ClientDirectiveView>>> list() {
        List<ClientDirectiveView> views = directiveService.allClients().stream()
                .map(ClientDirectiveView::of).toList();
        return ResponseEntity.ok(new NgApiResponse<>(views, views.size() + " client(s)"));
    }

    @PostMapping("/{machineId}/directive")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> set(
            @PathVariable String machineId, @RequestBody SetDirectiveRequest req) {
        try {
            String id = directiveService.setDirective(machineId, req.actions(), req.mandatory(), req.message());
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("directiveId", id, "machineId", machineId),
                    "Directive set for " + machineId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{machineId}/directive")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> clear(@PathVariable String machineId) {
        directiveService.clearDirective(machineId);
        return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("machineId", machineId), "Directive cleared for " + machineId));
    }

    /** Issue an immediate command (SHUTDOWN / RESTART) to a RUNNING client. */
    @PostMapping("/{machineId}/command")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> issueCommand(
            @PathVariable String machineId, @RequestBody IssueCommandRequest req) {
        try {
            String id = directiveService.issueCommand(machineId, req.command());
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("commandId", id, "machineId", machineId, "command", req.command()),
                    req.command() + " issued to " + machineId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Cancel an outstanding command before the client has executed it. */
    @DeleteMapping("/{machineId}/command")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> clearCommand(@PathVariable String machineId) {
        directiveService.clearCommand(machineId);
        return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("machineId", machineId), "Command cleared for " + machineId));
    }

    public record SetDirectiveRequest(List<String> actions, boolean mandatory, String message) {}
    public record IssueCommandRequest(String command) {}

    /** Flattened client + directive + command view for the management table. */
    public record ClientDirectiveView(
            String machineId, String machineName, Integer deviceNumber, String status,
            Instant lastSeen, Instant lastSyncTime,
            String directiveActions, String directiveId, boolean directiveMandatory, String directiveMessage,
            Instant directiveSetAt, String lastAppliedDirectiveId, Instant directiveAppliedAt,
            boolean directivePending,
            String pendingCommand, Instant pendingCommandIssuedAt, boolean commandPending) {

        static ClientDirectiveView of(HubClientInfo c) {
            boolean pending = c.getDirectiveActions() != null && !c.getDirectiveActions().isBlank()
                    && !Objects.equals(c.getDirectiveId(), c.getLastAppliedDirectiveId());
            boolean cmdPending = c.getPendingCommand() != null && !c.getPendingCommand().isBlank()
                    && !Objects.equals(c.getPendingCommandId(), c.getLastAckedCommandId());
            return new ClientDirectiveView(
                    c.getMachineId(), c.getMachineName(), c.getDeviceNumber(),
                    c.getStatus() != null ? c.getStatus().name() : null,
                    c.getLastSeen(), c.getLastSyncTime(),
                    c.getDirectiveActions(), c.getDirectiveId(), Boolean.TRUE.equals(c.getDirectiveMandatory()), c.getDirectiveMessage(),
                    c.getDirectiveSetAt(), c.getLastAppliedDirectiveId(), c.getDirectiveAppliedAt(), pending,
                    c.getPendingCommand(), c.getPendingCommandIssuedAt(), cmdPending);
        }
    }
}
