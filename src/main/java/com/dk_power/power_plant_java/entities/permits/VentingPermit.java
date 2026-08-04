package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.VentingChecklist;
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
@Table(name = "venting_permit")
@Getter
@Setter
public class VentingPermit extends BasePermitEntity {
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String plantName;
    private String systemName;
    private String requestingIndividual;
    @Column(columnDefinition = "TEXT")
    private String purpose;
    private String timeCommence;
    private String timeConclude;
    private String individualIssuing;

    // Gas info
    private String gasType;
    private String lel;
    private String uel;
    private String calculatedVolume;
    private String pressure;

    // Gas indicator
    private String gasIndicatorModel;
    private String gasIndicatorSerial;
    private String calibrationDate;

    // Documentation checks
    private Boolean sdsProvided;
    private String sdsInitials;
    private Boolean generalArrangementProvided;
    private String generalArrangementInitials;
    private Boolean hazardousClassificationDrawing;
    private String hazardousClassificationInitials;
    private Boolean pidWithValves;
    private String pidInitials;
    @Column(columnDefinition = "TEXT")
    private String drawingNumbers;

    // Description
    @Column(columnDefinition = "TEXT")
    private String stackDescription;
    @Column(columnDefinition = "TEXT")
    private String equipmentToBeDeenergized;
    @Column(columnDefinition = "TEXT")
    private String lotoDescription;

    // Communication
    private String radioChannel;
    private String controlRoom;

    // Authorization
    private String osmSupervisor;
    private String osmDate;
    private String plantManager;
    private String plantManagerDate;
    private String divisionDirector;
    private String divisionDirectorDate;

    @Column(columnDefinition = "TEXT")
    private String checklistJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public VentingChecklist getChecklist() {
        if (checklistJson == null || checklistJson.isEmpty() || "null".equals(checklistJson.trim())) {
            return new VentingChecklist();
        }
        try {
            String json = checklistJson;
            if (json.contains("\\\"")) json = json.replace("\\\"", "\"");
            return mapper.readValue(json, VentingChecklist.class);
        } catch (Exception e) {
            return new VentingChecklist();
        }
    }

    public void setChecklist(VentingChecklist checklist) {
        try {
            this.checklistJson = mapper.writeValueAsString(checklist);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize checklist object", e);
        }
    }
}
