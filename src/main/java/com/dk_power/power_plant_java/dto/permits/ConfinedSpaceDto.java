package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConfinedSpaceDto extends BasePermitDto {

    private String date;
    private String time;
    private String space;
    private String workScope;
    private String issuedTo;
    private String duration;
    private String lotoNum;
    private String hotWorkNum;
    private boolean ventilation;
    private boolean blankFlanged;
    private String meterModel;
    private String meterNum;
    private boolean calibrated;
    private ConfinedSpaceHazards hazards;

    // Getters and setters
    // ...
}
