package com.dk_power.power_plant_java.entities.sds;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

/**
 * A Safety Data Sheet (SDS) chemical record.
 * <p>
 * A chemical can have several names/aliases and be stored in several locations.
 * Both are kept as newline-delimited TEXT (see {@code names} / {@code locations}) so the
 * field-level CRDT sync and the flat SharePoint columns map cleanly without lazy-init issues.
 * <p>
 * {@code bookNumber} + {@code sectionNumber} form the physical "address" of the filed SDS
 * ("Section" = the laminated title number on the physical sheet). The address is suggested by
 * {@code SdsAddressService} (latest book, next section) and approved/edited by the user.
 * {@code lastAuditedAt} drives the periodic audit list.
 */
@Entity
@Table(name = "sds_chemical", indexes = {
        @Index(name = "idx_sds_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_sds_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_sds_status", columnList = "status_id"),
        @Index(name = "idx_sds_book_number", columnList = "bookNumber")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class SdsChemical extends BaseAuditEntity {

    /** Newline-delimited chemical names / aliases. First line is the primary name. */
    @Column(columnDefinition = "TEXT")
    private String names;

    /** Newline-delimited storage locations. */
    @Column(columnDefinition = "TEXT")
    private String locations;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private Value status;

    /** Physical book this SDS is filed in (assigned on the hub). */
    private Integer bookNumber;

    /** Per-book section number (the laminated title number; the chemical's index within its book). */
    private Integer sectionNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String processedByName;

    private String processedByEmail;

    private Instant processedAt;

    /** Last time this chemical was audited (drives the audit list). */
    private Instant lastAuditedAt;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;

    private String submitterName;

    private String submitterEmail;

    private String submitterPhone;
}
