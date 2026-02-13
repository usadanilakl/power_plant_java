package com.dk_power.power_plant_java.sevice.sharepoint.adapters;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.sharepoint.SharePointDateUtils.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class JhaSharePointAdapter {

    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "JHA";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public List<JhaDto> getAll() {
        return spService.executeWithFallback(
                this::certGetAll,
                this::paGetAll,
                "getAll JHAs"
        );
    }

    public String create(JhaDto dto) {
        return spService.executeWithFallback(
                () -> certCreate(dto),
                () -> paCreate(dto),
                "create JHA"
        );
    }

    public void update(String sharepointId, JhaDto dto) {
        spService.executeWithFallback(
                () -> { certUpdate(sharepointId, dto); return null; },
                () -> { paUpdate(sharepointId, dto); return null; },
                "update JHA"
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
                    v2Client.jha(req);
                    return null;
                },
                "addAttachment JHA"
        );
    }

    // ====================== Certificate path ======================

    private List<JhaDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private String certCreate(JhaDto dto) {
        Map<String, Object> body = jhaToMap(dto);
        return certAccess.createListItem(LIST_TITLE, body);
    }

    private void certUpdate(String sharepointId, JhaDto dto) {
        Map<String, Object> body = jhaToMap(dto);
        certAccess.updateListItem(LIST_TITLE, sharepointId, body);
    }

    // ====================== Power Automate path ======================

    private List<JhaDto> paGetAll() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            throw new RuntimeException("PA-V2 getAll JHAs failed: " + resp.getMessage());
        }
        return resp.getData().stream().map(this::mapFromPaResponse).collect(Collectors.toList());
    }

    private String paCreate(JhaDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(jhaToMap(dto));
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create JHA failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    private void paUpdate(String sharepointId, JhaDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(jhaToMap(dto));
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess()) {
            log.error("[JHA-Adapter] PA update failed: {}", resp.getMessage());
        }
    }

    // ====================== Column mapping ======================

    private JhaDto mapFromSharePoint(JsonNode item) {
        JhaDto dto = new JhaDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        dto.setJobName(item.path("JobName").asText(null));
        dto.setApplicability(item.path("Applicability").asText(null));
        dto.setAnalysisBy(item.path("AnalysisBy").asText(null));
        dto.setReviewedBy(item.path("ReviewedBy").asText(null));
        dto.setApprovedBy(item.path("ApprovedBy").asText(null));
        dto.setDate(item.path("Date").asText(null));
        dto.setPpe(item.path("PPE").asText(null));
        dto.setLoto(item.path("LOTO").asText(null));
        dto.setConfinedSpace(item.path("ConfinedSpace").asText(null));
        dto.setHazCom(item.path("HazCom").asText(null));
        dto.setHandAndPowerTools(item.path("HandAndPowerTools").asText(null));
        dto.setSpecialTools(item.path("SpecialTools").asText(null));
        dto.setLocalUuid(item.path("PwaId").asText(null));
        dto.setWorkRequestSharepointId(item.path("WorkRequestSharepointId").asText(null));
        dto.setSubmitterName(item.path("SubmitterName").asText(null));
        dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
        dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
        dto.setSubmitterCompany(item.path("SubmitterCompany").asText(null));
        dto.setTimeSubmitted(item.path("TimeSubmitted").asText(null));
        dto.setStatus(item.path("Status").asText(null));
        parseJobStepsFromJson(dto, item.path("JobSteps").asText(null));
        return dto;
    }

    @SuppressWarnings("unchecked")
    private JhaDto mapFromPaResponse(Map<String, Object> map) {
        JhaDto dto = new JhaDto();
        dto.setJobName(str(map, "JobName"));
        dto.setApplicability(str(map, "Applicability"));
        dto.setAnalysisBy(str(map, "AnalysisBy"));
        dto.setReviewedBy(str(map, "ReviewedBy"));
        dto.setApprovedBy(str(map, "ApprovedBy"));
        dto.setDate(str(map, "Date"));
        dto.setPpe(str(map, "PPE"));
        dto.setLoto(str(map, "LOTO"));
        dto.setConfinedSpace(str(map, "ConfinedSpace"));
        dto.setHazCom(str(map, "HazCom"));
        dto.setHandAndPowerTools(str(map, "HandAndPowerTools"));
        dto.setSpecialTools(str(map, "SpecialTools"));
        dto.setSharepointId(str(map, "ID"));
        dto.setLocalUuid(str(map, "PwaId"));
        dto.setWorkRequestSharepointId(str(map, "WorkRequestSharepointId"));
        dto.setSubmitterName(str(map, "SubmitterName"));
        dto.setSubmitterEmail(str(map, "SubmitterEmail"));
        dto.setSubmitterPhone(str(map, "SubmitterPhone"));
        dto.setSubmitterCompany(str(map, "SubmitterCompany"));
        dto.setTimeSubmitted(str(map, "TimeSubmitted"));
        dto.setStatus(str(map, "Status"));
        parseJobStepsFromJson(dto, str(map, "JobSteps"));
        return dto;
    }

    private Map<String, Object> jhaToMap(JhaDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("Title", orEmpty(dto.getJobName()));
        map.put("PwaId", orEmpty(dto.getLocalUuid()));
        map.put("JobName", orEmpty(dto.getJobName()));
        map.put("Applicability", orEmpty(dto.getApplicability()));
        map.put("AnalysisBy", orEmpty(dto.getAnalysisBy()));
        map.put("ReviewedBy", orEmpty(dto.getReviewedBy()));
        map.put("ApprovedBy", orEmpty(dto.getApprovedBy()));
        map.put("Date", orEmpty(dto.getDate()));
        map.put("PPE", orEmpty(dto.getPpe()));
        map.put("LOTO", orEmpty(dto.getLoto()));
        map.put("ConfinedSpace", orEmpty(dto.getConfinedSpace()));
        map.put("HazCom", orEmpty(dto.getHazCom()));
        map.put("HandAndPowerTools", orEmpty(dto.getHandAndPowerTools()));
        map.put("SpecialTools", orEmpty(dto.getSpecialTools()));
        map.put("WorkRequestSharepointId", orEmpty(dto.getWorkRequestSharepointId()));
        map.put("SubmitterName", orEmpty(dto.getSubmitterName()));
        map.put("SubmitterEmail", orEmpty(dto.getSubmitterEmail()));
        map.put("SubmitterPhone", orEmpty(dto.getSubmitterPhone()));
        map.put("SubmitterCompany", orEmpty(dto.getSubmitterCompany()));
        map.put("TimeSubmitted", orEmpty(dto.getTimeSubmitted()));
        map.put("Status", dto.getStatus() != null ? dto.getStatus() : "Active");
        if (dto.getJobSteps() != null) {
            try {
                map.put("JobSteps", objectMapper.writeValueAsString(dto.getJobSteps()));
            } catch (Exception e) {
                log.warn("[JHA-Adapter] Failed to serialize jobSteps: {}", e.getMessage());
                map.put("JobSteps", "[]");
            }
        }
        return map;
    }

    private void parseJobStepsFromJson(JhaDto dto, String jobStepsJson) {
        if (jobStepsJson != null && !jobStepsJson.isEmpty()) {
            try {
                List<JobStep> steps = objectMapper.readValue(jobStepsJson,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, JobStep.class));
                dto.setJobSteps(steps);
            } catch (Exception e) {
                log.warn("[JHA-Adapter] Failed to deserialize jobSteps: {}", e.getMessage());
                dto.setJobSteps(new ArrayList<>());
            }
        }
    }
}
