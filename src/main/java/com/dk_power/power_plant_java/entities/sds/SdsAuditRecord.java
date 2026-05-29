package com.dk_power.power_plant_java.entities.sds;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

/**
 * An append-only audit event for an {@link SdsChemical}, recorded during an audit campaign.
 * <p>
 * SharePoint-backed (its own "SDS Audit" list) so auditing works independently of the hub — the PWA
 * writes records via Power Automate when the hub is offline, the hub via certificate when online, and
 * they sync back to desktops for a history view. All fields are scalar (no ManyToOne), so the
 * pre-edit values are kept as a JSON string in {@code oldSnapshot} rather than relations.
 */
@Entity
@Table(name = "sds_audit_record", indexes = {
        @Index(name = "idx_sds_audit_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_sds_audit_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_sds_audit_campaign", columnList = "campaign"),
        @Index(name = "idx_sds_audit_chem_uuid", columnList = "chemicalLocalUuid")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class SdsAuditRecord extends BaseAuditEntity {

    /** Reference to the audited chemical's SharePoint list-item id (if known). */
    private String chemicalSharepointId;

    /** Reference to the audited chemical's localUuid (stable across instances). */
    private String chemicalLocalUuid;

    /** Denormalized primary name of the chemical, for display in the audit history. */
    private String chemicalName;

    /** "Confirmed" (data verified, no change) or "Edited" (data changed). */
    private String action;

    /** JSON of the chemical's pre-edit values (null/empty for Confirmed). */
    @Column(columnDefinition = "TEXT")
    private String oldSnapshot;

    private String auditedByName;

    private String auditedByEmail;

    private Instant auditedAt;

    @Column(columnDefinition = "TEXT")
    private String comments;

    /** Audit campaign label (e.g. "2026 Annual"). */
    private String campaign;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;
}
