package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
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
public class ConfinedSpaceSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Confined Space Permits";

    public List<ConfinedSpaceDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll ConfinedSpaces");
    }

    public String create(ConfinedSpaceDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create ConfinedSpace");
    }

    public void update(String sharepointId, ConfinedSpaceDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update ConfinedSpace");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.confinedSpace(req); return null; },
                "changeStatus ConfinedSpace");
    }

    // ====================== Certificate path ======================

    private List<ConfinedSpaceDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(ConfinedSpaceDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, ConfinedSpaceDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<ConfinedSpaceDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.confinedSpace(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll ConfinedSpaces failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(ConfinedSpaceDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.confinedSpace(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create ConfinedSpace failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, ConfinedSpaceDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.confinedSpace(req);
        if (!resp.isSuccess()) log.error("[CS-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private ConfinedSpaceDto mapFromSharePoint(JsonNode item) {
        ConfinedSpaceDto dto = new ConfinedSpaceDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setSpace(item.path("SpaceToBeEntered").asText(null));
        dto.setIssuedTo(item.path("IssuedTo").asText(null));
        dto.setDuration(item.path("Duration").asText(null));
        dto.setMeterModel(item.path("MeterModel").asText(null));
        dto.setMeterNum(item.path("MeterNum").asText(null));
        dto.setCalibrated(item.path("Calibrated").asBoolean(false));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private ConfinedSpaceDto mapFromPaResponse(Map<String, Object> map) {
        ConfinedSpaceDto dto = new ConfinedSpaceDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setSpace(str(map, "SpaceToBeEntered"));
        dto.setIssuedTo(str(map, "IssuedTo"));
        dto.setDuration(str(map, "Duration"));
        dto.setMeterModel(str(map, "MeterModel"));
        dto.setMeterNum(str(map, "MeterNum"));
        dto.setCalibrated("true".equalsIgnoreCase(str(map, "Calibrated")));
        dto.setLocalUuid(str(map, "PwaId"));
        return dto;
    }

    private Map<String, Object> toMap(ConfinedSpaceDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("SpaceToBeEntered", orEmpty(dto.getSpace()));
        map.put("IssuedTo", orEmpty(dto.getIssuedTo()));
        map.put("Duration", orEmpty(dto.getDuration()));
        map.put("MeterModel", orEmpty(dto.getMeterModel()));
        map.put("MeterNum", orEmpty(dto.getMeterNum()));
        map.put("Calibrated", dto.isCalibrated());
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[CS-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
