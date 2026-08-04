package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.EnergizedWorkChecklist;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "energized_work_permit")
@Getter
@Setter
public class EnergizedWorkPermit extends BasePermitEntity {
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String workOrder;
    @Column(columnDefinition = "TEXT")
    private String circuitDescription;
    @Column(columnDefinition = "TEXT")
    private String workDescription;
    @Column(columnDefinition = "TEXT")
    private String justification;
    private String requester;
    private String requesterDate;
    private String qualifiedPersonSignature;
    private String qualifiedPersonDate;
    private String plantManagerSignature;
    private String plantManagerDate;
    private Boolean workCanBePerformedSafely;

    @Column(columnDefinition = "TEXT")
    private String checklistJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public EnergizedWorkChecklist getChecklist() {
        if (checklistJson == null || checklistJson.isEmpty() || "null".equals(checklistJson.trim())) {
            return new EnergizedWorkChecklist();
        }
        try {
            String json = checklistJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, EnergizedWorkChecklist.class);
        } catch (Exception e) {
            return new EnergizedWorkChecklist();
        }
    }

    public void setChecklist(EnergizedWorkChecklist checklist) {
        try {
            this.checklistJson = mapper.writeValueAsString(checklist);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize checklist object", e);
        }
    }
}
