package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

/**
 * Compact projection of a FieldListItem for the insulation contractor PWA. Deliberately
 * omits internal state (sync flags, record type — always WO here, hrefs) to keep the
 * contractor view minimal and safe to expose to an external-user role.
 */
@Data
public class PwaInsulationItemDto {
    private Long id;
    private String title;
    private String notes;
    private String specificLocation;
    private String locationName;
    private String equipmentTag;
    private String submitterName;
    private String dateObserved;
    private String timeObserved;
    /** WO number (wonum, e.g. "J26-41830") — the contractor sees it so they can cross-ref in Maximo. */
    private String maximoWonum;
    /** WO status — WAPPR/APPR/INPRG mainly; shown as a colored pill in the UI. */
    private String maximoStatus;
}
