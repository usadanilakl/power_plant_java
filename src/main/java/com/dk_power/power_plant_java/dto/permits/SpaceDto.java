package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;

@Data
public class SpaceDto {
    private Long id;
    private String sharepointId;
    private String space;
    private String status;
    private String co;
    private String oxygen;
    private String lel;
    private String h2s;
    private String nh3;
    private String testerName;
    private String lastStatusChange;
    private String meterSerialNumber;
}
