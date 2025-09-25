package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class SwPermits {
    private boolean lotoRequired;
    private String lotoDescription;
    private boolean confinedSpace;
    private boolean confinedSpaceDescription;
    private boolean hotWork;
    private String hotWorkDescription;
    private boolean ventingPurging;
    private String ventingPurgingDescription;
    private boolean jha;
    private boolean gasTesting;
    private boolean excavationPermit;
    private boolean energizedPermit;
    private boolean other;
}
