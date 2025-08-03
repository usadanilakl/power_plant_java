package com.dk_power.power_plant_java.dto.browser;

import lombok.Data;

import java.util.Set;

@Data
public class BrHeatTrace {
    private Long id;
    private String tagNumber;

    private String panelNumber;
    private String panelLocation;
    private Long panelSchedule;

    private String breaker;
    private String breakerTagNumber;

    private Long isometric;
    private Set<Long> pids;
    private Set<Long> equipmentList;
    private Set<Long> possiblyRelatedEquipmentList;
    private Long lotoPointId;
}
