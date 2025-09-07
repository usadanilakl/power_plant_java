package com.dk_power.power_plant_java.dto.permits;

import com.azure.core.annotation.Get;
import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
@Getter
@Setter
public class JobLogDto extends BaseDto {
    private Set<DailyPermitPackageDto> packages = new HashSet<>();
}
