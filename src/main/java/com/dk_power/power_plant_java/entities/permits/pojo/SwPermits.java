package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class SwPermits {
    private boolean lotoRequired;
    private boolean confinedSpace;
    private boolean hotWork;
    private boolean ventingPurging;
    private boolean jha;
    private boolean gasTesting;
    private boolean excavationPermit;
    private boolean energizedPermit;
    private boolean other;
}
