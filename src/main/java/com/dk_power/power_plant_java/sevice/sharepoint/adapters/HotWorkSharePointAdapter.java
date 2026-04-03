package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
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
public class HotWorkSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Hot Work Permits";

    public List<HotWorkDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll HotWorks");
    }

    public List<HotWorkDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,  // PA fallback doesn't support filtering
                "getModifiedSince HotWorks"
        );
    }

    private List<HotWorkDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(HotWorkDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create HotWork");
    }

    public void update(String sharepointId, HotWorkDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update HotWork");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.hotWork(req); return null; },
                "changeStatus HotWork");
    }

    // ====================== Certificate path ======================

    private List<HotWorkDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(HotWorkDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, HotWorkDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<HotWorkDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.hotWork(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll HotWorks failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(HotWorkDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.hotWork(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create HotWork failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, HotWorkDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.hotWork(req);
        if (!resp.isSuccess()) log.error("[HW-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private HotWorkDto mapFromSharePoint(JsonNode item) {
        HotWorkDto dto = new HotWorkDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setForeman(item.path("Foreman").asText(null));
        dto.setFireWatch(item.path("FireWatch").asText(null));
        dto.setMeterModel(item.path("MeterModel").asText(null));
        dto.setMeterNum(item.path("MeterNum").asText(null));
        dto.setSpecialInstructions(item.path("SpecialInstructions").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private HotWorkDto mapFromPaResponse(Map<String, Object> map) {
        HotWorkDto dto = new HotWorkDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setDate(str(map, "Date"));
        dto.setForeman(str(map, "Foreman"));
        dto.setFireWatch(str(map, "FireWatch"));
        dto.setMeterModel(str(map, "MeterModel"));
        dto.setMeterNum(str(map, "MeterNum"));
        dto.setSpecialInstructions(str(map, "SpecialInstructions"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setLocalUuid(str(map, "PwaId"));
        return dto;
    }

    private Map<String, Object> toMap(HotWorkDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Foreman", orEmpty(dto.getForeman()));
        map.put("FireWatch", orEmpty(dto.getFireWatch()));
        map.put("MeterModel", orEmpty(dto.getMeterModel()));
        map.put("MeterNum", orEmpty(dto.getMeterNum()));
        map.put("SpecialInstructions", orEmpty(dto.getSpecialInstructions()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[HW-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
