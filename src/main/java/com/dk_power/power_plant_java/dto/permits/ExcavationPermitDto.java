package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ExcavationChecklist;
import com.dk_power.power_plant_java.entities.permits.pojo.ExcavationTypeOfWork;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@NoArgsConstructor
public class ExcavationPermitDto extends BasePermitDto {
    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String supervisor;
    private String jobLocation;
    private String supervisorPhone;
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

    private String facilityName;
    private String competentPerson;
    private String soilType;
    private String excavationDepth;
    private String excavationWidth;
    private String protectiveSystemType;

    private ExcavationTypeOfWork typeOfWork;
    private String inspectionsJson;
    private ExcavationChecklist checklist;
}
