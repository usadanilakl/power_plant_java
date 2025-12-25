package com.dk_power.power_plant_java.dto.esp;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LedStripDto extends BaseDto {
    private Long espDeviceId;
    private EspDeviceDto espDevice;
    private Integer stripNumber;
    private Integer gpioPin;
    private Integer totalLeds = 260;
    private String description;
}