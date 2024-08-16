package com.dk_power.power_plant_java.dto.base_dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@NoArgsConstructor
public class BaseBreakerDto extends BaseDto{
    private BaseElectricalPanelDto panel;
    private String tagNumber;
    private List equipmentList;
    public <D extends BaseEquipmentDto> void setEquipmentList(List<D> list){
        equipmentList = list;
    }
}
