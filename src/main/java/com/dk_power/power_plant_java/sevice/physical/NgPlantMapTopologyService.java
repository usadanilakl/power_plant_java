package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.dto.physical.PlantMapEquipmentPortRefDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAuditDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAttachRequest;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyConnectionDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyTerminalDto;
import com.dk_power.power_plant_java.entities.physical.PlantMapTopologyConnection;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.diagrams.DiagramPlacementRepo;
import com.dk_power.power_plant_java.repository.physical.PlantMapTopologyConnectionRepo;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
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
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class NgPlantMapTopologyService {
    private static final String EQUIPMENT = "EQUIPMENT_PORT";
    private static final String JUNCTION = "PIPE_JUNCTION";

    private final PlantMapTopologyConnectionRepo repo;
    private final ObjectMapper objectMapper;
    private final PhysicalObjectRepo physicalObjectRepo;
    private final DiagramPlacementRepo placementRepo;

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
        // Generated continuation segments declare their owning boundary port. Removing any port in that generated
        // run removes every generated segment and transit port, while leaving the user's original parent pipe.
        GeneratedContinuationRef generatedRef = null;
        for (DiagramPlacement placement : placementRepo.findAll()) {
            if (!"Pipe".equals(placement.getSourceEntityType())) continue;
            Map<String, Object> geo = readGeometry(placement);
            Map<?, ?> owner = geo.get("generatedByBoundaryPort") instanceof Map<?, ?> map ? map : null;
            if (owner != null && Objects.equals(asLong(owner.get("objectId")), objectId)
                && Objects.equals(String.valueOf(owner.get("portId")), portId)) {
                generatedRef = generatedContinuationRef(geo);
                break;
            }
        }
        if (generatedRef != null) {
            deleteGeneratedContinuation(generatedRef);
            return;
        }
        softDeleteEquipmentConnection(objectId, portId);
    }

    /** Transactional pipe deletion: topology, placement, fitting children and pipe identity are one operation. */
    public void deletePipe(Long pipeNodeId) {
        deletePipeCascade(pipeNodeId, new HashSet<>());
    }

    private void deletePipeCascade(Long pipeNodeId, Set<Long> deleting) {
        List<DiagramPlacement> placements = placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", pipeNodeId);
        if (placements.isEmpty()) throw new IllegalArgumentException("Plant Map pipe not found: " + pipeNodeId);
        GeneratedContinuationRef generatedRef = placements.stream().map(this::readGeometry)
            .map(this::generatedContinuationRef).filter(Objects::nonNull).findFirst().orElse(null);
        if (generatedRef != null) {
            deleteGeneratedContinuation(generatedRef, deleting);
            return;
        }
        if (!deleting.add(pipeNodeId)) return;
        deleteDependentContinuations(pipeNodeId, deleting);
        deletePipeRecord(pipeNodeId, placements);
    }

    private void deleteGeneratedContinuation(GeneratedContinuationRef ref) {
        deleteGeneratedContinuation(ref, new HashSet<>());
    }

    private void deleteGeneratedContinuation(GeneratedContinuationRef ref, Set<Long> deleting) {
        List<DiagramPlacement> generated = placementRepo.findAll().stream()
            .filter(placement -> "Pipe".equals(placement.getSourceEntityType()))
            .filter(placement -> matchesGeneratedContinuation(readGeometry(placement), ref))
            .toList();
        Map<String, PlantMapEquipmentPortRefDto> owners = new LinkedHashMap<>();
        for (DiagramPlacement placement : generated) {
            Map<?, ?> owner = (Map<?, ?>) readGeometry(placement).get("generatedByBoundaryPort");
            Long ownerId = asLong(owner.get("objectId"));
            String ownerPortId = String.valueOf(owner.get("portId"));
            if (ownerId != null && !blank(ownerPortId)) {
                PlantMapEquipmentPortRefDto ownerRef = new PlantMapEquipmentPortRefDto();
                ownerRef.setObjectId(ownerId);
                ownerRef.setPortId(ownerPortId);
                owners.put(equipmentKey(ownerId, ownerPortId), ownerRef);
            }
        }
        for (Long pipeNodeId : generated.stream().map(DiagramPlacement::getSourceEntityId)
            .filter(Objects::nonNull).distinct().toList()) {
            if (!deleting.add(pipeNodeId)) continue;
            deleteDependentContinuations(pipeNodeId, deleting);
            deletePipeRecord(pipeNodeId,
                placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", pipeNodeId));
        }
        for (PlantMapEquipmentPortRefDto owner : owners.values()) {
            removeEquipmentPortDefinition(owner.getObjectId(), owner.getPortId());
            softDeleteEquipmentConnection(owner.getObjectId(), owner.getPortId());
        }
    }

    private GeneratedContinuationRef generatedContinuationRef(Map<String, Object> geo) {
        if (!(geo.get("generatedByBoundaryPort") instanceof Map<?, ?>)) return null;
        String continuationId = geo.get("generatedContinuationId") == null
            ? null : String.valueOf(geo.get("generatedContinuationId"));
        String legacyGroup = geo.get("groupId") == null ? null : String.valueOf(geo.get("groupId"));
        return blank(continuationId) && blank(legacyGroup) ? null
            : new GeneratedContinuationRef(continuationId, legacyGroup);
    }

    private boolean matchesGeneratedContinuation(Map<String, Object> geo, GeneratedContinuationRef ref) {
        if (!(geo.get("generatedByBoundaryPort") instanceof Map<?, ?>)) return false;
        if (!blank(ref.id())) return Objects.equals(ref.id(), geo.get("generatedContinuationId"));
        return Objects.equals(ref.legacyGroup(), geo.get("groupId"));
    }

    private void deleteDependentContinuations(Long sourcePipeNodeId, Set<Long> deleting) {
        Set<GeneratedContinuationRef> dependents = placementRepo.findAll().stream()
            .filter(placement -> "Pipe".equals(placement.getSourceEntityType()))
            .map(this::readGeometry)
            .filter(geo -> Objects.equals(asLong(geo.get("generatedFromPipeNodeId")), sourcePipeNodeId))
            .map(this::generatedContinuationRef)
            .filter(Objects::nonNull)
            .collect(java.util.stream.Collectors.toSet());
        for (GeneratedContinuationRef dependent : dependents) {
            deleteGeneratedContinuation(dependent, deleting);
        }
    }

    private void deletePipeRecord(Long pipeNodeId, List<DiagramPlacement> placements) {
        detachPipe(pipeNodeId);
        for (DiagramPlacement placement : placements) {
            placement.setDeleted(true);
            placementRepo.save(placement);
        }
        PhysicalObject pipe = physicalObjectRepo.findById(pipeNodeId).orElse(null);
        if (pipe != null) softDeletePhysicalSubtree(pipe);
    }

    private record GeneratedContinuationRef(String id, String legacyGroup) {}

    /** Remove all logical terminals for a pipe without requiring the client to know its dynamic T:* tap ids. */
    public void detachPipe(Long pipeNodeId) {
        for (PlantMapTopologyConnection connection : repo.findAllForUpdate()) {
            List<PlantMapTopologyTerminalDto> terminals = readTerminals(connection);
            int before = terminals.size();
            terminals.removeIf(terminal -> Objects.equals(terminal.getPipeNodeId(), pipeNodeId));
            if (terminals.size() == before) continue;
            saveAfterRemoval(connection, terminals);
        }
    }

    /** Remove topology and placements referring to an object being deleted. */
    public void deleteEquipmentObject(Long objectId) {
        Set<GeneratedContinuationRef> generatedContinuations = new HashSet<>();
        for (DiagramPlacement placement : placementRepo.findAll()) {
            if (!"Pipe".equals(placement.getSourceEntityType())) continue;
            Map<String, Object> geo = readGeometry(placement);
            Map<?, ?> owner = geo.get("generatedByBoundaryPort") instanceof Map<?, ?> map ? map : null;
            if (owner != null && Objects.equals(asLong(owner.get("objectId")), objectId)) {
                GeneratedContinuationRef ref = generatedContinuationRef(geo);
                if (ref != null) generatedContinuations.add(ref);
            }
        }
        generatedContinuations.forEach(this::deleteGeneratedContinuation);
        for (PlantMapTopologyConnection connection : repo.findAllForUpdate()) {
            if (EQUIPMENT.equals(connection.getKind()) && Objects.equals(connection.getEquipmentObjectId(), objectId)) {
                softDelete(connection);
            }
        }
        for (DiagramPlacement placement : placementRepo.findAll().stream()
            .filter(item -> "PhysicalObject".equals(item.getSourceEntityType())
                && Objects.equals(item.getSourceEntityId(), objectId)).toList()) {
            placement.setDeleted(true);
            placementRepo.save(placement);
        }
    }

    /** Explicit repair tool for JSON-based references that cannot be protected by relational foreign keys. */
    public PlantMapTopologyAuditDto auditOrphans() {
        Set<Long> nodeIds = physicalObjectRepo.findAll().stream().map(PhysicalObject::getId).collect(java.util.stream.Collectors.toSet());
        List<DiagramPlacement> placements = placementRepo.findAll();
        Map<Long, Set<String>> tapsByPipe = new LinkedHashMap<>();
        Set<Long> placedPipes = new HashSet<>();
        int deletedPlacements = 0;
        for (DiagramPlacement placement : placements) {
            if (!"Pipe".equals(placement.getSourceEntityType()) || placement.getSourceEntityId() == null) continue;
            if (!nodeIds.contains(placement.getSourceEntityId())) {
                placement.setDeleted(true); placementRepo.save(placement); deletedPlacements++; continue;
            }
            placedPipes.add(placement.getSourceEntityId());
            Set<String> taps = tapsByPipe.computeIfAbsent(placement.getSourceEntityId(), ignored -> new HashSet<>());
            Object rawTaps = readGeometry(placement).get("taps");
            if (rawTaps instanceof List<?> list) for (Object item : list) if (item instanceof Map<?, ?> map && map.get("id") != null) {
                taps.add(String.valueOf(map.get("id")));
            }
        }
        Set<String> equipmentPorts = new HashSet<>();
        for (DiagramPlacement placement : placements) {
            if (!"PhysicalObject".equals(placement.getSourceEntityType()) || placement.getSourceEntityId() == null) continue;
            Object ports = readGeometry(placement).get("equipmentPorts");
            if (ports instanceof List<?> list) for (Object item : list) if (item instanceof Map<?, ?> map && map.get("id") != null) {
                equipmentPorts.add(equipmentKey(placement.getSourceEntityId(), String.valueOf(map.get("id"))));
            }
        }
        int scanned = 0, removed = 0, deleted = 0;
        for (PlantMapTopologyConnection connection : repo.findAllForUpdate()) {
            scanned++;
            if (EQUIPMENT.equals(connection.getKind()) && !equipmentPorts.contains(connection.getConnectionKey())) {
                removed += readTerminals(connection).size(); softDelete(connection); deleted++; continue;
            }
            List<PlantMapTopologyTerminalDto> terminals = readTerminals(connection);
            int before = terminals.size();
            terminals.removeIf(terminal -> terminal == null || terminal.getEnd() == null
                || !nodeIds.contains(terminal.getSectionId())
                || !nodeIds.contains(terminal.getPipeNodeId()) || !placedPipes.contains(terminal.getPipeNodeId())
                || (terminal.getEnd().startsWith("T:")
                    && !tapsByPipe.getOrDefault(terminal.getPipeNodeId(), Set.of()).contains(terminal.getEnd().substring(2))));
            removed += before - terminals.size();
            boolean willDelete = (!EQUIPMENT.equals(connection.getKind()) && terminals.size() < 2) || terminals.isEmpty();
            saveAfterRemoval(connection, terminals);
            if (willDelete) deleted++;
        }
        return new PlantMapTopologyAuditDto(scanned, removed, deleted, deletedPlacements);
    }

    private void saveAfterRemoval(PlantMapTopologyConnection connection, List<PlantMapTopologyTerminalDto> terminals) {
        if ((!EQUIPMENT.equals(connection.getKind()) && terminals.size() < 2) || terminals.isEmpty()) softDelete(connection);
        else { writeTerminals(connection, terminals); repo.save(connection); }
    }

    private void softDeleteEquipmentConnection(Long objectId, String portId) {
        String key = equipmentKey(objectId, portId);
        repo.findAllForUpdate().stream().filter(connection -> Objects.equals(key, connection.getConnectionKey()))
            .forEach(this::softDelete);
    }

    private void softDeletePhysicalSubtree(PhysicalObject node) {
        for (PhysicalObject child : physicalObjectRepo.findByParentId(node.getId())) softDeletePhysicalSubtree(child);
        node.setDeleted(true);
        physicalObjectRepo.save(node);
    }

    private void removeEquipmentPortDefinition(Long objectId, String portId) {
        for (DiagramPlacement placement : placementRepo.findAll().stream()
            .filter(item -> "PhysicalObject".equals(item.getSourceEntityType())
                && Objects.equals(item.getSourceEntityId(), objectId)).toList()) {
            try {
                com.fasterxml.jackson.databind.node.ObjectNode root = (com.fasterxml.jackson.databind.node.ObjectNode)
                    objectMapper.readTree(placement.getSvgPath() == null ? "{}" : placement.getSvgPath());
                com.fasterxml.jackson.databind.node.ArrayNode filtered = objectMapper.createArrayNode();
                if (root.path("equipmentPorts").isArray()) for (com.fasterxml.jackson.databind.JsonNode port : root.path("equipmentPorts")) {
                    if (!Objects.equals(port.path("id").asText(), portId)) filtered.add(port);
                }
                root.set("equipmentPorts", filtered);
                placement.setSvgPath(objectMapper.writeValueAsString(root));
                placementRepo.save(placement);
            } catch (Exception exception) {
                throw new IllegalStateException("Could not update equipment ports for object " + objectId, exception);
            }
        }
    }

    private Map<String, Object> readGeometry(DiagramPlacement placement) {
        try {
            return objectMapper.readValue(placement.getSvgPath() == null ? "{}" : placement.getSvgPath(),
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception ignored) { return new LinkedHashMap<>(); }
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        try { return value == null ? null : Long.valueOf(String.valueOf(value)); }
        catch (NumberFormatException ignored) { return null; }
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
