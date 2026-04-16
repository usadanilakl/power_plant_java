package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateGroupDto {
    private String normalizedTag;
    private List<LotoPointDto> points;
}
