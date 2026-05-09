package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
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
public class InventoryItemSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Inventory";

    public List<InventoryItemDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll Inventory");
    }

    public List<InventoryItemDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,
                "getModifiedSince Inventory");
    }

    public String create(InventoryItemDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create InventoryItem");
    }

    public void update(String sharepointId, InventoryItemDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update InventoryItem");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certChangeStatus(sharepointId, status); return null; },
                () -> { paChangeStatus(sharepointId, status); return null; },
                "changeStatus InventoryItem");
    }

    public List<PaAttachmentDto> getAttachments(String sharepointId) {
        return spService.executeWithFallback(
                () -> certGetAttachments(sharepointId),
                () -> paGetAttachments(sharepointId),
                "getAttachments InventoryItem");
    }

    public void addAttachment(String sharepointId, PaAttachmentDto attachment) {
        spService.executeWithFallback(
                () -> { certAccess.addListItemAttachment(LIST_TITLE, sharepointId, attachment.getFileName(),
                        Base64.getDecoder().decode(attachment.getBase64Content())); return null; },
                () -> {
                    PaRequestDto req = new PaRequestDto();
                    req.setActionType("addAttachment");
                    req.setId(sharepointId);
                    req.setData(Map.of());
                    req.setAttachments(List.of(attachment));
                    v2Client.inventory(req);
                    return null;
                },
                "addAttachment InventoryItem");
    }

    // ====================== Certificate path ======================

    private List<PaAttachmentDto> certGetAttachments(String sharepointId) {
        List<JsonNode> attachmentNodes = certAccess.getListItemAttachments(LIST_TITLE, sharepointId);
        List<PaAttachmentDto> result = new ArrayList<>();
        for (JsonNode node : attachmentNodes) {
            String fileName = node.path("FileName").asText();
            byte[] content = certAccess.downloadListItemAttachment(LIST_TITLE, sharepointId, fileName);
            PaAttachmentDto dto = new PaAttachmentDto();
            dto.setFileName(fileName);
            dto.setContentType(guessContentType(fileName));
            dto.setBase64Content(Base64.getEncoder().encodeToString(content));
            result.add(dto);
        }
        return result;
    }

    private List<InventoryItemDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private List<InventoryItemDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(InventoryItemDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, InventoryItemDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    private void certChangeStatus(String sharepointId, String status) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Status", status);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    // ====================== Power Automate path ======================

    private List<InventoryItemDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setData(Map.of());

        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll Inventory failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(InventoryItemDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create Inventory failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, InventoryItemDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 update Inventory failed: " + resp.getMessage());
    }

    private void paChangeStatus(String sharepointId, String status) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(Map.of("Status", status));
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 changeStatus Inventory failed: " + resp.getMessage());
    }

    private List<PaAttachmentDto> paGetAttachments(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAttachments");
        req.setId(sharepointId);
        PaResponseDto resp = v2Client.inventory(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAttachments Inventory failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(map -> {
            PaAttachmentDto dto = new PaAttachmentDto();
            dto.setFileName(str(map, "fileName"));
            dto.setContentType(str(map, "contentType"));
            dto.setBase64Content(str(map, "base64Content"));
            return dto;
        }).collect(Collectors.toList());
    }

    // ====================== Column mapping ======================

    private InventoryItemDto mapFromSharePoint(JsonNode item) {
        InventoryItemDto dto = new InventoryItemDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setTitle(item.path("Title").asText(null));
        dto.setItemTypeName(item.path("ItemType").asText(null));
        dto.setStatusName(item.path("Status").asText(null));
        dto.setLocationName(item.path("Location").asText(null));
        dto.setSerialNumber(item.path("SerialNumber").asText(null));
        dto.setManufacturer(item.path("Manufacturer").asText(null));
        dto.setModel(item.path("Model").asText(null));
        dto.setDescription(item.path("Description").asText(null));
        dto.setQrToken(item.path("QrToken").asText(null));
        dto.setCurrentLocation(item.path("CurrentLocation").asText(null));
        dto.setCurrentHolderName(item.path("CurrentHolderName").asText(null));
        dto.setCurrentHolderEmail(item.path("CurrentHolderEmail").asText(null));
        dto.setSubmitterName(item.path("SubmitterName").asText(null));
        dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
        dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private InventoryItemDto mapFromPaResponse(Map<String, Object> map) {
        InventoryItemDto dto = new InventoryItemDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setTitle(str(map, "Title"));
        dto.setItemTypeName(str(map, "ItemType"));
        dto.setStatusName(str(map, "Status"));
        dto.setLocationName(str(map, "Location"));
        dto.setSerialNumber(str(map, "SerialNumber"));
        dto.setManufacturer(str(map, "Manufacturer"));
        dto.setModel(str(map, "Model"));
        dto.setDescription(str(map, "Description"));
        dto.setQrToken(str(map, "QrToken"));
        dto.setCurrentLocation(str(map, "CurrentLocation"));
        dto.setCurrentHolderName(str(map, "CurrentHolderName"));
        dto.setCurrentHolderEmail(str(map, "CurrentHolderEmail"));
        dto.setSubmitterName(str(map, "SubmitterName"));
        dto.setSubmitterEmail(str(map, "SubmitterEmail"));
        dto.setSubmitterPhone(str(map, "SubmitterPhone"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(InventoryItemDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getTitle()));
        map.put("ItemType", orEmpty(dto.getItemTypeName()));
        map.put("Status", orEmpty(dto.getStatusName()));
        map.put("Location", orEmpty(dto.getLocationName()));
        map.put("SerialNumber", orEmpty(dto.getSerialNumber()));
        map.put("Manufacturer", orEmpty(dto.getManufacturer()));
        map.put("Model", orEmpty(dto.getModel()));
        map.put("Description", orEmpty(dto.getDescription()));
        map.put("QrToken", orEmpty(dto.getQrToken()));
        map.put("CurrentLocation", orEmpty(dto.getCurrentLocation()));
        map.put("CurrentHolderName", orEmpty(dto.getCurrentHolderName()));
        map.put("CurrentHolderEmail", orEmpty(dto.getCurrentHolderEmail()));
        map.put("SubmitterName", orEmpty(dto.getSubmitterName()));
        map.put("SubmitterEmail", orEmpty(dto.getSubmitterEmail()));
        map.put("SubmitterPhone", orEmpty(dto.getSubmitterPhone()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[Inventory-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    private static String guessContentType(String fileName) {
        if (fileName == null) return "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}
