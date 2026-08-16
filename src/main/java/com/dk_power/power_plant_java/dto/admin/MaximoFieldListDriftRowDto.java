package com.dk_power.power_plant_java.dto.admin;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One row of the drift dashboard. Carries just enough for an admin to identify a stuck
 * item and jump to the underlying record — the JG Portal panel links back to the field
 * list detail view and (when present) the Maximo href.
 */
@Data
@NoArgsConstructor
public class MaximoFieldListDriftRowDto {
    private Long id;
    private String title;
    /** FieldListType name (e.g. "Insulation Removal"). Null-safe for legacy rows without a type. */
    private String listTypeName;
    /** Local FieldListStatus name (e.g. "Open", "In Progress", "Closed"). */
    private String localStatus;
    /** "SR" or "WO" (null on legacy rows never routed to Maximo). */
    private String maximoRecordType;
    /** SR ticketid or WO wonum. */
    private String maximoRecordId;
    /** Last-seen Maximo status. */
    private String maximoStatus;
    /** Best-effort backfill flag. */
    private Boolean maximoSyncPending;
    /** Best-effort cancel backfill flag. */
    private Boolean maximoCancelPending;
    /** Best-effort complete backfill flag (WO COMP failed after local Closed). */
    private Boolean maximoCompletePending;
    /** Local dateModified — used to compute bucket age. */
    private LocalDateTime dateModified;
    /** Who submitted this field list — useful when triaging a stuck item. */
    private String submitterName;
    /** True when the row is soft-deleted (relevant for {@code cancelPending} bucket). */
    private Boolean deleted;
}
