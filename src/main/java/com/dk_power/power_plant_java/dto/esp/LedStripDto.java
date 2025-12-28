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
    private Integer sequence;
    private Integer totalLeds = 260;
    private String description;

    // WLED Configuration Settings
    private String ledType = "WS281x";
    private Integer milliampsPerLed = 55;
    private String colorOrder = "GRB";
    private Integer startLed = 0;
    private Boolean reversed = false;
    private Integer skipFirstLeds = 0;
    private Integer offRefreshRate = 100;
}