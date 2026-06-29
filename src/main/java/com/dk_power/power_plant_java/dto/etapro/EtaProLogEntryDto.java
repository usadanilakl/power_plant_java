package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EtaProLogEntryDto extends BaseDto {
    private String description;
    private String area;
    private String location;
    private String createdByName;
    private LocalDateTime createTime;
    private String deactivatedBy;
    private LocalDateTime deactivateTime;
    private String crew;
    private String dedupKey;
    private String scrapeSessionId;
}
