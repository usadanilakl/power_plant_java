package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class VentingChecklist {
    private boolean personnelReadProcedure;
    private String personnelReadProcedureInitials;

    private boolean barricadeInPlace;
    private String barricadeInPlaceInitials;

    private boolean firefightingEquipment;
    private String firefightingEquipmentInitials;

    private boolean sparkProhibited;
    private String sparkProhibitedInitials;

    private boolean groundingStrapsInstalled;
    private String groundingStrapsInstalledInitials;

    private boolean combustibleGasIndicatorInPlace;
    private String combustibleGasIndicatorInPlaceInitials;

    private boolean reachedLessThan10PercentLEL;
    private String reachedLelInitials;
    private String indicatedPercentage;

    private boolean nonSparkingToolsUsed;
    private String nonSparkingToolsInitials;

    private boolean deviationsUnderstood;
    private String deviationsUnderstoodInitials;

    private String personnelNames;
}
