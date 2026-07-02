package com.dk_power.power_plant_java.entities.physical;

/**
 * Level of a {@link PhysicalObject} in the plant hierarchy
 * {@code Plant → Section → System → Skid → Equipment → Location}.
 *
 * <p>Maximo-seeded nodes get their type from the Maximo operating-location {@code spi:type} (or depth
 * heuristic) for hierarchy nodes, and {@link #EQUIPMENT} for {@code mxasset} rows. {@link #LOCATION}
 * covers hand-added, non-Maximo nodes such as building floors/levels used by the level selector.
 */
public enum PhysicalObjectType {
    PLANT,
    SECTION,
    SYSTEM,
    SKID,
    EQUIPMENT,
    LOCATION
}
