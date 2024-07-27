package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class HtBreakerDto extends BaseBreakerDto {
    private List<HeatTraceDto> equipment;
    private HtPanelDto panel;
}
