package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import lombok.Data;

import java.util.List;

@Data
public class NgJhaDto extends BaseDto {

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
    private String sharepointId;
    private String localUuid;
    private String workRequestSharepointId;
    private Long workRequestId;
    private String status;
    private String timeSubmitted;
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;
    private Integer attachmentCount;
}
