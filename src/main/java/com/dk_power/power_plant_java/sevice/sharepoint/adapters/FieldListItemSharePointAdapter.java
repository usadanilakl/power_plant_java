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

    /**
     * REMOVED — {@code changeStatus(spId, status)} used to send a partial payload with only
     * the Status column. The PA flow's Update item action maps every column, so a partial
     * payload had every un-included column set to null on SharePoint (Title/Location/etc.
     * silently wiped). Callers must now build a full {@link FieldListItemDto} from the
     * current entity state, mutate the status on the DTO, and call {@link #update} instead.
     * The Update item action's field mappings are safe when EVERY mapped column is present
     * in the request; only OMITTED columns were the wipe hazard.
     *
     * Same failure mode applies to Cert path — updateListItem replaces all specified columns
     * with the sent values, and PA-V2's flow-side merge doesn't reconstruct omitted columns.
     * If you need per-field partial updates in the future, either add merge-with-current in
     * the flow, or hit SP REST directly with MERGE semantics.
     */
    @SuppressWarnings("unused")
    private void changeStatus_removed(String sharepointId, String status) {
        throw new UnsupportedOperationException(
                "changeStatus removed — build full FieldListItemDto and call update(spId, dto)");
    }

    public List<PaAttachmentDto> getAttachments(String sharepointId) {
        return spService.executeWithFallback(
                () -> certGetAttachments(sharepointId),
                () -> paGetAttachments(sharepointId),
                "getAttachments FieldListItem"
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

    // certChangeStatus removed — see class javadoc for changeStatus_removed rationale.

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

    // paChangeStatus removed — see class javadoc for changeStatus_removed rationale.

    private List<PaAttachmentDto> paGetAttachments(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAttachments");
        req.setId(sharepointId);
        PaResponseDto resp = v2Client.fieldList(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAttachments FieldListItem failed: " + resp.getMessage());
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
        // Maximo picker fields (round-trip so cert path preserves them if PA also writes them).
        dto.setMaximoLocation(item.path("MaximoLocation").asText(null));
        dto.setMaximoAssetnum(item.path("MaximoAssetnum").asText(null));
        // Contractor-close signals — set by PWA→PA offline-close flow. Hub uses these
        // (via SharePointSyncable → ContractorClosed event) to trigger Maximo WO COMP.
        // ContractorCompleted (boolean) is the authoritative "is closed" flag; By/At are
        // attribution and may lag or be blank. Reading via helper handles the (rare) case
        // where the column arrives as a string "true"/"false" via PA rather than a real bool.
        dto.setContractorCompletedBy(item.path("ContractorCompletedBy").asText(null));
        dto.setContractorCompletedAt(item.path("ContractorCompletedAt").asText(null));
        dto.setContractorCompleted(isContractorCompleted(item));
        return dto;
    }

    /** True iff this SP-imported DTO indicates the contractor closed the item via PWA→PA. */
    public static boolean isContractorCompleted(JsonNode item) {
        if (item == null) return false;
        JsonNode v = item.path("ContractorCompleted");
        return v.asBoolean(false);
    }

    /** True iff this PA-map represents a contractor-completed item. */
    public static boolean isContractorCompleted(Map<String, Object> map) {
        if (map == null) return false;
        Object v = map.get("ContractorCompleted");
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return "true".equalsIgnoreCase(s);
        return false;
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
        dto.setMaximoLocation(str(map, "MaximoLocation"));
        dto.setMaximoAssetnum(str(map, "MaximoAssetnum"));
        dto.setContractorCompletedBy(str(map, "ContractorCompletedBy"));
        dto.setContractorCompletedAt(str(map, "ContractorCompletedAt"));
        dto.setContractorCompleted(isContractorCompleted(map));
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
        map.put("MaximoLocation", orEmpty(dto.getMaximoLocation()));
        map.put("MaximoAssetnum", orEmpty(dto.getMaximoAssetnum()));
        // ContractorCompleted* fields — conditional inclusion. Originally excluded from
        // hub-side toMap to avoid an admin edit accidentally wiping these to blank on SP.
        // Include them WHEN NON-NULL so the PWA insulation-complete flow (which runs
        // hub-side when online) can stamp the same markers the offline SP-direct path sets,
        // keeping the SP row consistent regardless of which path closed the item. A hub
        // edit that doesn't touch these fields leaves the DTO nulls → they don't ship →
        // existing SP values are preserved (the original wipe concern is still addressed).
        if (dto.getContractorCompletedBy() != null) map.put("ContractorCompletedBy", dto.getContractorCompletedBy());
        if (dto.getContractorCompletedAt() != null) map.put("ContractorCompletedAt", dto.getContractorCompletedAt());
        if (dto.getContractorCompleted() != null) map.put("ContractorCompleted", dto.getContractorCompleted());
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
