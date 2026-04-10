package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class EtaProScrapeJobDto extends BaseDto {
    private String mode;          // HISTORY or LIVE
    private String status;        // PENDING, RUNNING, COMPLETE, FAILED, CANCELLED
    private LocalDateTime rangeStart;
    private LocalDateTime rangeEnd;
    private List<String> pointIds;
    private int batchesTotal;
    private int batchesCompleted;
    private long readingsImported;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
}
