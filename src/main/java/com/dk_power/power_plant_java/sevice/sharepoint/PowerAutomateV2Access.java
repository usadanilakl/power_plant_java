package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * V2 Power Automate access layer using SharePoint List-based flows.
 * All flows share the same generic request/response schema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PowerAutomateV2Access implements SharePointAccess {

    private final PowerAutomateV2Client v2Client;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- WorkRequest ---

    @Override
    public List<WorkRequestDto> getAllWorkRequests() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            log.warn("[PA-V2] getAll WorkRequests failed: {}", resp.getMessage());
            return Collections.emptyList();
        }
        return resp.getData().stream()
                .map(this::mapToWorkRequestDto)
                .collect(Collectors.toList());
    }

    @Override
    public String createWorkRequest(WorkRequestDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(workRequestToMap(dto));
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create WorkRequest failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    @Override
    public void archiveWorkRequest(String sharepointId) {
        changeWorkRequestStatus(sharepointId, "Archived");
    }

    @Override
    public void changeWorkRequestStatus(String sharepointId, String status) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(Map.of("Status", status));
        PaResponseDto resp = v2Client.workRequest(req);
        if (!resp.isSuccess()) {
            log.error("[PA-V2] update WorkRequest status to '{}' failed: {}", status, resp.getMessage());
        }
    }

    // --- JHA ---

    @Override
    public List<JhaDto> getAllJhas() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            log.warn("[PA-V2] getAll JHAs failed: {}", resp.getMessage());
            return Collections.emptyList();
        }
        return resp.getData().stream()
                .map(this::mapToJhaDto)
                .collect(Collectors.toList());
    }

    @Override
    public String createJha(JhaDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("create");
        req.setData(jhaToMap(dto));
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess()) {
            throw new RuntimeException("PA-V2 create JHA failed: " + resp.getMessage());
        }
        return resp.getId();
    }

    @Override
    public void updateJha(String sharepointId, JhaDto dto) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("update");
        req.setId(sharepointId);
        req.setData(jhaToMap(dto));
        PaResponseDto resp = v2Client.jha(req);
        if (!resp.isSuccess()) {
            log.error("[PA-V2] update JHA failed: {}", resp.getMessage());
        }
    }

    // --- Attachment ---

    @Override
    public void addAttachment(String entityType, String sharepointId, PaAttachmentDto attachment) {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("addAttachment");
        req.setId(sharepointId);
        req.setAttachments(List.of(attachment));
        PaResponseDto resp;
        if ("WorkRequest".equals(entityType)) {
            resp = v2Client.workRequest(req);
        } else if ("Jha".equals(entityType)) {
            resp = v2Client.jha(req);
        } else if ("ConfinedSpace".equals(entityType)) {
            resp = v2Client.confinedSpace(req);
        } else {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }
        if (!resp.isSuccess()) {
            log.error("[PA-V2] addAttachment failed for {} {}: {}", entityType, sharepointId, resp.getMessage());
        }
    }

    // --- Confined Space ---

    @Override
    public List<SpaceDto> getAllSpaces() {
        PaRequestDto req = new PaRequestDto();
        req.setActionType("getAll");
        PaResponseDto resp = v2Client.confinedSpace(req);
        if (!resp.isSuccess() || resp.getData() == null) {
            log.warn("[PA-V2] getAll Spaces failed: {}", resp.getMessage());
            return Collections.emptyList();
        }
        return resp.getData().stream()
                .map(map -> objectMapper.convertValue(map, SpaceDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAvailable() {
        return v2Client.isWorkRequestConfigured();
    }

    @Override
    public String getName() {
        return "Power Automate V2 (List-based)";
    }

    // --- Mapping helpers ---

    private Map<String, Object> workRequestToMap(WorkRequestDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        // Combine date + time into ISO datetime for SharePoint DateTime column
        String date = dto.getDateOfWorkToBePerformed();
        String time = dto.getTimeOfWorkToBePerformed();
        if (date != null && time != null && !time.isEmpty()) {
            map.put("DateOfWork", date + "T" + time + ":00");
        } else {
            map.put("DateOfWork", date != null ? date + "T00:00:00" : null);
        }
        map.put("WorkRequestedBy", dto.getRequestedBy());
        map.put("Company", dto.getCompany());
        map.put("LocationOfWork", dto.getLocation());
        map.put("AffectedEquipment", dto.getAffectedEquipment());
        map.put("WorkScope", dto.getWorkScope());
        map.put("IsLOTORequired", boolToYesNo(dto.getIsLotoRequired()));
        map.put("IsHotWorkRequired", boolToYesNo(dto.getIsHotWorkRequired()));
        map.put("IsConfinedSpaceEntryRequired", boolToYesNo(dto.getIsConfinedSpaceEntryRequired()));
        map.put("ForemanName", dto.getForeman());
        map.put("FireWatchName", dto.getFireWatch());
        map.put("SpaceToBeEntered", dto.getSpace());
        map.put("Status", dto.getStatus() != null ? dto.getStatus() : "Active");
        return map;
    }

    private WorkRequestDto mapToWorkRequestDto(Map<String, Object> map) {
        WorkRequestDto dto = new WorkRequestDto();
        // Split ISO datetime from SharePoint back into separate date and time
        String dateTime = str(map, "DateOfWork");
        if (dateTime != null && dateTime.contains("T")) {
            String[] parts = dateTime.split("T");
            dto.setDateOfWorkToBePerformed(parts[0]);
            dto.setTimeOfWorkToBePerformed(parts[1].length() >= 5 ? parts[1].substring(0, 5) : parts[1]);
        } else {
            dto.setDateOfWorkToBePerformed(dateTime);
            dto.setTimeOfWorkToBePerformed("");
        }
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
        return dto;
    }

    private Map<String, Object> jhaToMap(JhaDto dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("JobName", dto.getJobName());
        map.put("Applicability", dto.getApplicability());
        map.put("AnalysisBy", dto.getAnalysisBy());
        map.put("ReviewedBy", dto.getReviewedBy());
        map.put("ApprovedBy", dto.getApprovedBy());
        map.put("Date", dto.getDate());
        map.put("PPE", dto.getPpe());
        map.put("LOTO", dto.getLoto());
        map.put("ConfinedSpace", dto.getConfinedSpace());
        map.put("HazCom", dto.getHazCom());
        map.put("HandAndPowerTools", dto.getHandAndPowerTools());
        map.put("SpecialTools", dto.getSpecialTools());
        if (dto.getJobSteps() != null) {
            try {
                map.put("JobSteps", objectMapper.writeValueAsString(dto.getJobSteps()));
            } catch (Exception e) {
                log.warn("[PA-V2] Failed to serialize jobSteps: {}", e.getMessage());
                map.put("JobSteps", "[]");
            }
        }
        return map;
    }

    @SuppressWarnings("unchecked")
    private JhaDto mapToJhaDto(Map<String, Object> map) {
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
        String jobStepsJson = str(map, "JobSteps");
        if (jobStepsJson != null && !jobStepsJson.isEmpty()) {
            try {
                List<JobStep> steps = objectMapper.readValue(jobStepsJson,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, JobStep.class));
                dto.setJobSteps(steps);
            } catch (Exception e) {
                log.warn("[PA-V2] Failed to deserialize jobSteps: {}", e.getMessage());
                dto.setJobSteps(new ArrayList<>());
            }
        }
        return dto;
    }

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private String boolToYesNo(Boolean val) {
        if (val == null) return "No";
        return val ? "Yes" : "No";
    }
}
