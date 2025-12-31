package com.dk_power.power_plant_java.dto.permits.zero_energy;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class ZeroEnergyDto extends BaseDto {
    private String method;
    private ValueDto zeroEnergyTemplate;
    private List<EquipmentDto> templateEquipment;
    private List<Long> templateEquipmentIds;
}
