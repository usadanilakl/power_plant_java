package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
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
public class LotoSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "LOTO Permits";

    public List<LotoDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll LOTOs");
    }

    public List<LotoDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,  // PA fallback doesn't support filtering
                "getModifiedSince LOTOs"
        );
    }

    private List<LotoDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(LotoDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create LOTO");
    }

    public void update(String sharepointId, LotoDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update LOTO");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.loto(req); return null; },
                "changeStatus LOTO");
    }

    // ====================== Certificate path ======================

    private List<LotoDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(LotoDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, LotoDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<LotoDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.loto(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll LOTOs failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(LotoDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.loto(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create LOTO failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, LotoDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.loto(req);
        if (!resp.isSuccess()) log.error("[LOTO-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private LotoDto mapFromSharePoint(JsonNode item) {
        LotoDto dto = new LotoDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setEquipmentSystem(item.path("EquipmentSystem").asText(null));
        dto.setLotoRequestor(item.path("LotoRequestor").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setBoxNumber(item.path("BoxNumber").isNull() ? null : item.path("BoxNumber").asInt());
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private LotoDto mapFromPaResponse(Map<String, Object> map) {
        LotoDto dto = new LotoDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setEquipmentSystem(str(map, "EquipmentSystem"));
        dto.setLotoRequestor(str(map, "LotoRequestor"));
        dto.setDate(str(map, "Date"));
        String boxNumberStr = str(map, "BoxNumber");
        dto.setBoxNumber(boxNumberStr != null ? Integer.valueOf(boxNumberStr) : null);
        return dto;
    }

    private Map<String, Object> toMap(LotoDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("EquipmentSystem", orEmpty(dto.getEquipmentSystem()));
        map.put("LotoRequestor", orEmpty(dto.getLotoRequestor()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("BoxNumber", dto.getBoxNumber());
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[LOTO-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
