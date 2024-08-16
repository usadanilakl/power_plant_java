package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BypassDto extends BaseDto {
    private String standard;
    private String originalId;
    private String tagNumber;
    private String description;
    private String location;
}