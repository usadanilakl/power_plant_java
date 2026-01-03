package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
@Data
public class LotoStandardIdDto extends BaseDto {
    private Long id;
    private String name;
    private String description;
    private List<Long> lotoPoints;
    private String lotoPointOrder;
    private Set<Long> groups;

}
