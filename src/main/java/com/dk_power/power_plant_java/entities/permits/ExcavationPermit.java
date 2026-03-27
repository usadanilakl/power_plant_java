package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.ExcavationChecklist;
import com.dk_power.power_plant_java.entities.permits.pojo.ExcavationTypeOfWork;
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
@Table(name = "excavation_permit")
@Getter
@Setter
public class ExcavationPermit extends BasePermitEntity {
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String supervisor;
    private String jobLocation;
    private String supervisorPhone;
    @Column(columnDefinition = "TEXT")
    private String excavationDescription;
    private String workOrder;
    private Boolean locationPipingMarked;
    private String supervisorApprovalDate;
    private String supervisorApprovalTime;
    private String permitClosedDate;
    private String permitClosedTime;
    private Boolean jobStatusComplete;
    private String supervisorFieldInspectionName;
    private String supervisorFieldInspectionDate;
    private String supervisorFieldInspectionTime;

    // Checklist metadata
    private String facilityName;
    private String competentPerson;
    private String soilType;
    private String excavationDepth;
    private String excavationWidth;
    private String protectiveSystemType;

    @Column(columnDefinition = "TEXT")
    private String typeOfWorkJson;

    @Column(columnDefinition = "TEXT")
    private String inspectionsJson;

    @Column(columnDefinition = "TEXT")
    private String checklistJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public ExcavationTypeOfWork getTypeOfWork() {
        if (typeOfWorkJson == null || typeOfWorkJson.isEmpty()) {
            return new ExcavationTypeOfWork();
        }
        try {
            String json = typeOfWorkJson;
            if (json.contains("\\\"")) json = json.replace("\\\"", "\"");
            return mapper.readValue(json, ExcavationTypeOfWork.class);
        } catch (Exception e) {
            return new ExcavationTypeOfWork();
        }
    }

    public void setTypeOfWork(ExcavationTypeOfWork typeOfWork) {
        try {
            this.typeOfWorkJson = mapper.writeValueAsString(typeOfWork);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize typeOfWork object", e);
        }
    }

    public ExcavationChecklist getChecklist() {
        if (checklistJson == null || checklistJson.isEmpty()) {
            return new ExcavationChecklist();
        }
        try {
            String json = checklistJson;
            if (json.contains("\\\"")) json = json.replace("\\\"", "\"");
            return mapper.readValue(json, ExcavationChecklist.class);
        } catch (Exception e) {
            return new ExcavationChecklist();
        }
    }

    public void setChecklist(ExcavationChecklist checklist) {
        try {
            this.checklistJson = mapper.writeValueAsString(checklist);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize checklist object", e);
        }
    }
}
