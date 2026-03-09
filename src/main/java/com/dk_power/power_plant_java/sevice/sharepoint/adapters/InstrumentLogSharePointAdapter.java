package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
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
public class InstrumentLogSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Instrumentation Log";

    public List<InstrumentLogDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll InstrumentationLogs"
        );
    }

    public String create(InstrumentLogDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create InstrumentationLog"
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
                    PaResponseDto resp = v2Client.instrumentLog(req);
                    if (!resp.isSuccess()) {
                        throw new RuntimeException(resp.getMessage());
                    }
                    return null;
                },
                "addAttachment InstrumentationLog"
        );
    }

    public List<PaAttachmentDto> getAttachments(String sharepointId) {
        return spService.executeWithFallback(
                () -> certGetAttachments(sharepointId),
                () -> paGetAttachments(sharepointId),
                "getAttachments InstrumentationLog"
        );
    }

    // ====================== Certificate path ======================

    private List<InstrumentLogDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(InstrumentLogDto dto) {
        Map<String, Object> body = toMap(dto);
        return certAccess.createListItem(LIST_TITLE, body);
    }

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

    // ====================== Power Automate path ======================

    private List<InstrumentLogDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setData(Map.of());
        PaResponseDto resp = v2Client.instrumentLog(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll InstrumentationLog failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(InstrumentLogDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.instrumentLog(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create InstrumentationLog failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private List<PaAttachmentDto> paGetAttachments(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAttachments");
        req.setId(sharepointId);
        req.setData(Map.of());
        PaResponseDto resp = v2Client.instrumentLog(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAttachments InstrumentationLog failed: " + resp.getMessage());
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

    private InstrumentLogDto mapFromSharePoint(JsonNode item) {
        InstrumentLogDto dto = new InstrumentLogDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setInstrumentTagNumber(item.path("Tag_x0020_Number").asText(item.path("Tag Number").asText(null)));
        dto.setInstrumentDescription(item.path("Description").asText(null));
        dto.setStatus(item.path("Status").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setName(item.path("Name").asText(null));
        dto.setComment(item.path("Comment").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private InstrumentLogDto mapFromPaResponse(Map<String, Object> map) {
        InstrumentLogDto dto = new InstrumentLogDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setInstrumentTagNumber(str(map, "Tag_x0020_Number"));
        dto.setInstrumentDescription(str(map, "Description"));
        dto.setStatus(str(map, "Status"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setName(str(map, "Name"));
        dto.setComment(str(map, "Comment"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(InstrumentLogDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Tag_x0020_Number", orEmpty(dto.getInstrumentTagNumber()));
        map.put("Description", orEmpty(dto.getInstrumentDescription()));
        map.put("Status", orEmpty(dto.getStatus()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("Name", orEmpty(dto.getName()));
        map.put("Comment", orEmpty(dto.getComment()));
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[InstrumentLog-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
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
