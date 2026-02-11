package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jha")
@Getter
@Setter
public class Jha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String jobName;

    private String applicability;
    private String analysisBy;
    private String reviewedBy;
    private String approvedBy;

    private LocalDate date;
    private String ppe;
    private String loto;
    private String confinedSpace;
    private String hazCom;
    private String handAndPowerTools;
    private String specialTools;

    @Column(columnDefinition = "TEXT")
    private String jobSteps;

    private String sharepointId;

    // WorkRequest relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_request_id")
    private WorkRequest workRequest;

    private String workRequestSharepointId;

    // PWA tracking
    private String localUuid;
    private Boolean deleted = false;
    private LocalDateTime submittedAt;

    // Submitter contact info
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;

    private static final ObjectMapper mapper = new ObjectMapper();

    public List<JobStep> getJobSteps() {
        if (jobSteps == null || jobSteps.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return mapper.readValue(jobSteps, new TypeReference<List<JobStep>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize jobSteps JSON", e);
        }
    }

    public void setJobSteps(List<JobStep> steps) {
        try {
            this.jobSteps = mapper.writeValueAsString(steps);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize jobSteps list", e);
        }
    }

}
