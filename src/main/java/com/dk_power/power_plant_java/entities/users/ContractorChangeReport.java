package com.dk_power.power_plant_java.entities.users;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Snapshot of contractor changes detected between the live OnLocation roster and
 * the local User table (rows with a non-null {@code onLocationMemberId}).
 *
 * Produced by the hub's nightly reconciler and by manual scans triggered from
 * Electron. Sits in PENDING until an admin accepts (changes applied to User
 * rows) or rejects (report archived, no changes).
 */
@Entity
@Table(name = "contractor_change_reports",
       indexes = {
           @Index(name = "idx_ccr_status", columnList = "status"),
           @Index(name = "idx_ccr_run_at", columnList = "run_at")
       })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class ContractorChangeReport extends BaseIdEntity {

    public enum Status { PENDING, ACCEPTED, REJECTED }

    @Column(name = "run_at", nullable = false)
    private LocalDateTime runAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "source")
    private String source;

    /** JSON array of contractors present in OnLocation but missing from User table. */
    @Column(name = "added_json", columnDefinition = "TEXT")
    private String addedJson;

    /** JSON array of User rows tagged Contractor whose onLocationMemberId no longer appears in OnLocation. */
    @Column(name = "removed_json", columnDefinition = "TEXT")
    private String removedJson;

    /** JSON array of contractors whose name/email/phone/company differs between OnLocation and the User row. */
    @Column(name = "changed_json", columnDefinition = "TEXT")
    private String changedJson;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "accepted_by")
    private String acceptedBy;

    @Column(name = "summary")
    private String summary;
}
