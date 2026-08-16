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

    private static final String TAG_FIELD_ENCODED = "Tag_x0020_Number";
    private static final String TAG_FIELD_PLAIN = "TagNumber";

    /**
     * Which internal name this tenant's "Instrumentation Log" list actually uses for the tag column.
     *
     * The register list ("Instrumentation") uses the space-encoded {@code Tag_x0020_Number}, but the
     * log list on the live tenant was created with a plain {@code TagNumber}. The retry below already
     * recovered from that — at the cost of a rejected 400 round-trip and a logged ERROR on *every*
     * submission. Latching the name the list actually accepted turns that into a one-off discovery.
     */
    private volatile String resolvedTagField = TAG_FIELD_ENCODED;

    public List<InstrumentLogDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll InstrumentationLogs"
        );
    }

    public List<InstrumentLogDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,  // PA fallback doesn't support filtering
                "getModifiedSince InstrumentationLogs"
        );
    }

    private List<InstrumentLogDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(InstrumentLogDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create InstrumentationLog"
        );
    }

    /**
     * Deletes a log item. SharePoint routes REST deletes to the site Recycle Bin, so this is
     * recoverable for the site's retention window rather than immediate destruction. No Power
     * Automate fallback: the flow has no delete case, and silently doing nothing would be worse than
     * failing loudly on a delete.
     */
    public void delete(String sharepointId) {
        certAccess.deleteListItem(LIST_TITLE, sharepointId);
        log.info("[InstrumentLog-Adapter] Deleted log item {} from '{}'", sharepointId, LIST_TITLE);
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
        String attempted = resolvedTagField;
        try {
            return certAccess.createListItem(LIST_TITLE, toMapWithTagField(dto, attempted));
        } catch (RuntimeException ex) {
            // Some environments have different internal names for "Tag Number" in Instrumentation Log.
            if (isMissingTagFieldError(ex)) {
                String alternate = TAG_FIELD_ENCODED.equals(attempted) ? TAG_FIELD_PLAIN : TAG_FIELD_ENCODED;
                log.warn("[InstrumentLog-Adapter] '{}' rejected field {}. Retrying with {} and latching it for "
                                + "subsequent writes.", LIST_TITLE, attempted, alternate);
                String id = certAccess.createListItem(LIST_TITLE, toMapWithTagField(dto, alternate));
                resolvedTagField = alternate;
                return id;
            }
            throw ex;
        }
    }

    /**
     * Human-readable Title so a log is identifiable straight from a SharePoint list view:
     * {@code 01MBH02AA711S12 — In Progress (2026-08-14 19:09)}.
     */
    private String buildTitle(InstrumentLogDto dto) {
        StringBuilder title = new StringBuilder(orEmpty(dto.getInstrumentTagNumber()));
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            title.append(" — ").append(dto.getStatus().trim());
        }
        String when = (orEmpty(dto.getDate()) + " " + orEmpty(dto.getTime())).trim();
        if (!when.isEmpty()) {
            title.append(" (").append(when).append(")");
        }
        String result = title.toString().trim();
        return result.isEmpty() ? "Instrument log" : result;
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
        dto.setInstrumentTagNumber(firstNonBlank(
                item.path("Tag_x0020_Number").asText(null),
                item.path("TagNumber").asText(null),
                item.path("Tag Number").asText(null)
        ));
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
        dto.setInstrumentTagNumber(firstNonBlank(
                str(map, "Tag_x0020_Number"),
                str(map, "TagNumber"),
                str(map, "Tag Number")
        ));
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
        return toMapWithTagField(dto, resolvedTagField);
    }

    private Map<String, Object> toMapWithTagField(InstrumentLogDto dto, String tagFieldName) {
        Map<String, Object> map = new LinkedHashMap<>();
        // Title is the column SharePoint shows as the item link in every default list view. Left
        // unset it renders as a blank row that can only be identified by opening it.
        map.put("Title", buildTitle(dto));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put(tagFieldName, orEmpty(dto.getInstrumentTagNumber()));
        map.put("Description", orEmpty(dto.getInstrumentDescription()));
        map.put("Status", orEmpty(dto.getStatus()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("Name", orEmpty(dto.getName()));
        map.put("Comment", orEmpty(dto.getComment()));
        return map;
    }

    private boolean isMissingTagFieldError(Exception ex) {
        String msg = ex.getMessage();
        return msg != null
                && msg.contains("Tag_x0020_Number")
                && msg.contains("does not exist");
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

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
