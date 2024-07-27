package com.dk_power.power_plant_java.dto.base_dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
public class BaseEquipmentDto extends BaseDto{
    private String description;
    private String tagNumber;
}
