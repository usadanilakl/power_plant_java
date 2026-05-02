package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SwPermits {
    private boolean lotoRequired;
    private String lotoDescription;
    private boolean confinedSpaceReclassified;
    private boolean confinedSpacePermitRequired;
    private String confinedSpaceDescription;
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
