package com.dk_power.power_plant_java.entities.field_list;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Entity
@Table(name = "field_list_item", indexes = {
        @Index(name = "idx_fli_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_fli_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_fli_list_type", columnList = "list_type_id"),
        // Indexes for the Maximo backfill + status-poll queries — both are
        // hot-path lookups run on every scheduler tick. Composite on (recordType,
        // recordId) because the poller reconciles by (type, id) — SR ticketids
        // and WO wonums live in the same column but have overlapping formats
        // conceivable in edge cases, so type discriminates.
        @Index(name = "idx_fli_maximo_record", columnList = "maximoRecordType,maximoRecordId"),
        @Index(name = "idx_fli_maximo_sync_pending", columnList = "maximoSyncPending"),
        @Index(name = "idx_fli_maximo_cancel_pending", columnList = "maximoCancelPending"),
        @Index(name = "idx_fli_maximo_complete_pending", columnList = "maximoCompletePending")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class FieldListItem extends BaseAuditEntity {

    @ManyToOne
    @JoinColumn(name = "list_type_id")
    private Value listType;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private Value status;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Value location;

    private String specificLocation;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String dateObserved;

    private String timeObserved;

    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne
    @JoinColumn(name = "loto_point_id")
    private LotoPoint lotoPoint;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;

    private String submitterName;

    private String submitterEmail;

    private String submitterPhone;

    // === Maximo bridge (v1 — see project/features/maximo/field-list-sr.md) ===
    // Populated when this field list is routed to Maximo. Null until a successful
    // create; presence of maximoRecordId is the idempotency key guarding against
    // double-create on retry. Routing dispatches between SR and WO based on
    // maximo.field-list.route-to-wo-types config — the recordType column records
    // which lifecycle a row is on so cancel/status-poll/complete dispatch correctly.

    /**
     * Human-readable Maximo record id:
     * — for SR: ticketid (e.g. "12345"; numeric on this tenant)
     * — for WO: wonum (e.g. "J26-41830"; siteid-prefixed alphanumeric)
     * Different formats in practice, but paired with {@link #maximoRecordType} to be unambiguous.
     */
    private String maximoRecordId;

    /**
     * Discriminator for {@link #maximoRecordId}: "SR" or "WO". Determines which Maximo
     * adapter handles cancel/complete/status-poll for this row. Null when the row hasn't
     * been routed to Maximo (feature off, or create hasn't been attempted yet).
     */
    private String maximoRecordType;

    /** Maximo OSLC href identifier (e.g. "_U1IvMTAwMg--"). Needed for PATCH/action calls. Works for both SR and WO. */
    private String maximoHref;

    /**
     * Last-seen Maximo status. Value domain depends on {@link #maximoRecordType}:
     * — SR: NEW / CLOSED / CANCELLED
     * — WO: WAPPR / APPR / INPRG / COMP / CLOSE / CAN
     * Updated by the status-poll scheduler.
     */
    private String maximoStatus;

    /** True when a Maximo create attempt failed and the backfill loop should retry. */
    private Boolean maximoSyncPending;

    /** True when this row was locally deleted but the cancel call failed and needs retry. */
    private Boolean maximoCancelPending;

    /**
     * True when the local status flipped to the wo-completion-status trigger AND the
     * {@code bridge.complete()} call failed (Maximo unreachable, transient error). The
     * backfill loop retries at the same cadence as create/cancel. WO-only — the SR
     * lifecycle is planner-driven in Maximo, so an SR that stays open when locally
     * closed is not drift-to-retry, just planner backlog.
     */
    private Boolean maximoCompletePending;

    /**
     * Optional Maximo LOCATIONS code (e.g. "00-FGS-VLV", "02-FDW-BFPMP"). When set, the
     * bridge sends it on WO/SR create as spi:location. Frontend picker populates this
     * (deferred wiring — backend accepts it whenever the field arrives in the DTO).
     * Ops can also fill it in Maximo on triage if left null.
     */
    private String maximoLocation;

    /**
     * Optional Maximo asset number. Sent on SR create as spi:assetnum. When both maximoLocation
     * and maximoAssetnum are set, Maximo uses the asset's location as the SR/WO location.
     */
    private String maximoAssetnum;

    // === Insulation-contractor offline close mechanism ===
    // Populated by the SP-import polling when it sees SharePoint's ContractorCompleted=true
    // (the contractor closed the item via PWA→PA→SP while hub was unreachable). The hub's
    // event listener uses this transition to fire bridge.complete() and COMP the WO on
    // Maximo. See project/features/maximo/field-list-sr.md.

    /** Contractor identity (Supabase user handle / email) from the PWA offline-close flow. */
    private String contractorCompletedBy;

    /** ISO datetime string of when the contractor closed the item offline. Matches DateObserved storage shape. */
    private String contractorCompletedAt;
}
