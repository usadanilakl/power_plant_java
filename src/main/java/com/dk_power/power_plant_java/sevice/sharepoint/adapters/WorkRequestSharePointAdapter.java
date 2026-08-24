package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils;
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
public class WorkRequestSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Work Requests";

    public List<WorkRequestDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll WorkRequests"
        );
    }

    public List<WorkRequestDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll, // PA fallback doesn't support filtering
                "getModifiedSince WorkRequests"
        );
    }

    /**
     * The SharePoint item carrying this PWA id, or null.
     *
     * <p>Submit used to answer this by pulling the WHOLE list and scanning it in memory — once per
     * submission, on the hub, on the request thread. The certificate path can answer it with a
     * one-row $filter; only the Power Automate fallback, which has no filtering, still has to scan.
     */
    public WorkRequestDto findByLocalUuid(String localUuid) {
        if (localUuid == null || localUuid.isBlank()) return null;
        String escaped = localUuid.replace("'", "''");
        String filter = "PwaId eq '" + escaped + "'";
        List<WorkRequestDto> matches = spService.executeWithFallback(
                () -> certGetFiltered(filter),
                () -> paGetAll().stream()
                        .filter(wr -> localUuid.equals(wr.getLocalUuid()))
                        .collect(Collectors.toList()),
                "findByLocalUuid WorkRequest"
        );
        return matches == null || matches.isEmpty() ? null : matches.get(0);
    }

    private List<WorkRequestDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(WorkRequestDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create WorkRequest"
        );
    }

    public void archive(String sharepointId) {
        changeStatus(sharepointId, "Archived");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certChangeStatus(sharepointId, status); return null; },
                () -> { paChangeStatus(sharepointId, status); return null; },
                "changeWorkRequestStatus"
        );
    }

    public void revoke(String sharepointId) {
        changeStatus(sharepointId, "Revoked");
    }

    public void update(String sharepointId, WorkRequestDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update WorkRequest"
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
                    v2Client.workRequest(req);
                    return null;
                },
                "addAttachment WorkRequest"
        );
    }

    public List<PaAttachmentDto> getAttachments(String sharepointId) {
        return spService.executeWithFallback(
                () -> certGetAttachments(sharepointId),
                () -> paGetAttachments(sharepointId),
                "getAttachments WorkRequest"
        );
    }

    // ====================== Certificate path ======================

    private List<WorkRequestDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(WorkRequestDto dto) {
        Map<String, Object> body = workRequestToMap(dto, true);
        return certAccess.createListItem(LIST_TITLE, body);
    }

    private void certChangeStatus(String sharepointId, String status) {
        Map<String, Object> body = Map.of("Status", status);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
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

    private void certUpdate(String sharepointId, WorkRequestDto dto) {
        Map<String, Object> body = workRequestToMap(dto, true);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    // ====================== Power Automate path ======================

    private void paUpdate(String sharepointId, WorkRequestDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(workRequestToMap(dto, false));
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess()) {
            log.error("[WR-Adapter] PA full update failed: {}", resp.getMessage());
        }
    }

    private List<WorkRequestDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll WorkRequests failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(WorkRequestDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(workRequestToMap(dto, false));
        req.setAttachments(Collections.emptyList());
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create WorkRequest failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paChangeStatus(String sharepointId, String status) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(Map.of("Status", status));
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess()) {
            log.error("[WR-Adapter] PA update status to '{}' failed: {}", status, resp.getMessage());
        }
    }

    private List<PaAttachmentDto> paGetAttachments(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAttachments");
        req.setId(sharepointId);
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAttachments WorkRequest failed: " + resp.getMessage());
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

    private WorkRequestDto mapFromSharePoint(JsonNode item) {
        WorkRequestDto dto = new WorkRequestDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        String rawDateOfWork = item.path("DateOfWork").asText(null);
        String[] centralDateAndTime = fromSharePointDateTime(rawDateOfWork);
        dto.setDateOfWorkToBePerformed(centralDateAndTime[0]);
        dto.setTimeOfWorkToBePerformed(centralDateAndTime[1]);
        dto.setRequestedBy(item.path("WorkRequestedBy").asText(null));
        dto.setCompany(item.path("Company").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setAffectedEquipment(item.path("AffectedEquipment").asText(null));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setBooleanIsLotoRequired(item.path("IsLOTORequired").asBoolean(false));
        dto.setBooleanIsHotWorkRequired(item.path("IsHotWorkRequired").asBoolean(false));
        dto.setBooleanIsConfinedSpaceEntryRequired(item.path("IsConfinedSpaceEntryRequired").asBoolean(false));
        dto.setForeman(item.path("ForemanName").asText(null));
        dto.setFireWatch(item.path("FireWatchName").asText(null));
        dto.setSpace(item.path("SpaceToBeEntered").asText(null));
        dto.setStatus(item.path("Status").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setSubmitterName(item.path("SubmitterName").asText(null));
        dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
        dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
        dto.setSubmitterCompany(item.path("SubmitterCompany").asText(null));
        dto.setTimeSubmitted(item.path("TimeSubmitted").asText(null));
        dto.setWorkCategoryName(item.path("MainWorkScope").asText(null));
        dto.setWorkAreaName(item.path("WorkAreaName").asText(null));
        dto.setDeclaredHazards(item.path("DeclaredHazards").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private WorkRequestDto mapFromPaResponse(Map<String, Object> map) {
        WorkRequestDto dto = new WorkRequestDto();
        String dateTime = str(map, "DateOfWork");
        String[] centralDateAndTime = fromSharePointDateTime(dateTime);
        dto.setDateOfWorkToBePerformed(centralDateAndTime[0]);
        dto.setTimeOfWorkToBePerformed(centralDateAndTime[1] != null ? centralDateAndTime[1] : "");
        dto.setRequestedBy(str(map, "WorkRequestedBy"));
        dto.setCompany(str(map, "Company"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setAffectedEquipment(str(map, "AffectedEquipment"));
        dto.setWorkScope(str(map, "WorkScope"));
        dto.setIsLotoRequired(str(map, "IsLOTORequired"));
        dto.setIsHotWorkRequired(str(map, "IsHotWorkRequired"));
        dto.setIsConfinedSpaceEntryRequired(str(map, "IsConfinedSpaceEntryRequired"));
        dto.setForeman(str(map, "ForemanName"));
        dto.setFireWatch(str(map, "FireWatchName"));
        dto.setSpace(str(map, "SpaceToBeEntered"));
        dto.setSharepointId(str(map, "ID"));
        dto.setStatus(str(map, "Status"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setWorkCategoryName(str(map, "MainWorkScope"));
        dto.setWorkAreaName(str(map, "WorkAreaName"));
        dto.setDeclaredHazards(str(map, "DeclaredHazards"));
        return dto;
    }

    /**
     * Convert WorkRequestDto to SharePoint column map.
     * @param useCentralTime true for cert (Central ISO), false for PA (UTC ISO)
     */
    private Map<String, Object> workRequestToMap(WorkRequestDto dto, boolean useCentralTime) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("DateOfWork", useCentralTime
                ? toCentralIso(dto.getDateOfWorkToBePerformed(), dto.getTimeOfWorkToBePerformed())
                : toUtcIso(dto.getDateOfWorkToBePerformed(), dto.getTimeOfWorkToBePerformed()));
        map.put("WorkRequestedBy", orEmpty(dto.getRequestedBy()));
        map.put("Company", orEmpty(dto.getCompany()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("AffectedEquipment", orEmpty(dto.getAffectedEquipment()));
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("WorkScope", orEmpty(dto.getWorkScope()));
        map.put("IsLOTORequired", Boolean.TRUE.equals(dto.getIsLotoRequired()));
        map.put("IsHotWorkRequired", Boolean.TRUE.equals(dto.getIsHotWorkRequired()));
        map.put("IsConfinedSpaceEntryRequired", Boolean.TRUE.equals(dto.getIsConfinedSpaceEntryRequired()));
        map.put("ForemanName", orEmpty(dto.getForeman()));
        map.put("FireWatchName", orEmpty(dto.getFireWatch()));
        map.put("SpaceToBeEntered", orEmpty(dto.getSpace()));
        map.put("Status", dto.getStatus() != null ? dto.getStatus() : "Active");
        map.put("SubmitterName", orEmpty(dto.getSubmitterName()));
        map.put("SubmitterEmail", orEmpty(dto.getSubmitterEmail()));
        map.put("SubmitterPhone", orEmpty(dto.getSubmitterPhone()));
        map.put("SubmitterCompany", orEmpty(dto.getSubmitterCompany()));
        map.put("TimeSubmitted", orEmpty(dto.getTimeSubmitted()));
        map.put("MainWorkScope", orEmpty(dto.getWorkCategoryName()));
        map.put("WorkAreaName", orEmpty(dto.getWorkAreaName()));
        map.put("DeclaredHazards", orEmpty(dto.getDeclaredHazards()));
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[WR-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
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
