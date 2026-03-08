package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
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
public class InstrumentLogSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;

    private static final String LIST_TITLE = "Instrument Log";

    public List<InstrumentLogDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                () -> { throw new RuntimeException("No PA fallback configured for Instrument Log"); },
                "getAll InstrumentLogs"
        );
    }

    public String create(InstrumentLogDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> { throw new RuntimeException("No PA fallback configured for Instrument Log"); },
                "create InstrumentLog"
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

    // ====================== Column mapping ======================

    private InstrumentLogDto mapFromSharePoint(JsonNode item) {
        InstrumentLogDto dto = new InstrumentLogDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setInstrumentTagNumber(item.path("InstrumentTagNumber").asText(null));
        dto.setInstrumentDescription(item.path("InstrumentDescription").asText(null));
        dto.setStatus(item.path("Status").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setName(item.path("Name").asText(null));
        dto.setComment(item.path("Comment").asText(null));
        return dto;
    }

    private Map<String, Object> toMap(InstrumentLogDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("InstrumentTagNumber", orEmpty(dto.getInstrumentTagNumber()));
        map.put("InstrumentDescription", orEmpty(dto.getInstrumentDescription()));
        map.put("Status", orEmpty(dto.getStatus()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("Name", orEmpty(dto.getName()));
        map.put("Comment", orEmpty(dto.getComment()));
        return map;
    }
}
