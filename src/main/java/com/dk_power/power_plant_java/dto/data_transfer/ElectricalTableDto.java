package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ElectricalTableDto extends BaseDto{
    private String tagNumber;
    private String breakerLocation;
    private String category;
    private String bus;
    private String breakerType;
    private String powerUser;
    private String oldId;
}
