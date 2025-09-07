package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HotWorkDto extends BasePermitDto {
    private String date;
    private String forman;
    private String fireWatch;
    private String meterModel;
    private String meterNum;
    private String specialInstructions;
    private HotWorkMeasures measures;

}
