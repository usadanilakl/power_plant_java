package com.dk_power.power_plant_java.dto.physical;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PlantMapTopologyAttachRequest {
    private PlantMapTopologyTerminalDto terminal;
    private PlantMapTopologyTerminalDto targetTerminal;
    private PlantMapEquipmentPortRefDto equipmentPort;
    /** Optional deterministic key, used while migrating old off-page connectors. */
    private String connectionKey;
    private String kind;
}
