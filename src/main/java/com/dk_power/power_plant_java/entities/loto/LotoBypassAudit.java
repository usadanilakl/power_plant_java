package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One "Red Tag Bypass" event: a CA-authorised state change or field patch on a
 * LOTO that skipped the normal lifecycle gates (approvals, walkdown, verify,
 * personnel sign-off, etc.).
 *
 * <p>Every bypass invocation writes exactly one row, whether triggered from the
 * manual "Red Tag Bypass" button on the LOTO form ({@code source = "MANUAL"})
 * or as part of applying a Red-Tag state-sync diff plan
 * ({@code source = "STATE_SYNC"}).
 *
 * <p>Extends {@link BaseIdEntity} so the audit rows sync across devices — a CA
 * on another desktop should see the same bypass history without a separate
 * export step. Not user-editable after the fact; the {@code deleted} flag on
 * BaseIdEntity is inherited but should never be set here.
 */
@Entity
@Table(name = "loto_bypass_audit", indexes = {
        // Timeline view scoped to one LOTO — hottest read path.
        @Index(name = "idx_lba_loto_id", columnList = "loto_id"),
        // Global timeline / "who bypassed today" reports.
        @Index(name = "idx_lba_at_time", columnList = "at_time"),
})
@Getter
@Setter
@NoArgsConstructor
public class LotoBypassAudit extends BaseIdEntity {

    /** ID of the LOTO the bypass acted on. Never null. */
    @Column(name = "loto_id", nullable = false)
    private Long lotoId;

    /** LOTO's permit number at the time of bypass — a stable label independent of later renames. */
    @Column(length = 64)
    private String lotoPermitNumber;

    /** Wall-clock time the bypass was applied server-side. */
    @Column(name = "at_time", nullable = false)
    private Instant atTime;

    /** Username of the CA who triggered the bypass — email under our Spring config. */
    @Column(length = 128)
    private String byUser;

    /** Local permit status before the bypass ("Building" / "Active" / "Test" / "Closed"), or null. */
    @Column(length = 32)
    private String fromStatus;

    /** Local permit status after the bypass, or null if the bypass only patched fields. */
    @Column(length = 32)
    private String toStatus;

    /** Free-text reason supplied by the CA. Required by the service; enforced upstream. */
    @Column(columnDefinition = "TEXT")
    private String reason;

    /** Trigger source — "MANUAL" (button on LOTO form) or "STATE_SYNC" (applied from a diff plan). */
    @Column(length = 24)
    private String source;

    /** Comma-separated field names that were mutated (permitStatus, workScope, lotoRequestor, boxNumber, redTagNum). */
    @Column(length = 512)
    private String changedFields;
}
