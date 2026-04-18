package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EtaProReportExecutionDto extends BaseDto {
    private Long reportId;
    private String reportName;
    private String status;
    private String paramsJson;
    private String summaryJson;
    private String resultPayloadJson;
    private int progress;
    private int instancesFound;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;
    private String errorMessage;
}
