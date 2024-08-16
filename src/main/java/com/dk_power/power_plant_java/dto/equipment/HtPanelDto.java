package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseElectricalPanelDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class HtPanelDto extends BaseElectricalPanelDto {
    private List<HtBreakerDto> htBreakers = new ArrayList<>();
}
