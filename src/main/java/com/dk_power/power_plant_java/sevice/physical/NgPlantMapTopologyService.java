package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.dto.physical.PlantMapEquipmentPortRefDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAttachRequest;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyConnectionDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyTerminalDto;
import com.dk_power.power_plant_java.entities.physical.PlantMapTopologyConnection;
import com.dk_power.power_plant_java.repository.physical.PlantMapTopologyConnectionRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class NgPlantMapTopologyService {
    private static final String EQUIPMENT = "EQUIPMENT_PORT";
    private static final String JUNCTION = "PIPE_JUNCTION";

    private final PlantMapTopologyConnectionRepo repo;
    private final ObjectMapper objectMapper;

    public List<PlantMapTopologyConnectionDto> getAll() {
        // The same deterministic equipment key can be created independently on offline devices. It is still one
        // logical junction, so expose the union immediately instead of making the UI choose an arbitrary row.
        Map<String, PlantMapTopologyConnectionDto> byKey = new LinkedHashMap<>();
        for (PlantMapTopologyConnection entity : repo.findAll()) {
            PlantMapTopologyConnectionDto incoming = toDto(entity);
            PlantMapTopologyConnectionDto current = byKey.get(incoming.getConnectionKey());
            if (current == null) {
                byKey.put(incoming.getConnectionKey(), incoming);
                continue;
            }
            for (PlantMapTopologyTerminalDto terminal : incoming.getTerminals()) {
                addIfMissing(current.getTerminals(), terminal);
            }
            if (current.getEquipmentObjectId() == null) current.setEquipmentObjectId(incoming.getEquipmentObjectId());
            if (current.getEquipmentPortId() == null) current.setEquipmentPortId(incoming.getEquipmentPortId());
        }
        return new ArrayList<>(byKey.values());
    }

    /**
     * Atomically moves one pipe end onto a canonical junction. If a target pipe end already belongs to a
     * junction, that junction is reused; this is what makes tees/branches possible without duplicated links.
     */
    public PlantMapTopologyConnectionDto attach(PlantMapTopologyAttachRequest request) {
        PlantMapTopologyTerminalDto terminal = normalized(request.getTerminal());
        PlantMapTopologyTerminalDto target = request.getTargetTerminal() == null
            ? null : normalized(request.getTargetTerminal());
        if (target != null && sameTerminal(terminal, target)) {
            throw new IllegalArgumentException("A pipe end cannot connect to itself.");
        }

        List<PlantMapTopologyConnection> all = repo.findAllForUpdate();
        PlantMapTopologyConnection sourceConnection = findContaining(all, terminal);
        PlantMapTopologyConnection targetConnection = target == null ? null : findContaining(all, target);
        PlantMapTopologyConnection destination = chooseDestination(all, request, target);
        if (request.isMergeJunctions() && !EQUIPMENT.equals(destination.getKind())) {
            if (sourceConnection != null && EQUIPMENT.equals(sourceConnection.getKind())) destination = sourceConnection;
            else if (targetConnection != null && EQUIPMENT.equals(targetConnection.getKind())) destination = targetConnection;
        }
        consolidateSameKey(all, destination);

        if (request.isMergeJunctions()) {
            mergeConnectionInto(sourceConnection, destination);
            mergeConnectionInto(targetConnection, destination);
        }

        detachFromOtherConnections(all, terminal, destination);
        if (target != null) detachFromOtherConnections(all, target, destination);

        List<PlantMapTopologyTerminalDto> terminals = readTerminals(destination);
        addIfMissing(terminals, terminal);
        if (target != null) addIfMissing(terminals, target);
        writeTerminals(destination, terminals);
        return toDto(repo.save(destination));
    }

    private void mergeConnectionInto(
        PlantMapTopologyConnection source,
        PlantMapTopologyConnection destination
    ) {
        if (source == null || source == destination
            || Objects.equals(source.getConnectionKey(), destination.getConnectionKey())) return;
        List<PlantMapTopologyTerminalDto> merged = readTerminals(destination);
        for (PlantMapTopologyTerminalDto participant : readTerminals(source)) addIfMissing(merged, participant);
        writeTerminals(destination, merged);
        softDelete(source);
    }

    /** Detaches only this participant. A non-equipment junction with fewer than two ends no longer represents a connection. */
    public void detach(PlantMapTopologyTerminalDto rawTerminal) {
        PlantMapTopologyTerminalDto terminal = normalized(rawTerminal);
        for (PlantMapTopologyConnection connection : repo.findAllForUpdate()) {
            List<PlantMapTopologyTerminalDto> terminals = readTerminals(connection);
            boolean removed = terminals.removeIf(item -> sameTerminal(item, terminal));
            if (!removed) continue;
            if (!EQUIPMENT.equals(connection.getKind()) && terminals.size() < 2) softDelete(connection);
            else if (terminals.isEmpty()) softDelete(connection);
            else { writeTerminals(connection, terminals); repo.save(connection); }
        }
    }

    /** Disconnects the whole junction, so no stale counterpart can keep navigating to an old link. */
    public void disconnect(String connectionKey) {
        repo.findAllForUpdate().stream()
            .filter(connection -> Objects.equals(connectionKey, connection.getConnectionKey()))
            .forEach(this::softDelete);
    }

    public void deleteEquipmentPort(Long objectId, String portId) {
        String key = equipmentKey(objectId, portId);
        repo.findAllForUpdate().stream()
            .filter(connection -> Objects.equals(key, connection.getConnectionKey()))
            .forEach(this::softDelete);
    }

    private PlantMapTopologyConnection chooseDestination(
        List<PlantMapTopologyConnection> all,
        PlantMapTopologyAttachRequest request,
        PlantMapTopologyTerminalDto target
    ) {
        PlantMapEquipmentPortRefDto equipment = request.getEquipmentPort();
        String key;
        String kind;
        Long equipmentObjectId = null;
        String equipmentPortId = null;

        if (equipment != null) {
            if (equipment.getObjectId() == null || blank(equipment.getPortId())) {
                throw new IllegalArgumentException("Equipment connector identity is required.");
            }
            key = equipmentKey(equipment.getObjectId(), equipment.getPortId());
            kind = EQUIPMENT;
            equipmentObjectId = equipment.getObjectId();
            equipmentPortId = equipment.getPortId().trim();
        } else if (!blank(request.getConnectionKey())) {
            key = request.getConnectionKey().trim();
            kind = blank(request.getKind()) ? JUNCTION : request.getKind().trim().toUpperCase();
        } else {
            PlantMapTopologyConnection targetConnection = target == null ? null : findContaining(all, target);
            if (targetConnection != null) return targetConnection;
            key = "junction:" + UUID.randomUUID();
            kind = JUNCTION;
        }

        for (PlantMapTopologyConnection connection : all) {
            if (key.equals(connection.getConnectionKey())) return connection;
        }
        PlantMapTopologyConnection created = new PlantMapTopologyConnection();
        created.setConnectionKey(key);
        created.setKind(kind);
        created.setEquipmentObjectId(equipmentObjectId);
        created.setEquipmentPortId(equipmentPortId);
        created.setTerminalsJson("[]");
        return created;
    }

    private void detachFromOtherConnections(
        List<PlantMapTopologyConnection> all,
        PlantMapTopologyTerminalDto terminal,
        PlantMapTopologyConnection destination
    ) {
        for (PlantMapTopologyConnection connection : all) {
            if (connection == destination) continue;
            List<PlantMapTopologyTerminalDto> terminals = readTerminals(connection);
            if (!terminals.removeIf(item -> sameTerminal(item, terminal))) continue;
            if (!EQUIPMENT.equals(connection.getKind()) && terminals.size() < 2) softDelete(connection);
            else if (terminals.isEmpty()) softDelete(connection);
            else { writeTerminals(connection, terminals); repo.save(connection); }
        }
    }

    /** A tombstone is required so disconnects propagate to every synced device. */
    private void softDelete(PlantMapTopologyConnection connection) {
        connection.setTerminalsJson("[]");
        connection.setDeleted(true);
        repo.save(connection);
    }

    /** Collapse offline duplicates for a stable key the first time that junction is edited locally. */
    private void consolidateSameKey(
        List<PlantMapTopologyConnection> all,
        PlantMapTopologyConnection destination
    ) {
        List<PlantMapTopologyTerminalDto> merged = readTerminals(destination);
        for (PlantMapTopologyConnection candidate : all) {
            if (candidate == destination || !Objects.equals(candidate.getConnectionKey(), destination.getConnectionKey())) {
                continue;
            }
            for (PlantMapTopologyTerminalDto terminal : readTerminals(candidate)) addIfMissing(merged, terminal);
            softDelete(candidate);
        }
        writeTerminals(destination, merged);
    }

    private PlantMapTopologyConnection findContaining(
        List<PlantMapTopologyConnection> all,
        PlantMapTopologyTerminalDto terminal
    ) {
        return all.stream().filter(connection -> readTerminals(connection).stream()
            .anyMatch(item -> sameTerminal(item, terminal))).findFirst().orElse(null);
    }

    private PlantMapTopologyTerminalDto normalized(PlantMapTopologyTerminalDto terminal) {
        if (terminal == null || terminal.getPipeNodeId() == null || terminal.getSectionId() == null) {
            throw new IllegalArgumentException("Pipe, end, and section are required.");
        }
        String rawEnd = terminal.getEnd() == null ? "" : terminal.getEnd().trim();
        String end;
        if (rawEnd.equalsIgnoreCase("A")) end = "A";
        else if (rawEnd.equalsIgnoreCase("B")) end = "B";
        else if (rawEnd.startsWith("T:") && rawEnd.length() > 2 && rawEnd.length() <= 130
            && rawEnd.substring(2).matches("[A-Za-z0-9._:-]+")) end = rawEnd;
        else throw new IllegalArgumentException("Pipe terminal must be endpoint A/B or a valid branch point.");
        PlantMapTopologyTerminalDto result = new PlantMapTopologyTerminalDto();
        result.setPipeNodeId(terminal.getPipeNodeId());
        result.setSectionId(terminal.getSectionId());
        result.setEnd(end);
        return result;
    }

    private boolean sameTerminal(PlantMapTopologyTerminalDto left, PlantMapTopologyTerminalDto right) {
        return Objects.equals(left.getPipeNodeId(), right.getPipeNodeId())
            && Objects.equals(left.getEnd(), right.getEnd());
    }

    private void addIfMissing(List<PlantMapTopologyTerminalDto> terminals, PlantMapTopologyTerminalDto terminal) {
        if (terminals.stream().noneMatch(item -> sameTerminal(item, terminal))) terminals.add(terminal);
    }

    private List<PlantMapTopologyTerminalDto> readTerminals(PlantMapTopologyConnection connection) {
        try {
            List<PlantMapTopologyTerminalDto> terminals = objectMapper.readValue(
                connection.getTerminalsJson() == null ? "[]" : connection.getTerminalsJson(),
                new TypeReference<List<PlantMapTopologyTerminalDto>>() {});
            return terminals == null ? new ArrayList<>() : new ArrayList<>(terminals);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid topology record " + connection.getConnectionKey(), exception);
        }
    }

    private void writeTerminals(PlantMapTopologyConnection connection, List<PlantMapTopologyTerminalDto> terminals) {
        try { connection.setTerminalsJson(objectMapper.writeValueAsString(terminals)); }
        catch (Exception exception) { throw new IllegalStateException("Could not serialize Plant Map topology.", exception); }
    }

    private PlantMapTopologyConnectionDto toDto(PlantMapTopologyConnection connection) {
        PlantMapTopologyConnectionDto dto = new PlantMapTopologyConnectionDto();
        dto.setId(connection.getId());
        dto.setConnectionKey(connection.getConnectionKey());
        dto.setKind(connection.getKind());
        dto.setEquipmentObjectId(connection.getEquipmentObjectId());
        dto.setEquipmentPortId(connection.getEquipmentPortId());
        dto.setTerminals(readTerminals(connection));
        return dto;
    }

    private String equipmentKey(Long objectId, String portId) {
        return "equipment:" + objectId + ":" + portId.trim();
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
}
