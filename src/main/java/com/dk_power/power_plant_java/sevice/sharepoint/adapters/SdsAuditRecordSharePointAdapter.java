package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
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
public class SdsAuditRecordSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "SDS Audit";

    public List<SdsAuditRecordDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll SDS Audit");
    }

    public List<SdsAuditRecordDto> getModifiedSince(Instant since) {
        String filter = "Modified gt datetime'" + since.toString() + "'";
        return spService.executeWithFallback(
                () -> certGetFiltered(filter), this::paGetAll, "getModifiedSince SDS Audit");
    }

    public String create(SdsAuditRecordDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create SdsAuditRecord");
    }

    // ====================== Certificate path ======================

    private List<SdsAuditRecordDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private List<SdsAuditRecordDto> certGetFiltered(String filter) {
        return certAccess.getListItems(LIST_TITLE, filter).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(SdsAuditRecordDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<SdsAuditRecordDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setEntity("audit");
        req.setData(Map.of());
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll SDS Audit failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(SdsAuditRecordDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setEntity("audit");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.sds(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create SDS Audit failed: " + resp.getMessage());
        return resp.getId();
    }

    // ====================== Column mapping ======================

    private SdsAuditRecordDto mapFromSharePoint(JsonNode item) {
        SdsAuditRecordDto dto = new SdsAuditRecordDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setChemicalSharepointId(item.path("ChemicalSpId").asText(null));
        dto.setChemicalLocalUuid(item.path("ChemicalLocalUuid").asText(null));
        dto.setChemicalName(item.path("ChemicalName").asText(null));
        dto.setAction(item.path("Action").asText(null));
        dto.setOldSnapshot(item.path("OldSnapshot").asText(null));
        dto.setAuditedByName(item.path("AuditedByName").asText(null));
        dto.setAuditedByEmail(item.path("AuditedByEmail").asText(null));
        dto.setAuditedAt(parseInstant(item.path("AuditedAt").asText(null)));
        dto.setComments(item.path("Comments").asText(null));
        dto.setCampaign(item.path("Campaign").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private SdsAuditRecordDto mapFromPaResponse(Map<String, Object> map) {
        SdsAuditRecordDto dto = new SdsAuditRecordDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setChemicalSharepointId(str(map, "ChemicalSpId"));
        dto.setChemicalLocalUuid(str(map, "ChemicalLocalUuid"));
        dto.setChemicalName(str(map, "ChemicalName"));
        dto.setAction(str(map, "Action"));
        dto.setOldSnapshot(str(map, "OldSnapshot"));
        dto.setAuditedByName(str(map, "AuditedByName"));
        dto.setAuditedByEmail(str(map, "AuditedByEmail"));
        dto.setAuditedAt(parseInstant(str(map, "AuditedAt")));
        dto.setComments(str(map, "Comments"));
        dto.setCampaign(str(map, "Campaign"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(SdsAuditRecordDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getChemicalName()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("ChemicalSpId", orEmpty(dto.getChemicalSharepointId()));
        map.put("ChemicalLocalUuid", orEmpty(dto.getChemicalLocalUuid()));
        map.put("ChemicalName", orEmpty(dto.getChemicalName()));
        map.put("Action", orEmpty(dto.getAction()));
        map.put("OldSnapshot", orEmpty(dto.getOldSnapshot()));
        map.put("AuditedByName", orEmpty(dto.getAuditedByName()));
        map.put("AuditedByEmail", orEmpty(dto.getAuditedByEmail()));
        map.put("AuditedAt", dto.getAuditedAt() != null ? dto.getAuditedAt().toString() : "");
        map.put("Comments", orEmpty(dto.getComments()));
        map.put("Campaign", orEmpty(dto.getCampaign()));
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            return null;
        }
    }
}
