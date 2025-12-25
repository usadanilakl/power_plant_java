package com.dk_power.power_plant_java.dto.permits.loto_box;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LedConfigDto {
    private Integer number;
    private Integer strip;
    private Integer rangeStart;
    private Integer rangeEnd;
}