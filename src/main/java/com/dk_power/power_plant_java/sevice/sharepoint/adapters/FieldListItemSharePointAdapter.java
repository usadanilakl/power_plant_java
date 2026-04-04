package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
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
public class FieldListItemSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Field Lists";

    public List<FieldListItemDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll FieldLists"
        );
    }

    public List<FieldListItemDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,
                "getModifiedSince FieldLists"
        );
    }

    public String create(FieldListItemDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create FieldListItem"
        );
    }

    public void update(String sharepointId, FieldListItemDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update FieldListItem"
        );
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certChangeStatus(sharepointId, status); return null; },
                () -> { paChangeStatus(sharepointId, status); return null; },
                "changeStatus FieldListItem"
        );
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
                    v2Client.fieldList(req);
                    return null;
                },
                "addAttachment FieldListItem"
        );
    }

    // ====================== Certificate path ======================

    private List<FieldListItemDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private List<FieldListItemDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(FieldListItemDto dto) {
        Map<String, Object> body = toMap(dto);
        return certAccess.createListItem(LIST_TITLE, body);
    }

    private void certUpdate(String sharepointId, FieldListItemDto dto) {
        Map<String, Object> body = toMap(dto);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    private void certChangeStatus(String sharepointId, String status) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Status", status);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    // ====================== Power Automate path ======================

    private List<FieldListItemDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setData(Map.of());

        PaResponseDto resp = v2Client.fieldList(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll FieldLists failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(FieldListItemDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.fieldList(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create FieldListItem failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paUpdate(String sharepointId, FieldListItemDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.fieldList(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 update FieldListItem failed: " + resp.getMessage());
        }
    }

    private void paChangeStatus(String sharepointId, String status) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(Map.of("Status", status));
        PaResponseDto resp = v2Client.fieldList(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 changeStatus FieldListItem failed: " + resp.getMessage());
        }
    }

    // ====================== Column mapping ======================

    private FieldListItemDto mapFromSharePoint(JsonNode item) {
        FieldListItemDto dto = new FieldListItemDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setTitle(item.path("Title").asText(null));
        dto.setListTypeName(item.path("ListType").asText(null));
        dto.setStatusName(item.path("Status").asText(null));
        dto.setLocationName(item.path("Location").asText(null));
        dto.setSpecificLocation(item.path("SpecificLocation").asText(null));
        dto.setNotes(item.path("Notes").asText(null));
        String rawDateObserved = item.path("DateObserved").asText(null);
        String[] dateAndTime = fromSharePointDateTime(rawDateObserved);
        dto.setDateObserved(dateAndTime[0]);
        dto.setTimeObserved(dateAndTime[1]);
        dto.setEquipmentTag(item.path("EquipmentTag").asText(null));
        dto.setSubmitterName(item.path("SubmitterName").asText(null));
        dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
        dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private FieldListItemDto mapFromPaResponse(Map<String, Object> map) {
        FieldListItemDto dto = new FieldListItemDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setTitle(str(map, "Title"));
        dto.setListTypeName(str(map, "ListType"));
        dto.setStatusName(str(map, "Status"));
        dto.setLocationName(str(map, "Location"));
        dto.setSpecificLocation(str(map, "SpecificLocation"));
        dto.setNotes(str(map, "Notes"));
        String dateTime = str(map, "DateObserved");
        String[] dateAndTime = fromSharePointDateTime(dateTime);
        dto.setDateObserved(dateAndTime[0]);
        dto.setTimeObserved(dateAndTime[1] != null ? dateAndTime[1] : "");
        dto.setEquipmentTag(str(map, "EquipmentTag"));
        dto.setSubmitterName(str(map, "SubmitterName"));
        dto.setSubmitterEmail(str(map, "SubmitterEmail"));
        dto.setSubmitterPhone(str(map, "SubmitterPhone"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(FieldListItemDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getTitle()));
        map.put("ListType", orEmpty(dto.getListTypeName()));
        map.put("Status", orEmpty(dto.getStatusName()));
        map.put("Location", orEmpty(dto.getLocationName()));
        map.put("SpecificLocation", orEmpty(dto.getSpecificLocation()));
        map.put("Notes", orEmpty(dto.getNotes()));
        map.put("DateObserved", toCentralIso(dto.getDateObserved(), dto.getTimeObserved()));
        map.put("EquipmentTag", orEmpty(dto.getEquipmentTag()));
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
            log.warn("[FieldList-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
            return null;
        }
    }
}
