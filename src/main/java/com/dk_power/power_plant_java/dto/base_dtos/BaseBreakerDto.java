package com.dk_power.power_plant_java.dto.base_dtos;

import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.dk_power.power_plant_java.entities.base_entities.BaseEquipment;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
public class BaseBreakerDto extends BaseDto{
    private BaseElectricalPanelDto panel;
    private String tagNumber;
    private BaseEquipmentDto equipment;
}
