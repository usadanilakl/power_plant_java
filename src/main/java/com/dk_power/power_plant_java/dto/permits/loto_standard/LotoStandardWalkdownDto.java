package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/** Mobile verification/walkdown checklist state for one standard. Reuses the entity's simple value holders. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LotoStandardWalkdownDto {
    private Long standardId;
    private Integer standardVersion;
    private String startedBy;
    private LocalDateTime startedAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private Map<String, LotoStandardWalkdown.GlobalItem> globalItems;
    private Map<Long, LotoStandardWalkdown.PointChecklist> pointResults;
}
