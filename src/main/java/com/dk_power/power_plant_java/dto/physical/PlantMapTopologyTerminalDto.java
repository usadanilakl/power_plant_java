package com.dk_power.power_plant_java.dto.physical;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PlantMapTopologyTerminalDto {
    private Long pipeNodeId;
    /** Stable geometry identity only: A is points[0], B is points[last]. */
    private String end;
    private Long sectionId;
}
