package com.dk_power.power_plant_java.dto.esp;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class EspDeviceDto extends BaseDto {
    private String ipAddress;
    private String name;
    private Boolean isActive = true;
    private String description;
    private Set<String> pinSequence;
}