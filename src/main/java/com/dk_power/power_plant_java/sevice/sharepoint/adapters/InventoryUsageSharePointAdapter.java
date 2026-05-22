package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
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
public class InventoryUsageSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Inventory Usage";

    public List<InventoryUsageDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll InventoryUsage");
    }

    public List<InventoryUsageDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,
                "getModifiedSince InventoryUsage");
    }

    public String create(InventoryUsageDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create InventoryUsage");
    }

    public void update(String sharepointId, InventoryUsageDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update InventoryUsage");
    }

    // ====================== Certificate path ======================

    private List<InventoryUsageDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private List<InventoryUsageDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(InventoryUsageDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, InventoryUsageDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<InventoryUsageDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setEntity("usage");
        req.setData(Map.of());
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll InventoryUsage failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(InventoryUsageDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setEntity("usage");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create InventoryUsage failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, InventoryUsageDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setEntity("usage");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 update InventoryUsage failed: " + resp.getMessage());
    }

    // ====================== Column mapping ======================

    private InventoryUsageDto mapFromSharePoint(JsonNode item) {
        InventoryUsageDto dto = new InventoryUsageDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setInventoryItemId(parseLong(item.path("InventoryItemId").asText(null)));
        dto.setInventoryItemQrToken(item.path("QrToken").asText(null));
        dto.setUserName(item.path("UserName").asText(null));
        dto.setUserEmail(item.path("UserEmail").asText(null));
        dto.setLocation(item.path("Location").asText(null));
        dto.setPurpose(item.path("Purpose").asText(null));
        dto.setComments(item.path("Comments").asText(null));
        dto.setEventType(item.path("EventType").asText(null));
        dto.setScannedAt(parseInstant(item.path("ScannedAt").asText(null)));
        dto.setReturnedAt(parseInstant(item.path("ReturnedAt").asText(null)));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private InventoryUsageDto mapFromPaResponse(Map<String, Object> map) {
        InventoryUsageDto dto = new InventoryUsageDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setInventoryItemId(parseLong(str(map, "InventoryItemId")));
        dto.setInventoryItemQrToken(str(map, "QrToken"));
        dto.setUserName(str(map, "UserName"));
        dto.setUserEmail(str(map, "UserEmail"));
        dto.setLocation(str(map, "Location"));
        dto.setPurpose(str(map, "Purpose"));
        dto.setComments(str(map, "Comments"));
        dto.setEventType(str(map, "EventType"));
        dto.setScannedAt(parseInstant(str(map, "ScannedAt")));
        dto.setReturnedAt(parseInstant(str(map, "ReturnedAt")));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(InventoryUsageDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        // SharePoint Title field — use a human-readable summary
        String title = String.format("%s — %s by %s",
                dto.getInventoryItemQrToken() != null ? dto.getInventoryItemQrToken() : "",
                dto.getEventType() != null ? dto.getEventType() : "",
                dto.getUserName() != null ? dto.getUserName() : "");
        map.put("Title", title);
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("InventoryItemId", dto.getInventoryItemId() != null ? String.valueOf(dto.getInventoryItemId()) : "");
        map.put("QrToken", orEmpty(dto.getInventoryItemQrToken()));
        map.put("UserName", orEmpty(dto.getUserName()));
        map.put("UserEmail", orEmpty(dto.getUserEmail()));
        map.put("Location", orEmpty(dto.getLocation()));
        map.put("Purpose", orEmpty(dto.getPurpose()));
        map.put("Comments", orEmpty(dto.getComments()));
        map.put("EventType", orEmpty(dto.getEventType()));
        map.put("ScannedAt", dto.getScannedAt() != null ? dto.getScannedAt().toString() : "");
        map.put("ReturnedAt", dto.getReturnedAt() != null ? dto.getReturnedAt().toString() : "");
        return map;
    }

    private static Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try { return Long.parseLong(raw); } catch (Exception e) { return null; }
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[InventoryUsage-Adapter] Failed to parse Instant '{}': {}", raw, e.getMessage());
            return null;
        }
    }
}
