package com.dk_power.power_plant_java.entities.instrumentation;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(
    name = "instrument",
    indexes = {
        @Index(name = "idx_instrument_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_instrument_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_instrument_tag_number", columnList = "tagNumber")
    }
)
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class Instrument extends BaseAuditEntity {
    // NOT @Column(unique=true): the deterministic-coexist dedup path lets a duplicate tagNumber INSERT and
    // coexist just long enough for the hub-only InstrumentMergeService to merge it (same pattern as
    // Category/Value, which also have no DB uniqueness — merge-service convergence handles it). A unique
    // index would turn that transient coexist into an INSERT poison-pill that aborts the whole apply batch.
    // The existing idx_instrument_tag_number index (non-unique) still serves lookups. Existing DBs' stale
    // unique index is dropped at startup by InstrumentTagUniqueConstraintFixer.
    private String tagNumber;
    private String description;
    private String vendor;
    private String location;
    private String type;
    private String currentStatus;
    private String lastUpdatedDate;
    private String lastUpdatedTime;
    private String lastUpdatedBy;
    @Column(length = 4000)
    private String lastComment;
    private String sharepointId;
    private String localUuid;
}
