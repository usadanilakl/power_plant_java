package com.dk_power.power_plant_java.entities.fire_impairment;

public enum ProtectionIdentifier {
    U1_TURBINE_BUILDING_WATER_SUPPLY("U1 turbine building water supply"),
    U1_LUBE_OIL_TANK_SPRINKLERS("U1 lube oil tank sprinklers"),
    U1_ST_SPRINKLERS("U1 ST sprinklers"),
    U1_BASEMENT_SPRINKLERS("U1 basement sprinklers"),
    U1_CO2_PROTECTION_SYSTEM("U1 CO2 protection system"),
    U1_GT_ENCLOSURE_CO2_PROTECTION_SYSTEM("U1 GT enclosure CO2 protection system"),
    U1_SLIP_RING_CO2_PROTECTION_SYSTEM("U1 slip ring CO2 protection system"),
    U2_TURBINE_BUILDING_WATER_SUPPLY("U2 turbine building water supply"),
    U2_LUBE_OIL_TANK_SPRINKLERS("U2 lube oil tank sprinklers"),
    U2_ST_SPRINKLERS("U2 ST sprinklers"),
    U2_BASEMENT_SPRINKLERS("U2 basement sprinklers"),
    U2_CO2_PROTECTION_SYSTEM("U2 CO2 protection system"),
    U2_GT_ENCLOSURE_CO2_PROTECTION_SYSTEM("U2 GT enclosure CO2 protection system"),
    U2_SLIP_RING_CO2_PROTECTION_SYSTEM("U2 slip ring CO2 protection system"),
    AUX_BOILER_SPRINKLERS("Aux boiler sprinklers"),
    ADMIN_BUILDING_SPRINKLERS("Admin building sprinklers"),
    DIESEL_FIRE_PUMP("Diesel fire pump"),
    ELECTRIC_FIRE_PUMP("Electric fire pump");

    private final String displayValue;

    ProtectionIdentifier(String displayValue) {
        this.displayValue = displayValue;
    }

    public String getDisplayValue() {
        return displayValue;
    }
}
