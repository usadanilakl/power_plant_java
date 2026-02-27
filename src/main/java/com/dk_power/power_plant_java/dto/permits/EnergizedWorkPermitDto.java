package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.EnergizedWorkChecklist;
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
public class EnergizedWorkPermitDto extends BasePermitDto {
    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String workOrder;
    private String circuitDescription;
    private String workDescription;
    private String justification;
    private String requester;
    private String requesterDate;
    private String qualifiedPersonSignature;
    private String qualifiedPersonDate;
    private String plantManagerSignature;
    private String plantManagerDate;
    private Boolean workCanBePerformedSafely;
    private EnergizedWorkChecklist checklist;
}
