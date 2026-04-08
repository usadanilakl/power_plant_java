package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EtaProPointDto extends BaseDto {
    private String pointId;
    private String description;
    private String unit;
    private String category;
    private Boolean active;
}
