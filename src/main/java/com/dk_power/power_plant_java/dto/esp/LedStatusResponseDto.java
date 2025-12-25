package com.dk_power.power_plant_java.dto.esp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LedStatusResponseDto {
    private List<LedBoxStatusDto> boxes;
}
