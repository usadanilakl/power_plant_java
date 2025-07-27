
package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class FlowIdDto extends BaseDto {
    private String description;
    private Long statusId;
    private Set<Long> taskIds = new HashSet<>();
}