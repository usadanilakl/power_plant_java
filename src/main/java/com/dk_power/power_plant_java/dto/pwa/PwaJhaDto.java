package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import lombok.Data;

import java.util.List;

@Data
public class PwaJhaDto {
    private String localUuid;

    // Link to parent WorkRequest
    private String workRequestLocalUuid;
    private String workRequestSharepointId;

    // JHA fields
    private String jobName;
    private String applicability;
    private String analysisBy;
    private String reviewedBy;
    private String approvedBy;
    private String date;
    private String ppe;
    private String loto;
    private String confinedSpace;
    private String hazCom;
    private String handAndPowerTools;
    private String specialTools;
    private List<JobStep> jobSteps;

    // Contact info
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;
    private String timeSubmitted;

    // Attachments
    private List<PaAttachmentDto> attachments;
}
