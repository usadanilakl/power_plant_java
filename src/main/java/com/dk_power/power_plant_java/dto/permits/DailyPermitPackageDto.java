package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class DailyPermitPackageDto extends BaseDto {
    private Set<SafeWorkDto> safeWorks = new HashSet<>();
    private Set<HotWorkDto> hotWorks = new HashSet<>();
    private Set<ConfinedSpaceDto> confinedSpaces = new HashSet<>();
    private Set<LotoDto> lotos = new HashSet<>();
}
