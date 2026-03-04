package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.VentingPermitDto;
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
public class VentingPermitSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Venting Permits";

    public List<VentingPermitDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll VentingPermits");
    }

    public String create(VentingPermitDto dto) {
        return spService.executeWithFallback(() -> certCreate(dto), () -> paCreate(dto), "create VentingPermit");
    }

    public void update(String sharepointId, VentingPermitDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update VentingPermit");
    }

    public void changeStatus(String sharepointId, String status) {
        spService.executeWithFallback(
                () -> { certAccess.updateListItem(LIST_TITLE, sharepointId, Map.of("Status", status)); return null; },
                () -> { PaRequestDto req = new PaRequestDto(); req.setActionType("update"); req.setId(sharepointId);
                        req.setData(Map.of("Status", status)); v2Client.venting(req); return null; },
                "changeStatus VentingPermit");
    }

    // ====================== Certificate path ======================

    private List<VentingPermitDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(VentingPermitDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, VentingPermitDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    // ====================== Power Automate path ======================

    private List<VentingPermitDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.venting(req);
        if (!resp.isSuccess() || resp.getData() == null)
            throw new RuntimeException("PA-V2 getAll VentingPermits failed: " + resp.getMessage());
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(VentingPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.venting(req);
        if (!resp.isSuccess()) throw new RuntimeException("PA-V2 create VentingPermit failed: " + resp.getMessage());
        return resp.getId();
    }

    private void paUpdate(String sharepointId, VentingPermitDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.venting(req);
        if (!resp.isSuccess()) log.error("[VENT-Adapter] PA update failed: {}", resp.getMessage());
    }

    // ====================== Column mapping ======================

    private VentingPermitDto mapFromSharePoint(JsonNode item) {
        VentingPermitDto dto = new VentingPermitDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setWorkScope(item.path("Title").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setTime(item.path("Time").asText(null));
        dto.setLocation(item.path("LocationOfWork").asText(null));
        dto.setIssuedTo(item.path("IssuedTo").asText(null));
        dto.setPlantName(item.path("PlantName").asText(null));
        dto.setSystemName(item.path("SystemName").asText(null));
        dto.setRequestingIndividual(item.path("RequestingIndividual").asText(null));
        dto.setPurpose(item.path("Purpose").asText(null));
        dto.setTimeCommence(item.path("TimeCommence").asText(null));
        dto.setTimeConclude(item.path("TimeConclude").asText(null));
        dto.setGasType(item.path("GasType").asText(null));
        dto.setLel(item.path("LEL").asText(null));
        dto.setUel(item.path("UEL").asText(null));
        dto.setCalculatedVolume(item.path("CalculatedVolume").asText(null));
        dto.setPressure(item.path("Pressure").asText(null));
        dto.setGasIndicatorModel(item.path("GasIndicatorModel").asText(null));
        dto.setGasIndicatorSerial(item.path("GasIndicatorSerial").asText(null));
        dto.setCalibrationDate(item.path("CalibrationDate").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private VentingPermitDto mapFromPaResponse(Map<String, Object> map) {
        VentingPermitDto dto = new VentingPermitDto();
        dto.setSharepointId(str(map, "ID"));
        dto.setWorkScope(str(map, "Title"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setDate(str(map, "Date"));
        dto.setTime(str(map, "Time"));
        dto.setLocation(str(map, "LocationOfWork"));
        dto.setIssuedTo(str(map, "IssuedTo"));
        dto.setPlantName(str(map, "PlantName"));
        dto.setSystemName(str(map, "SystemName"));
        dto.setRequestingIndividual(str(map, "RequestingIndividual"));
        dto.setPurpose(str(map, "Purpose"));
        dto.setTimeCommence(str(map, "TimeCommence"));
        dto.setTimeConclude(str(map, "TimeConclude"));
        dto.setGasType(str(map, "GasType"));
        dto.setLel(str(map, "LEL"));
        dto.setUel(str(map, "UEL"));
        dto.setCalculatedVolume(str(map, "CalculatedVolume"));
        dto.setPressure(str(map, "Pressure"));
        dto.setGasIndicatorModel(str(map, "GasIndicatorModel"));
        dto.setGasIndicatorSerial(str(map, "GasIndicatorSerial"));
        dto.setCalibrationDate(str(map, "CalibrationDate"));
        return dto;
    }

    private Map<String, Object> toMap(VentingPermitDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getWorkScope()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("Time", orEmpty(dto.getTime()));
        map.put("LocationOfWork", orEmpty(dto.getLocation()));
        map.put("IssuedTo", orEmpty(dto.getIssuedTo()));
        map.put("PlantName", orEmpty(dto.getPlantName()));
        map.put("SystemName", orEmpty(dto.getSystemName()));
        map.put("RequestingIndividual", orEmpty(dto.getRequestingIndividual()));
        map.put("Purpose", orEmpty(dto.getPurpose()));
        map.put("TimeCommence", orEmpty(dto.getTimeCommence()));
        map.put("TimeConclude", orEmpty(dto.getTimeConclude()));
        map.put("GasType", orEmpty(dto.getGasType()));
        map.put("LEL", orEmpty(dto.getLel()));
        map.put("UEL", orEmpty(dto.getUel()));
        map.put("CalculatedVolume", orEmpty(dto.getCalculatedVolume()));
        map.put("Pressure", orEmpty(dto.getPressure()));
        map.put("GasIndicatorModel", orEmpty(dto.getGasIndicatorModel()));
        map.put("GasIndicatorSerial", orEmpty(dto.getGasIndicatorSerial()));
        map.put("CalibrationDate", orEmpty(dto.getCalibrationDate()));
        map.put("Status", "Active");
        return map;
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { log.warn("[VENT-Adapter] Failed to parse Modified: {}", raw); return null; }
    }
}
