package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.entities.loto.WalkdownChecklist;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class WalkdownChecklistDto extends BaseDto {
    private Long lotoId;
    private Long lotoSnapshotId;
    private String requestedBy;
    private LocalDateTime requestedAt;
    private String completedBy;
    private LocalDateTime completedAt;
    private boolean completed;
    private String notes;
    private Map<Long, WalkdownChecklist.PointState> pointStates = new HashMap<>();
}
