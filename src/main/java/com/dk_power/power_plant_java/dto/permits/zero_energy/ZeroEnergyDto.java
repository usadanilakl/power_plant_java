
package com.dk_power.power_plant_java.dto.permits.zero_energy;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class ZeroEnergyDto extends BaseDto {
    private String method;
    private LotoPointDto templateLotoPoint;
    private ValueDto zeroEnergyTemplate;
}
