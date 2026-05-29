package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.orEmpty;
import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.str;

@Slf4j
@Service
@RequiredArgsConstructor
public class SdsChemicalSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "SDS";

    public List<SdsChemicalDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll SDS");
    }

    public List<SdsChemicalDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,
                "getModifiedSince SDS");
    }

    public String create(SdsChemicalDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create SdsChemical");
    }

    public void update(String sharepointId, SdsChemicalDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update SdsChemical");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certChangeStatus(sharepointId, status); return null; },
                () -> { paChangeStatus(sharepointId, status); return null; },
                "changeStatus SdsChemical");
    }

    /** Hard-delete the SharePoint list item (used when a chemical is deleted as a mistake). */
    public void delete(String sharepointId) {
        spService.executeWithFallback(
                () -> { certAccess.deleteListItem(LIST_TITLE, sharepointId); return null; },
                () -> { paDelete(sharepointId); return null; },
                "delete SdsChemical");
    }

    public List<PaAttachmentDto> getAttachments(String sharepointId) {
        return spService.executeWithFallback(
                () -> certGetAttachments(sharepointId),
                () -> paGetAttachments(sharepointId),
                "getAttachments SdsChemical");
    }

    public void addAttachment(String sharepointId, PaAttachmentDto attachment) {
        spService.executeWithFallback(
                () -> { certAccess.addListItemAttachment(LIST_TITLE, sharepointId, attachment.getFileName(),
                        Base64.getDecoder().decode(attachment.getBase64Content())); return null; },
                () -> {
                    PaRequestDto req = new PaRequestDto();
                    req.setActionType("addAttachment");
                    req.setEntity("chemical");
                    req.setId(sharepointId);
                    req.setData(Map.of());
                    req.setAttachments(List.of(attachment));
                    v2Client.sds(req);
                    return null;
                },
                "addAttachment SdsChemical");
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

    private List<SdsChemicalDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private List<SdsChemicalDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(SdsChemicalDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, SdsChemicalDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    private void certChangeStatus(String sharepointId, String status) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Status", status);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    // ====================== Power Automate path ======================

    private List<SdsChemicalDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setEntity("chemical");
        req.setData(Map.of());

        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll SDS failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(SdsChemicalDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setEntity("chemical");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create SDS failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, SdsChemicalDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setEntity("chemical");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 update SDS failed: " + resp.getMessage());
    }

    private void paChangeStatus(String sharepointId, String status) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setEntity("chemical");
        req.setId(sharepointId);
        req.setData(Map.of("Status", status));
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 changeStatus SDS failed: " + resp.getMessage());
    }

    private void paDelete(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("delete");
        req.setEntity("chemical");
        req.setId(sharepointId);
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 delete SDS failed: " + resp.getMessage());
    }

    private List<PaAttachmentDto> paGetAttachments(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAttachments");
        req.setEntity("chemical");
        req.setId(sharepointId);
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAttachments SDS failed: " + resp.getMessage());
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

    private SdsChemicalDto mapFromSharePoint(JsonNode item) {
        SdsChemicalDto dto = new SdsChemicalDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setNames(item.path("Names").asText(null));
        dto.setLocations(item.path("Locations").asText(null));
        dto.setStatusName(item.path("Status").asText(null));
        dto.setBookNumber(parseInteger(item.path("BookNumber").asText(null)));
        dto.setSectionNumber(parseInteger(item.path("Section").asText(null)));
        dto.setNotes(item.path("Notes").asText(null));
        dto.setProcessedByName(item.path("ProcessedByName").asText(null));
        dto.setProcessedByEmail(item.path("ProcessedByEmail").asText(null));
        dto.setSubmitterName(item.path("SubmitterName").asText(null));
        dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
        dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private SdsChemicalDto mapFromPaResponse(Map<String, Object> map) {
        SdsChemicalDto dto = new SdsChemicalDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setNames(str(map, "Names"));
        dto.setLocations(str(map, "Locations"));
        dto.setStatusName(str(map, "Status"));
        dto.setBookNumber(parseInteger(str(map, "BookNumber")));
        dto.setSectionNumber(parseInteger(str(map, "Section")));
        dto.setNotes(str(map, "Notes"));
        dto.setProcessedByName(str(map, "ProcessedByName"));
        dto.setProcessedByEmail(str(map, "ProcessedByEmail"));
        dto.setSubmitterName(str(map, "SubmitterName"));
        dto.setSubmitterEmail(str(map, "SubmitterEmail"));
        dto.setSubmitterPhone(str(map, "SubmitterPhone"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(SdsChemicalDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(SdsChemicalMapper.primaryName(dto.getNames())));
        map.put("Names", orEmpty(dto.getNames()));
        map.put("Locations", orEmpty(dto.getLocations()));
        map.put("Status", orEmpty(dto.getStatusName()));
        map.put("BookNumber", dto.getBookNumber() != null ? dto.getBookNumber().toString() : "");
        map.put("Section", dto.getSectionNumber() != null ? dto.getSectionNumber().toString() : "");
        map.put("Notes", orEmpty(dto.getNotes()));
        map.put("ProcessedByName", orEmpty(dto.getProcessedByName()));
        map.put("ProcessedByEmail", orEmpty(dto.getProcessedByEmail()));
        map.put("SubmitterName", orEmpty(dto.getSubmitterName()));
        map.put("SubmitterEmail", orEmpty(dto.getSubmitterEmail()));
        map.put("SubmitterPhone", orEmpty(dto.getSubmitterPhone()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        return map;
    }

    private static Integer parseInteger(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[SDS-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
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
