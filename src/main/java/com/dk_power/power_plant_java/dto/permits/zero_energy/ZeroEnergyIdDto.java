package com.dk_power.power_plant_java.dto.permits.zero_energy;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper=false)
public class ZeroEnergyIdDto extends BaseDto {
    private String method;
    private Long zeroEnergyTemplateId;
    private List<Long> templateEquipmentIds;
    private Boolean editShared;
}
