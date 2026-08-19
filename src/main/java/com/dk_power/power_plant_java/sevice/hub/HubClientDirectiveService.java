package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.repository.hub.HubClientInfoRepository;
import com.dk_power.power_plant_java.sevice.hub.HubJarUpdateService.UpdatePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Owns the per-client next-boot directive stored on {@link HubClientInfo}. The hub can tell a SPECIFIC
 * client what to update on its next boot (jar / db / files / electron); the client's update-check returns
 * that directive as its {@link UpdatePolicy}, overriding the single global {@code update-policy.json}.
 *
 * <p>Idempotency: a directive carries a {@code directiveId}; the client reports it applied via
 * {@link #markApplied}, which sets {@code lastAppliedDirectiveId == directiveId} so a db/files action is
 * never re-run on every boot. Setting a NEW directive mints a fresh id, so it applies once more.
 *
 * <p>Hub-only (whole bean gated on {@code sync.role=hub}).
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubClientDirectiveService {

    /** Actions the client understands. Unknown strings are rejected so a typo can't silently no-op a rollout. */
    private static final Set<String> ALLOWED_ACTIONS = Set.of("jar", "db", "files", "electron");

    private final HubClientInfoRepository clientRepo;

    /**
     * The directive to hand THIS client on update-check, or empty when it has none outstanding. Outstanding =
     * an action set whose id the client has not yet reported applied. A blank machineId (an update-check with
     * no X-Machine-Id — e.g. the legacy client) yields empty, so the caller falls back to the global policy.
     */
    @Transactional(readOnly = true)
    public Optional<UpdatePolicy> effectiveDirectiveFor(String machineId) {
        if (machineId == null || machineId.isBlank()) return Optional.empty();
        return clientRepo.findById(machineId)
                .filter(c -> c.getDirectiveActions() != null && !c.getDirectiveActions().isBlank())
                .filter(c -> !Objects.equals(c.getDirectiveId(), c.getLastAppliedDirectiveId()))
                .map(c -> new UpdatePolicy(c.getDirectiveId(), parseActions(c.getDirectiveActions()),
                        Boolean.TRUE.equals(c.getDirectiveMandatory()), c.getDirectiveMessage()));
    }

    /**
     * Set (or replace) a client's next-boot directive. Mints a fresh {@code directiveId} so it applies once
     * more even if the same actions were set before. Returns the new id.
     *
     * @throws IllegalArgumentException if the client is unknown or no valid action is supplied.
     */
    @Transactional
    public String setDirective(String machineId, List<String> actions, boolean mandatory, String message) {
        HubClientInfo client = clientRepo.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown client: " + machineId));
        List<String> clean = normalizeActions(actions);
        if (clean.isEmpty()) {
            throw new IllegalArgumentException("No valid actions (allowed: " + ALLOWED_ACTIONS + ")");
        }
        String id = "dir-" + UUID.randomUUID();
        client.setDirectiveActions(String.join(",", clean));
        client.setDirectiveId(id);
        client.setDirectiveMandatory(mandatory);
        client.setDirectiveMessage(message);
        client.setDirectiveSetAt(Instant.now());
        // A brand-new directive is not yet applied; leave lastAppliedDirectiveId as-is (it won't match the
        // new id, so effectiveDirectiveFor returns it). Do NOT clear directiveAppliedAt — historical info.
        clientRepo.save(client);
        log.info("hub.directive.set machine={} id={} actions={} mandatory={}", machineId, id, clean, mandatory);
        return id;
    }

    /** Remove a client's outstanding directive (nothing to apply on next boot). */
    @Transactional
    public void clearDirective(String machineId) {
        clientRepo.findById(machineId).ifPresent(client -> {
            client.setDirectiveActions(null);
            client.setDirectiveId(null);
            client.setDirectiveMandatory(false);
            client.setDirectiveMessage(null);
            client.setDirectiveSetAt(null);
            clientRepo.save(client);
            log.info("hub.directive.cleared machine={}", machineId);
        });
    }

    /**
     * Record that the client finished applying {@code directiveId}. Returns true ONLY when it actually took
     * effect. No-op (false) for a null/unknown machineId, or a stale ack whose id no longer matches the
     * client's current directive (a stale ack for a superseded directive must not mark the new one done) —
     * so the caller can tell the client the ack did not land rather than falsely reporting success.
     */
    @Transactional
    public boolean markApplied(String machineId, String directiveId) {
        if (machineId == null || directiveId == null) return false;
        Optional<HubClientInfo> found = clientRepo.findById(machineId);
        if (found.isEmpty()) {
            log.info("hub.directive.applied_unknown_client machine={} id={} — ignored", machineId, directiveId);
            return false;
        }
        HubClientInfo client = found.get();
        if (!Objects.equals(client.getDirectiveId(), directiveId)) {
            log.info("hub.directive.applied_stale machine={} reported={} current={} — ignored",
                    machineId, directiveId, client.getDirectiveId());
            return false;
        }
        client.setLastAppliedDirectiveId(directiveId);
        client.setDirectiveAppliedAt(Instant.now());
        clientRepo.save(client);
        log.info("hub.directive.applied machine={} id={}", machineId, directiveId);
        return true;
    }

    // ==================== Immediate commands (shutdown / restart a running client) ====================

    /** Commands a running client's agent knows how to execute. */
    private static final Set<String> ALLOWED_COMMANDS = Set.of("SHUTDOWN", "RESTART");

    /** A command a running client should execute now. */
    public record ClientCommand(String id, String command) {}

    /**
     * Issue an immediate command (SHUTDOWN / RESTART) to a running client. Mints a fresh id so the client
     * executes it once (it acks the id via {@link #markCommandApplied}). Returns the new id.
     * @throws IllegalArgumentException if the client is unknown or the command is not recognised.
     */
    @Transactional
    public String issueCommand(String machineId, String command) {
        HubClientInfo client = clientRepo.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown client: " + machineId));
        String type = command == null ? "" : command.trim().toUpperCase();
        if (!ALLOWED_COMMANDS.contains(type)) {
            throw new IllegalArgumentException("Unknown command (allowed: " + ALLOWED_COMMANDS + ")");
        }
        String id = "cmd-" + UUID.randomUUID();
        client.setPendingCommand(type);
        client.setPendingCommandId(id);
        client.setPendingCommandIssuedAt(Instant.now());
        clientRepo.save(client);
        log.info("hub.command.issued machine={} id={} command={}", machineId, id, type);
        return id;
    }

    /** Cancel an outstanding command (before the client has executed it). */
    @Transactional
    public void clearCommand(String machineId) {
        clientRepo.findById(machineId).ifPresent(client -> {
            client.setPendingCommand(null);
            client.setPendingCommandId(null);
            client.setPendingCommandIssuedAt(null);
            clientRepo.save(client);
            log.info("hub.command.cleared machine={}", machineId);
        });
    }

    /** The command this client should execute now, or empty when there is none outstanding. */
    @Transactional(readOnly = true)
    public Optional<ClientCommand> pendingCommandFor(String machineId) {
        if (machineId == null || machineId.isBlank()) return Optional.empty();
        return clientRepo.findById(machineId)
                .filter(c -> c.getPendingCommand() != null && !c.getPendingCommand().isBlank())
                .filter(c -> !Objects.equals(c.getPendingCommandId(), c.getLastAckedCommandId()))
                .map(c -> new ClientCommand(c.getPendingCommandId(), c.getPendingCommand()));
    }

    /** Record that the client executed {@code commandId}. No-op (false) for a null/unknown machine or a
     *  stale id that no longer matches the current command. */
    @Transactional
    public boolean markCommandApplied(String machineId, String commandId) {
        if (machineId == null || commandId == null) return false;
        Optional<HubClientInfo> found = clientRepo.findById(machineId);
        if (found.isEmpty()) return false;
        HubClientInfo client = found.get();
        if (!Objects.equals(client.getPendingCommandId(), commandId)) {
            log.info("hub.command.applied_stale machine={} reported={} current={} — ignored",
                    machineId, commandId, client.getPendingCommandId());
            return false;
        }
        client.setLastAckedCommandId(commandId);
        client.setPendingCommandAckedAt(Instant.now());
        clientRepo.save(client);
        log.info("hub.command.applied machine={} id={}", machineId, commandId);
        return true;
    }

    /** All known clients (for the hub directive-management UI). */
    @Transactional(readOnly = true)
    public List<HubClientInfo> allClients() {
        return clientRepo.findAll();
    }

    private List<String> normalizeActions(List<String> actions) {
        if (actions == null) return List.of();
        List<String> out = new ArrayList<>();
        for (String a : actions) {
            if (a == null) continue;
            String v = a.trim().toLowerCase();
            if (ALLOWED_ACTIONS.contains(v) && !out.contains(v)) out.add(v);
        }
        return out;
    }

    private List<String> parseActions(String csv) {
        List<String> out = new ArrayList<>();
        for (String a : csv.split(",")) {
            String v = a.trim();
            if (!v.isEmpty()) out.add(v);
        }
        return out;
    }
}
