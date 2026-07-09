package com.dk_power.power_plant_java.dto.pwa;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PwaQualificationSeedResult {
    private int plantUsersFound;
    private int created;
    private int skipped;
    private int failed;
}
