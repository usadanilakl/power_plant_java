package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseBreakerDto;
import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
//@Setter
@NoArgsConstructor
public class EqBreakerDto extends BaseBreakerDto {
    private List<EquipmentDto> equipmentList;
    private ElectricalPanelDto panel;

    @Override
    public <D extends BaseEquipmentDto> void setEquipmentList(List<D> list) {
        equipmentList = (List<EquipmentDto>)list;
    }

    public void setPanel(ElectricalPanelDto panel) {
        this.panel = panel;
    }
}
