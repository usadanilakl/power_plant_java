package com.dk_power.power_plant_java.dto.physical;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PlantMapTopologyConnectionDto {
    private Long id;
    private String connectionKey;
    private String kind;
    private Long equipmentObjectId;
    private String equipmentPortId;
    private List<PlantMapTopologyTerminalDto> terminals = new ArrayList<>();
}
