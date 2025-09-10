package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.*;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@NoArgsConstructor
public class DailyPermitPackageDto extends BaseDto {
    private List<NgWorkRequestDto> workRequests = new ArrayList<>();
    private List<SafeWorkDto> safeWorks = new ArrayList<>();
    private List<HotWorkDto> hotWorks = new ArrayList<>();
    private List<ConfinedSpaceDto> confinedSpaces = new ArrayList<>();
    private List<LotoDto> lotos = new ArrayList<>();
}
