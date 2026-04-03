package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
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
public class ExcavationPermitSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Excavation Permits";

    public List<ExcavationPermitDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll ExcavationPermits");
    }

    public List<ExcavationPermitDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter),
                this::paGetAll,  // PA fallback doesn't support filtering
                "getModifiedSince ExcavationPermits"
        );
    }

    private List<ExcavationPermitDto> certGetFiltered(String filter) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE, filter);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    public String create(ExcavationPermitDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create ExcavationPermit");
    }

    public void update(String sharepointId, ExcavationPermitDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update ExcavationPermit");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.excavation(req); return null; },
                "changeStatus ExcavationPermit");
    }

    // ====================== Certificate path ======================

    private List<ExcavationPermitDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(ExcavationPermitDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, ExcavationPermitDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<ExcavationPermitDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.excavation(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll ExcavationPermits failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(ExcavationPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.excavation(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create ExcavationPermit failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, ExcavationPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.excavation(req);
        if (!resp.isSuccess()) log.error("[EXC-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private ExcavationPermitDto mapFromSharePoint(JsonNode item) {
        ExcavationPermitDto dto = new ExcavationPermitDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setIssuedTo(item.path("IssuedTo").asText(null));
        dto.setSupervisor(item.path("Supervisor").asText(null));
        dto.setJobLocation(item.path("JobLocation").asText(null));
        dto.setSupervisorPhone(item.path("SupervisorPhone").asText(null));
        dto.setExcavationDescription(item.path("ExcavationDescription").asText(null));
        dto.setWorkOrder(item.path("WorkOrder").asText(null));
        dto.setLocationPipingMarked(item.path("LocationPipingMarked").asBoolean(false));
        dto.setFacilityName(item.path("FacilityName").asText(null));
        dto.setCompetentPerson(item.path("CompetentPerson").asText(null));
        dto.setSoilType(item.path("SoilType").asText(null));
        dto.setExcavationDepth(item.path("ExcavationDepth").asText(null));
        dto.setExcavationWidth(item.path("ExcavationWidth").asText(null));
        dto.setProtectiveSystemType(item.path("ProtectiveSystemType").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private ExcavationPermitDto mapFromPaResponse(Map<String, Object> map) {
        ExcavationPermitDto dto = new ExcavationPermitDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setIssuedTo(str(map, "IssuedTo"));
        dto.setSupervisor(str(map, "Supervisor"));
        dto.setJobLocation(str(map, "JobLocation"));
        dto.setSupervisorPhone(str(map, "SupervisorPhone"));
        dto.setExcavationDescription(str(map, "ExcavationDescription"));
        dto.setWorkOrder(str(map, "WorkOrder"));
        dto.setLocationPipingMarked("true".equalsIgnoreCase(str(map, "LocationPipingMarked")));
        dto.setFacilityName(str(map, "FacilityName"));
        dto.setCompetentPerson(str(map, "CompetentPerson"));
        dto.setSoilType(str(map, "SoilType"));
        dto.setExcavationDepth(str(map, "ExcavationDepth"));
        dto.setExcavationWidth(str(map, "ExcavationWidth"));
        dto.setProtectiveSystemType(str(map, "ProtectiveSystemType"));
        return dto;
    }

    private Map<String, Object> toMap(ExcavationPermitDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("IssuedTo", orEmpty(dto.getIssuedTo()));
        map.put("Supervisor", orEmpty(dto.getSupervisor()));
        map.put("JobLocation", orEmpty(dto.getJobLocation()));
        map.put("SupervisorPhone", orEmpty(dto.getSupervisorPhone()));
        map.put("ExcavationDescription", orEmpty(dto.getExcavationDescription()));
        map.put("WorkOrder", orEmpty(dto.getWorkOrder()));
        map.put("LocationPipingMarked", dto.getLocationPipingMarked());
        map.put("FacilityName", orEmpty(dto.getFacilityName()));
        map.put("CompetentPerson", orEmpty(dto.getCompetentPerson()));
        map.put("SoilType", orEmpty(dto.getSoilType()));
        map.put("ExcavationDepth", orEmpty(dto.getExcavationDepth()));
        map.put("ExcavationWidth", orEmpty(dto.getExcavationWidth()));
        map.put("ProtectiveSystemType", orEmpty(dto.getProtectiveSystemType()));
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[EXC-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
