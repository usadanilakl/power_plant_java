package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkSearchMatchDto {
    private String detectedTag;
    private String matchType;
    private List<LotoPointDtoLight> matchingPoints;
}
