package com.dk_power.power_plant_java.dto.base_dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BaseElectricalPanelDto extends BaseDto{
    private String location;
    private String tagNubmer;
}
