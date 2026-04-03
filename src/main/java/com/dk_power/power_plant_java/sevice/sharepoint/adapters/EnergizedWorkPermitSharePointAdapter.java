package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.EnergizedWorkPermitDto;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergizedWorkPermitSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Energized Work Permits";

    public List<EnergizedWorkPermitDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll EnergizedWorkPermits");
    }

    public List<EnergizedWorkPermitDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,  // PA fallback doesn't support filtering
                "getModifiedSince EnergizedWorkPermits"
        );
    }

    private List<EnergizedWorkPermitDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(EnergizedWorkPermitDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create EnergizedWorkPermit");
    }

    public void update(String sharepointId, EnergizedWorkPermitDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update EnergizedWorkPermit");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.energizedWork(req); return null; },
                "changeStatus EnergizedWorkPermit");
    }

    // ====================== Certificate path ======================

    private List<EnergizedWorkPermitDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(EnergizedWorkPermitDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, EnergizedWorkPermitDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<EnergizedWorkPermitDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.energizedWork(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll EnergizedWorkPermits failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(EnergizedWorkPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.energizedWork(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create EnergizedWorkPermit failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, EnergizedWorkPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.energizedWork(req);
        if (!resp.isSuccess()) log.error("[EWP-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private EnergizedWorkPermitDto mapFromSharePoint(JsonNode item) {
        EnergizedWorkPermitDto dto = new EnergizedWorkPermitDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setIssuedTo(item.path("IssuedTo").asText(null));
        dto.setWorkOrder(item.path("WorkOrder").asText(null));
        dto.setCircuitDescription(item.path("CircuitDescription").asText(null));
        dto.setWorkDescription(item.path("WorkDescription").asText(null));
        dto.setJustification(item.path("Justification").asText(null));
        dto.setRequester(item.path("Requester").asText(null));
        dto.setRequesterDate(item.path("RequesterDate").asText(null));
        dto.setQualifiedPersonSignature(item.path("QualifiedPersonSignature").asText(null));
        dto.setQualifiedPersonDate(item.path("QualifiedPersonDate").asText(null));
        dto.setPlantManagerSignature(item.path("PlantManagerSignature").asText(null));
        dto.setPlantManagerDate(item.path("PlantManagerDate").asText(null));
        dto.setWorkCanBePerformedSafely(item.path("WorkCanBePerformedSafely").isNull() ? null : item.path("WorkCanBePerformedSafely").asBoolean());
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private EnergizedWorkPermitDto mapFromPaResponse(Map<String, Object> map) {
        EnergizedWorkPermitDto dto = new EnergizedWorkPermitDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setIssuedTo(str(map, "IssuedTo"));
        dto.setWorkOrder(str(map, "WorkOrder"));
        dto.setCircuitDescription(str(map, "CircuitDescription"));
        dto.setWorkDescription(str(map, "WorkDescription"));
        dto.setJustification(str(map, "Justification"));
        dto.setRequester(str(map, "Requester"));
        dto.setRequesterDate(str(map, "RequesterDate"));
        dto.setQualifiedPersonSignature(str(map, "QualifiedPersonSignature"));
        dto.setQualifiedPersonDate(str(map, "QualifiedPersonDate"));
        dto.setPlantManagerSignature(str(map, "PlantManagerSignature"));
        dto.setPlantManagerDate(str(map, "PlantManagerDate"));
        String safelyStr = str(map, "WorkCanBePerformedSafely");
        dto.setWorkCanBePerformedSafely(safelyStr != null ? Boolean.valueOf(safelyStr) : null);
        return dto;
    }

    private Map<String, Object> toMap(EnergizedWorkPermitDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("IssuedTo", orEmpty(dto.getIssuedTo()));
        map.put("WorkOrder", orEmpty(dto.getWorkOrder()));
        map.put("CircuitDescription", orEmpty(dto.getCircuitDescription()));
        map.put("WorkDescription", orEmpty(dto.getWorkDescription()));
        map.put("Justification", orEmpty(dto.getJustification()));
        map.put("Requester", orEmpty(dto.getRequester()));
        map.put("RequesterDate", orEmpty(dto.getRequesterDate()));
        map.put("QualifiedPersonSignature", orEmpty(dto.getQualifiedPersonSignature()));
        map.put("QualifiedPersonDate", orEmpty(dto.getQualifiedPersonDate()));
        map.put("PlantManagerSignature", orEmpty(dto.getPlantManagerSignature()));
        map.put("PlantManagerDate", orEmpty(dto.getPlantManagerDate()));
        map.put("WorkCanBePerformedSafely", dto.getWorkCanBePerformedSafely());
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[EWP-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
