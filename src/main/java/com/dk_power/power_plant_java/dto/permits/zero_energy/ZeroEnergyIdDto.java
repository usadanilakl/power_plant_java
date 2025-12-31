package com.dk_power.power_plant_java.dto.permits.zero_energy;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Data;

@Data
public class ZeroEnergyIdDto extends BaseDto {

    private String method;
    private java.util.List<Long> templateLotoPointIds;
    private String resolvedMethod;
    private Long zeroEnergyTemplateId;
}
