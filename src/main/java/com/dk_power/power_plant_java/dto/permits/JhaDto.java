package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class JhaDto extends BasePermitDto {

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
    private String status;
    private String timeSubmitted;
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;

    public static JhaDto createTestInstance() {
        JhaDto dto = new JhaDto();
        dto.setJobName("Replace Circuit Panel");
        dto.setApplicability("Electrical Maintenance");
        dto.setAnalysisBy("D. West");
        dto.setReviewedBy("R. Cole");
        dto.setApprovedBy("M. Brooks");
        dto.setDate("2025-09-07");
        dto.setPpe("Hard hat, gloves, safety glasses");
        dto.setLoto("Yes");
        dto.setConfinedSpace("No");
        dto.setHazCom("Yes");
        dto.setHandAndPowerTools("Insulated screwdrivers, torque wrench");
        dto.setSpecialTools("Multimeter, thermal camera");
        dto.setSharepointId("JHA-001");

        JobStep step1 = new JobStep(1, "Lockout panel", "Electrical shock", "Apply lockout/tagout properly");
        JobStep step2 = new JobStep(2, "Verify absence of voltage", "Residual live circuit", "Use calibrated tester");
        JobStep step3 = new JobStep(3, "Replace circuit breakers", "Arc flash", "Wear PPE and use insulated tools");

        dto.setJobSteps(List.of(step1, step2, step3));

        return dto;
    }
}