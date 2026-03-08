package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstrumentSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;

    private static final String LIST_TITLE = "Instruments";

    public List<InstrumentDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                () -> { throw new RuntimeException("No PA fallback configured for Instruments"); },
                "getAll Instruments"
        );
    }

    public String create(InstrumentDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> { throw new RuntimeException("No PA fallback configured for Instruments"); },
                "create Instrument"
        );
    }

    public void update(String sharepointId, InstrumentDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { throw new RuntimeException("No PA fallback configured for Instruments"); },
                "update Instrument"
        );
    }

    public void upsertByTagNumber(InstrumentDto dto) {
        spService.executeWithFallback(
                () -> { certUpsertByTagNumber(dto); return null; },
                () -> { throw new RuntimeException("No PA fallback configured for Instruments"); },
                "upsert Instrument"
        );
    }

    // ====================== Certificate path ======================

    private List<InstrumentDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
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
            String tag = item.path("TagNumber").asText(null);
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

    // ====================== Column mapping ======================

    private InstrumentDto mapFromSharePoint(JsonNode item) {
        InstrumentDto dto = new InstrumentDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setTagNumber(item.path("TagNumber").asText(null));
        dto.setDescription(item.path("Description").asText(null));
        dto.setVendor(item.path("Vendor").asText(null));
        dto.setLocation(item.path("Location").asText(null));
        dto.setType(item.path("Type").asText(null));
        dto.setCurrentStatus(item.path("CurrentStatus").asText(null));
        dto.setLastUpdatedDate(item.path("LastUpdatedDate").asText(null));
        dto.setLastUpdatedTime(item.path("LastUpdatedTime").asText(null));
        dto.setLastUpdatedBy(item.path("LastUpdatedBy").asText(null));
        dto.setLastComment(item.path("LastComment").asText(null));
        return dto;
    }

    private Map<String, Object> toMap(InstrumentDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("TagNumber", orEmpty(dto.getTagNumber()));
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
}
