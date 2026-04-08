package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EtaProReadingDto extends BaseDto {
    private String pointId;
    private LocalDateTime readingTime;
    private Double readingValue;
    private String quality;
    private String scrapeSessionId;
}
