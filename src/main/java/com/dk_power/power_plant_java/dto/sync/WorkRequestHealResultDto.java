package com.dk_power.power_plant_java.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkRequestHealResultDto {
    private boolean hubAvailable;
    private boolean sharePointAvailable;
    private int repairedCreateHistory;
    private int importedFromSharePoint;
    private int importedFromHub;
    private int localCount;
    private String message;
}
