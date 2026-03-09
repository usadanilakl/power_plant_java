package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
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
public class InstrumentSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Instrumentation";

    public record ProbeState(int itemCount, Instant lastModified) {}

    public List<InstrumentDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll Instrumentation"
        );
    }

    public ProbeState getProbeState() {
        return spService.executeWithFallback(
                this::certGetProbeState,
                this::paGetProbeState,
                "getState Instrumentation"
        );
    }

    public String create(InstrumentDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create Instrument"
        );
    }

    public void update(String sharepointId, InstrumentDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update Instrument"
        );
    }

    public void upsertByTagNumber(InstrumentDto dto) {
        spService.executeWithFallback(
                () -> { certUpsertByTagNumber(dto); return null; },
                () -> { paUpsertByTagNumber(dto); return null; },
                "upsert Instrument"
        );
    }

    // ====================== Certificate path ======================

    private List<InstrumentDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private ProbeState certGetProbeState() {
        JsonNode metadata = certAccess.getListMetadata(LIST_TITLE);
        int itemCount = parseIntSafe(metadata.path("ItemCount").asText(null), 0);

        String modifiedRaw = firstNonBlank(
                metadata.path("LastItemModifiedDate").asText(null),
                metadata.path("lastItemModifiedDate").asText(null),
                metadata.path("LastItemUserModifiedDate").asText(null)
        );

        return new ProbeState(itemCount, parseInstant(modifiedRaw));
    }

    private String certCreate(InstrumentDto dto) {
        Map<String, Object> body = toMap(dto);
        return certAccess.createListItem(LIST_TITLE, body);
    }

    private void certUpdate(String sharepointId, InstrumentDto dto) {
        Map<String, Object> body = toMap(dto);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    private void certUpsertByTagNumber(InstrumentDto dto) {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        String existingSpId = null;
        for (JsonNode item : items) {
            String tag = item.path("Tag_x0020_Number").asText(item.path("Tag Number").asText(null));
            if (dto.getTagNumber() != null && dto.getTagNumber().equals(tag)) {
                existingSpId = item.path("ID").asText(item.path("Id").asText(null));
                break;
            }
        }

        if (existingSpId != null) {
            certUpdate(existingSpId, dto);
            log.info("[Instrument-Adapter] Updated instrument in SP: tagNumber={}, spId={}", dto.getTagNumber(), existingSpId);
        } else {
            String newId = certCreate(dto);
            log.info("[Instrument-Adapter] Created instrument in SP: tagNumber={}, spId={}", dto.getTagNumber(), newId);
        }
    }

    // ====================== Power Automate path ======================

    private List<InstrumentDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setData(Map.of());

        PaResponseDto resp = v2Client.instrument(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll Instrumentation failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private ProbeState paGetProbeState() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getState");
        req.setData(Map.of());

        PaResponseDto resp = v2Client.instrument(req);
        if (!resp.isSuccess() || resp.getData() == null || resp.getData().isEmpty()) {
            throw new RuntimeException("PA-V2 getState Instrumentation failed: " + resp.getMessage());
        }

        Map<String, Object> first = resp.getData().get(0);
        int itemCount = parseIntSafe(first.get("itemCount"), 0);
        Instant lastModified = parseInstant(objectToString(first.get("lastModified")));
        return new ProbeState(itemCount, lastModified);
    }

    private String paCreate(InstrumentDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.instrument(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create Instrument failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paUpdate(String sharepointId, InstrumentDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.instrument(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 update Instrument failed: " + resp.getMessage());
        }
    }

    private void paUpsertByTagNumber(InstrumentDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("upsertByTagNumber");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.instrument(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 upsertByTagNumber Instrument failed: " + resp.getMessage());
        }
    }

    // ====================== Column mapping ======================

    private InstrumentDto mapFromSharePoint(JsonNode item) {
        InstrumentDto dto = new InstrumentDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setTagNumber(item.path("Tag_x0020_Number").asText(item.path("Tag Number").asText(null)));
        dto.setDescription(item.path("Description").asText(null));
        dto.setVendor(item.path("Vendor").asText(null));
        dto.setLocation(item.path("Location").asText(null));
        dto.setType(item.path("Type").asText(null));
        dto.setCurrentStatus(item.path("CurrentStatus").asText(null));
        dto.setLastUpdatedDate(item.path("LastUpdatedDate").asText(null));
        dto.setLastUpdatedTime(item.path("LastUpdatedTime").asText(null));
        dto.setLastUpdatedBy(item.path("LastUpdatedBy").asText(null));
        dto.setLastComment(item.path("LastComment").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private InstrumentDto mapFromPaResponse(Map<String, Object> map) {
        InstrumentDto dto = new InstrumentDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setTagNumber(str(map, "Tag_x0020_Number"));
        dto.setDescription(str(map, "Description"));
        dto.setVendor(str(map, "Vendor"));
        dto.setLocation(str(map, "Location"));
        dto.setType(str(map, "Type"));
        dto.setCurrentStatus(str(map, "CurrentStatus"));
        dto.setLastUpdatedDate(str(map, "LastUpdatedDate"));
        dto.setLastUpdatedTime(str(map, "LastUpdatedTime"));
        dto.setLastUpdatedBy(str(map, "LastUpdatedBy"));
        dto.setLastComment(str(map, "LastComment"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(InstrumentDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Tag_x0020_Number", orEmpty(dto.getTagNumber()));
        map.put("Description", orEmpty(dto.getDescription()));
        map.put("Vendor", orEmpty(dto.getVendor()));
        map.put("Location", orEmpty(dto.getLocation()));
        map.put("Type", orEmpty(dto.getType()));
        map.put("CurrentStatus", orEmpty(dto.getCurrentStatus()));
        map.put("LastUpdatedDate", orEmpty(dto.getLastUpdatedDate()));
        map.put("LastUpdatedTime", orEmpty(dto.getLastUpdatedTime()));
        map.put("LastUpdatedBy", orEmpty(dto.getLastUpdatedBy()));
        map.put("LastComment", orEmpty(dto.getLastComment()));
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[Instrument-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    private static int parseIntSafe(Object value, int defaultVal) {
        if (value == null) return defaultVal;
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (Exception ignored) {
            return defaultVal;
        }
    }

    private static String objectToString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
