package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobLogDto extends BaseDto {
    private Set<DailyPermitPackageDto> packages = new HashSet<>();
    private String workScope;
    private String company;
    private String foreman;
    private String location;
    private String startDate;
    private String endDate;
    private String permitNumber;
    private ValueDto jobStatus;
    private NgWorkRequestDto originatingWorkRequest;
    private WorkAreaDto workArea;
    private ValueDto workCategory;
}
