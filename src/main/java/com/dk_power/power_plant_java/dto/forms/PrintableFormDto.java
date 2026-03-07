package com.dk_power.power_plant_java.dto.forms;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PrintableFormDto extends BaseDto {
    private String size;
    private String formType;
    private Boolean isPrimary;
    private List<FormContainerDto> formContainers;
}
