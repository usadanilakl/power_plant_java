package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.VentingChecklist;
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
public class VentingPermitDto extends BasePermitDto {
    private String date;
    private String time;
    private String location;
    private String issuedTo;

    private String plantName;
    private String systemName;
    private String requestingIndividual;
    private String purpose;
    private String timeCommence;
    private String timeConclude;
    private String individualIssuing;

    private String gasType;
    private String lel;
    private String uel;
    private String calculatedVolume;
    private String pressure;

    private String gasIndicatorModel;
    private String gasIndicatorSerial;
    private String calibrationDate;

    private Boolean sdsProvided;
    private String sdsInitials;
    private Boolean generalArrangementProvided;
    private String generalArrangementInitials;
    private Boolean hazardousClassificationDrawing;
    private String hazardousClassificationInitials;
    private Boolean pidWithValves;
    private String pidInitials;
    private String drawingNumbers;

    private String stackDescription;
    private String equipmentToBeDeenergized;
    private String lotoDescription;

    private String radioChannel;
    private String controlRoom;

    private String osmSupervisor;
    private String osmDate;
    private String plantManager;
    private String plantManagerDate;
    private String divisionDirector;
    private String divisionDirectorDate;

    private VentingChecklist checklist;
}
