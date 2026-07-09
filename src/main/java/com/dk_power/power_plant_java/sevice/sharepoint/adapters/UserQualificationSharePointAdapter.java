package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDto;
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
public class UserQualificationSharePointAdapter {

    public static final String LIST_TITLE = "Employees Qualifications";

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    public List<PwaQualificationDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll UserQualifications");
    }

    public List<PwaQualificationDto> getByUserId(String userId) {
        return spService.executeWithFallback(
                () -> certGetByUserId(userId),
                () -> paGetByUserId(userId),
                "getByUserId UserQualifications");
    }

    public PwaQualificationDto getByPwaId(String pwaId) {
        List<PwaQualificationDto> items = spService.executeWithFallback(
                () -> certGetByPwaId(pwaId),
                () -> paGetByPwaId(pwaId),
                "getByPwaId UserQualifications");
        return items.isEmpty() ? null : items.getFirst();
    }

    public List<PwaQualificationDto> getByQualificationId(String qualificationId) {
        return spService.executeWithFallback(
                () -> certGetByQualificationId(qualificationId),
                () -> paGetAll().stream()
                        .filter(dto -> qualificationId != null && qualificationId.equals(dto.getQualificationId()))
                        .collect(Collectors.toList()),
                "getByQualificationId UserQualifications");
    }

    public String create(PwaQualificationDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create UserQualification");
    }

    public void update(String sharepointId, PwaQualificationDto dto) {
        spService.executeWithFallback(
                () -> {
                    certUpdate(sharepointId, dto);
                    return null;
                },
                () -> {
                    paUpdate(sharepointId, dto);
                    return null;
                },
                "update UserQualification");
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
                "delete UserQualification");
    }

    private List<PwaQualificationDto> certGetAll() {
        return certAccess.getListItems(LIST_TITLE).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private List<PwaQualificationDto> certGetByUserId(String userId) {
        String filter = "UserId eq '" + odata(userId) + "'";
        return certAccess.getListItems(LIST_TITLE, filter).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private List<PwaQualificationDto> certGetByPwaId(String pwaId) {
        String filter = "PwaId eq '" + odata(pwaId) + "'";
        return certAccess.getListItems(LIST_TITLE, filter).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private List<PwaQualificationDto> certGetByQualificationId(String qualificationId) {
        String filter = "QualificationId eq '" + odata(qualificationId) + "'";
        return certAccess.getListItems(LIST_TITLE, filter).stream()
                .map(this::mapFromSharePoint)
                .collect(Collectors.toList());
    }

    private String certCreate(PwaQualificationDto dto) {
        return certAccess.createListItem(LIST_TITLE, toMap(dto));
    }

    private void certUpdate(String sharepointId, PwaQualificationDto dto) {
        certAccess.updateListItem(LIST_TITLE, sharepointId, toMap(dto));
    }

    private List<PwaQualificationDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        req.setData(Map.of());
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll Employees Qualifications failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private List<PwaQualificationDto> paGetByUserId(String userId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getByUser");
        req.setId(userId);
        req.setData(Map.of("UserId", userId));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getByUser Employees Qualifications failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private List<PwaQualificationDto> paGetByPwaId(String pwaId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getByPwaId");
        req.setId(pwaId);
        req.setData(Map.of("PwaId", pwaId));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getByPwaId Employees Qualifications failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(PwaQualificationDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create User Qualification failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paUpdate(String sharepointId, PwaQualificationDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(toMap(dto));
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 update User Qualification failed: " + resp.getMessage());
        }
    }

    private void paDelete(String sharepointId) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("delete");
        req.setId(sharepointId);
        req.setData(Map.of());
        PaResponseDto resp = v2Client.qualifications(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 delete User Qualification failed: " + resp.getMessage());
        }
    }

    private PwaQualificationDto mapFromSharePoint(JsonNode item) {
        PwaQualificationDto dto = new PwaQualificationDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setUserId(item.path("UserId").asText(null));
        dto.setUserName(item.path("UserName").asText(item.path("Title").asText(null)));
        dto.setUserEmail(item.path("UserEmail").asText(null));
        dto.setWindowsUsername(item.path("WindowsUsername").asText(null));
        dto.setRole(item.path("Role").asText(null));
        dto.setQualificationId(item.path("QualificationId").asText(null));
        dto.setQualificationCode(item.path("QualificationCode").asText(null));
        dto.setQualificationName(item.path("QualificationName").asText(null));
        dto.setQualificationType(item.path("QualificationType").asText(null));
        dto.setStatus(item.path("Status").asText(null));
        dto.setIssuedDate(item.path("IssuedDate").asText(null));
        dto.setExpirationDate(item.path("ExpirationDate").asText(null));
        dto.setCredentialNumber(item.path("CredentialNumber").asText(null));
        dto.setIssuer(item.path("Issuer").asText(null));
        dto.setNotes(item.path("Notes").asText(null));
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    private PwaQualificationDto mapFromPaResponse(Map<String, Object> map) {
        PwaQualificationDto dto = new PwaQualificationDto();
        dto.setSharepointId(firstNonBlank(str(map, "ID"), str(map, "Id")));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setUserId(str(map, "UserId"));
        dto.setUserName(firstNonBlank(str(map, "UserName"), str(map, "Title")));
        dto.setUserEmail(str(map, "UserEmail"));
        dto.setWindowsUsername(str(map, "WindowsUsername"));
        dto.setRole(str(map, "Role"));
        dto.setQualificationId(str(map, "QualificationId"));
        dto.setQualificationCode(str(map, "QualificationCode"));
        dto.setQualificationName(str(map, "QualificationName"));
        dto.setQualificationType(str(map, "QualificationType"));
        dto.setStatus(str(map, "Status"));
        dto.setIssuedDate(str(map, "IssuedDate"));
        dto.setExpirationDate(str(map, "ExpirationDate"));
        dto.setCredentialNumber(str(map, "CredentialNumber"));
        dto.setIssuer(str(map, "Issuer"));
        dto.setNotes(str(map, "Notes"));
        dto.setSpModifiedTime(parseInstant(str(map, "Modified")));
        return dto;
    }

    private Map<String, Object> toMap(PwaQualificationDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        String title = title(dto);
        map.put("Title", title);
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("UserId", orEmpty(dto.getUserId()));
        map.put("UserName", orEmpty(dto.getUserName()));
        map.put("UserEmail", orEmpty(dto.getUserEmail()));
        map.put("WindowsUsername", orEmpty(dto.getWindowsUsername()));
        map.put("Role", orEmpty(dto.getRole()));
        map.put("QualificationId", orEmpty(dto.getQualificationId()));
        map.put("QualificationCode", orEmpty(dto.getQualificationCode()));
        map.put("QualificationName", orEmpty(dto.getQualificationName()));
        map.put("QualificationType", orEmpty(dto.getQualificationType()));
        map.put("Status", orEmpty(dto.getStatus()));
        map.put("IssuedDate", orEmpty(dto.getIssuedDate()));
        map.put("ExpirationDate", orEmpty(dto.getExpirationDate()));
        map.put("CredentialNumber", orEmpty(dto.getCredentialNumber()));
        map.put("Issuer", orEmpty(dto.getIssuer()));
        map.put("Notes", orEmpty(dto.getNotes()));
        return map;
    }

    private static String title(PwaQualificationDto dto) {
        String userName = firstNonBlank(dto.getUserName(), dto.getUserEmail(), "Unknown User");
        String qualification = dto.getQualificationName();
        if (qualification == null || qualification.isBlank()) {
            return userName;
        }
        return userName + " - " + qualification;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private static String odata(String value) {
        return value == null ? "" : value.replace("'", "''");
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.warn("[UserQualifications-Adapter] Failed to parse Modified datetime '{}': {}", raw, e.getMessage());
            return null;
        }
    }
}
