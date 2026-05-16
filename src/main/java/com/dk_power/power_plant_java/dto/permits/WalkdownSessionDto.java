package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class WalkdownSessionDto extends BaseDto {
    private Long lotoId;
    private String crewName;
    private String startedBy;
    private LocalDateTime startedAt;
    private String completedBy;
    private LocalDateTime completedAt;
    private boolean completed;
    private String sessionNotes;
    private Map<Long, WalkdownSession.PointState> pointStates = new HashMap<>();
}
