package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseBreakerDto;
import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
//@Setter
@NoArgsConstructor
public class HtBreakerDto extends BaseBreakerDto {
    private List<HeatTraceDto> equipmentList;
    private HtPanelDto panel;

    @Override
    public <D extends BaseEquipmentDto> void setEquipmentList(List<D> list) {
        equipmentList = (List<HeatTraceDto>)list;
    }

    public void setPanel(HtPanelDto panel) {
        this.panel = panel;
    }
}
