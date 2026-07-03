package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class WorkAreaDto extends BaseDto {
    private String description;
    private ValueDto areaType;
    private SwHazards constantHazards;
    private HotWorkMeasures constantHotWorkMeasures;
    private ConfinedSpaceHazards constantConfinedSpaceHazards;
    private List<Long> constantLotoIds;
    private List<Long> locationIds;
    private Long shapeId;
    /** Plant tree anchor — the PhysicalObject node this work area is bound to (nullable). */
    private Long physicalObjectId;
}
