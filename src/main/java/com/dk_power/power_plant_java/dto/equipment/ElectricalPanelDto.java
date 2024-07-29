package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseElectricalPanelDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ElectricalPanelDto extends BaseElectricalPanelDto {
    private List<EqBreakerDto> eqBreakers = new ArrayList<>();
}
