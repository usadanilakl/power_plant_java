package com.dk_power.power_plant_java.dto.forms;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class FormContainerDto extends BaseDto {
    private Map<String, Object> content;
    private Map<String, Object> position;
    private Map<String, Object> size;
    private Map<String, Object> style;
}