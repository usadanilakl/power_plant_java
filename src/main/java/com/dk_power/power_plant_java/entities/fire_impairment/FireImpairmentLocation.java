package com.dk_power.power_plant_java.entities.fire_impairment;

public enum FireImpairmentLocation {
    SITEWIDE("Sitewide"),
    ADMIN_BUILDING("Admin Building"),
    U1_TURBINE_BUILDING("U1 Turbine Building"),
    U2_TURBINE_BUILDING("U2 Turbine Building"),
    U1_ST_GENERATOR("U1 Steam Turbine"),
    U1_LUBE_OIL_TANK("U1 Lube Oil Tank"),
    U1_BASEMENT("U1 Basement"),
    U1_GT_ENCLOSURE("U1 Gas Turbine Enclosure"),
    U1_SLIP_RING_HOUSING("U1 Slip Ring Housing"),
    U2_ST_GENERATOR("U2 Steam Turbine"),
    U2_LUBE_OIL_TANK("U2 Lube Oil Tank"),
    U2_BASEMENT("U2 Basement"),
    U2_GT_ENCLOSURE("U2 Gas Turbine Enclosure"),
    U2_SLIP_RING_HOUSING("U2 Slip Ring Housing"),
    AUX_BOILER_BUILDING("Auxiliary Boiler Building");

    private final String displayName;

    FireImpairmentLocation(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
