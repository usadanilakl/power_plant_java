package com.dk_power.power_plant_java.dto.esp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LedBoxStatusDto {
    private Integer number;
    private Integer strip;
    private Integer r;
    private Integer g;
    private Integer b;
    private Integer brightness;
}
