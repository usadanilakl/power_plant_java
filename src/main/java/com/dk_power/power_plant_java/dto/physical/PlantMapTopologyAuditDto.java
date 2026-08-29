package com.dk_power.power_plant_java.dto.physical;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlantMapTopologyAuditDto {
    private int scannedConnections;
    private int removedTerminals;
    private int deletedConnections;
    private int deletedOrphanPipePlacements;
}
