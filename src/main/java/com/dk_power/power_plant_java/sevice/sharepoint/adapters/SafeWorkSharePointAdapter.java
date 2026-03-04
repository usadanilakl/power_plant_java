package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
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
public class SafeWorkSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Safe Work Permits";

    public List<SafeWorkDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll SafeWorks");
    }

    public String create(SafeWorkDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create SafeWork");
    }

    public void update(String sharepointId, SafeWorkDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update SafeWork");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.safeWork(req); return null; },
                "changeStatus SafeWork");
    }

    // ====================== Certificate path ======================

    private List<SafeWorkDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(SafeWorkDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, SafeWorkDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<SafeWorkDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.safeWork(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll SafeWorks failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(SafeWorkDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.safeWork(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create SafeWork failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, SafeWorkDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.safeWork(req);
        if (!resp.isSuccess()) log.error("[SW-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private SafeWorkDto mapFromSharePoint(JsonNode item) {
        SafeWorkDto dto = new SafeWorkDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setCompanyPerson(item.path("CompanyPerson").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setSpecialInstructions(item.path("SpecialInstructions").asText(null));
        dto.setRequestedBy(item.path("RequestedBy").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private SafeWorkDto mapFromPaResponse(Map<String, Object> map) {
        SafeWorkDto dto = new SafeWorkDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setCompanyPerson(str(map, "CompanyPerson"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setSpecialInstructions(str(map, "SpecialInstructions"));
        dto.setRequestedBy(str(map, "RequestedBy"));
        dto.setLocalUuid(str(map, "PwaId"));
        return dto;
    }

    private Map<String, Object> toMap(SafeWorkDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("CompanyPerson", orEmpty(dto.getCompanyPerson()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("SpecialInstructions", orEmpty(dto.getSpecialInstructions()));
        map.put("RequestedBy", orEmpty(dto.getRequestedBy()));
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[SW-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
