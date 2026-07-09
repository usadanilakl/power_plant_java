package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDefinitionDto;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.orEmpty;
import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.str;

@Slf4j
@Service
@RequiredArgsConstructor
public class QualificationDefinitionSharePointAdapter {

    public static final String LIST_TITLE = "Qualification Catalog";

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    public List<PwaQualificationDefinitionDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll QualificationCatalog");
    }

    public PwaQualificationDefinitionDto getByPwaId(String pwaId) {
        List<PwaQualificationDefinitionDto> items = spService.executeWithFallback(
                () -> certGetByPwaId(pwaId),
                () -> paGetByPwaId(pwaId),
                "getByPwaId QualificationCatalog");
        return items.isEmpty() ? null : items.getFirst();
    }

    public String create(PwaQualificationDefinitionDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create QualificationCatalog");
    }

    public void update(String sharepointId, PwaQualificationDefinitionDto dto) {
        spService.executeWithFallback(
                () -> {
                    certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
                    return null;
                },
                () -> {
                    paUpdate(sharepointId, dto);
                    return null;
                },
                "update QualificationCatalog");
    }

    public void delete(String sharepointId) {
        spService.executeWithFallback(
                () -> {
                    certAccess.deleteListItem(LIST_TITLE, sharepointId);
                    return null;
                },
                () -> {
                    paDelete(sharepointId);
                    return null;
                },
                "delete QualificationCatalog");
    }

    private List<PwaQualificationDefinitionDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private List<PwaQualificationDefinitionDto> certGetByPwaId(String pwaId) {
        String filter = "PwaId eq '" + odata(pwaId) + "'";
        return certAccess.getListItems(LIST_TITLE, filter).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private String certCreate(PwaQualificationDefinitionDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private List<PwaQualificationDefinitionDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("catalogGetAll");
        req.setData(Map.of());
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 catalogGetAll failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private List<PwaQualificationDefinitionDto> paGetByPwaId(String pwaId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("catalogGetByPwaId");
        req.setId(pwaId);
        req.setData(Map.of("PwaId", pwaId));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 catalogGetByPwaId failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(PwaQualificationDefinitionDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("catalogCreate");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 catalogCreate failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paUpdate(String sharepointId, PwaQualificationDefinitionDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("catalogUpdate");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 catalogUpdate failed: " + resp.getMessage());
        }
    }

    private void paDelete(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("catalogDelete");
        req.setId(sharepointId);
        req.setData(Map.of());
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 catalogDelete failed: " + resp.getMessage());
        }
    }

    private PwaQualificationDefinitionDto mapFromSharePoint(JsonNode item) {
        PwaQualificationDefinitionDto dto = new PwaQualificationDefinitionDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setQualificationCode(item.path("QualificationCode").asText(null));
        dto.setQualificationName(item.path("QualificationName").asText(item.path("Title").asText(null)));
        dto.setQualificationType(item.path("QualificationType").asText(null));
        dto.setDescription(item.path("Description").asText(null));
        dto.setRequiresExpiration(bool(item.path("RequiresExpiration"), false));
        dto.setDefaultValidityMonths(item.path("DefaultValidityMonths").asText(null));
        dto.setActive(bool(item.path("IsActive"), true));
        dto.setSortOrder(item.path("SortOrder").asText(null));
        dto.setNotes(item.path("Notes").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private PwaQualificationDefinitionDto mapFromPaResponse(Map<String, Object> map) {
        PwaQualificationDefinitionDto dto = new PwaQualificationDefinitionDto();
        dto.setSharepointId(firstNonBlank(str(map, "ID"), str(map, "Id")));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setQualificationCode(str(map, "QualificationCode"));
        dto.setQualificationName(firstNonBlank(str(map, "QualificationName"), str(map, "Title")));
        dto.setQualificationType(str(map, "QualificationType"));
        dto.setDescription(str(map, "Description"));
        dto.setRequiresExpiration(bool(map.get("RequiresExpiration"), false));
        dto.setDefaultValidityMonths(str(map, "DefaultValidityMonths"));
        dto.setActive(bool(firstNonNull(map.get("IsActive"), map.get("Active")), true));
        dto.setSortOrder(str(map, "SortOrder"));
        dto.setNotes(str(map, "Notes"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(PwaQualificationDefinitionDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", firstNonBlank(dto.getQualificationName(), dto.getQualificationCode(), "Qualification"));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("QualificationCode", orEmpty(dto.getQualificationCode()));
        map.put("QualificationName", orEmpty(dto.getQualificationName()));
        map.put("QualificationType", orEmpty(dto.getQualificationType()));
        map.put("Description", orEmpty(dto.getDescription()));
        map.put("RequiresExpiration", Boolean.TRUE.equals(dto.getRequiresExpiration()));
        map.put("DefaultValidityMonths", orEmpty(dto.getDefaultValidityMonths()));
        map.put("IsActive", !Boolean.FALSE.equals(dto.getActive()));
        map.put("SortOrder", orEmpty(dto.getSortOrder()));
        map.put("Notes", orEmpty(dto.getNotes()));
        return map;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private static Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) return value;
        }
        return null;
    }

    private static Boolean bool(JsonNode node, boolean defaultValue) {
        if (node == null || node.isMissingNode() || node.isNull()) return defaultValue;
        if (node.isBoolean()) return node.asBoolean();
        if (node.isNumber()) return node.asInt() != 0;
        return bool(node.asText(null), defaultValue);
    }

    private static Boolean bool(Object raw, boolean defaultValue) {
        if (raw == null) return defaultValue;
        if (raw instanceof Boolean bool) return bool;
        if (raw instanceof Number number) return number.intValue() != 0;
        String text = raw.toString().trim();
        if (text.isEmpty()) return defaultValue;
        return "true".equalsIgnoreCase(text)
                || "yes".equalsIgnoreCase(text)
                || "1".equals(text);
    }

    private static String odata(String value) {
        return value == null ? "" : value.replace("'", "''");
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[QualificationCatalog-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
            return null;
        }
    }
}
