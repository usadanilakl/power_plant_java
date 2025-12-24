package com.dk_power.power_plant_java.dto.permits.zero_energy;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Data;
import lombok.Getter;

@Data
public class ZeroEnergyIdDto extends BaseDto {

    private String method;
    private LotoPointDto templateLotoPoint;
    private String resolvedMethod;
    private Long zeroEnergyTemplateId;
}
