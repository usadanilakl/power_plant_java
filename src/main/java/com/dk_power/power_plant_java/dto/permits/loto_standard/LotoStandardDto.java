package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LotoStandardDto extends BaseDto {
    private Long id;
    private String name;
    private String description;
    private List<LotoPointDto> lotoPoints;
    private String lotoPointOrder;
}
