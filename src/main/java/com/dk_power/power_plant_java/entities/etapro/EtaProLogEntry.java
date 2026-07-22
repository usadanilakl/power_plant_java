package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * A single EtaPRO Event Log (operator/shift log) entry, scraped via the EPLog template.
 *
 * <p>Unlike {@link EtaProReading} (numeric point values), this is a text record. EtaPRO's
 * EPLog dialog exposes no Event ID output column, so rows are deduplicated on a composite
 * natural key (Create Time + Description + Created By) hashed into {@link #dedupKey}.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
@Table(indexes = {
        @Index(name = "idx_etapro_log_dedup", columnList = "dedupKey"),
        @Index(name = "idx_etapro_log_create_time", columnList = "createTime"),
        @Index(name = "idx_etapro_log_session", columnList = "scrapeSessionId")
})
@com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity(reason =
        "historian operator-log data; collected on explicit request and re-pullable from the EtaPRO "
        + "historian, so it is kept per-node and NEVER synced (alongside EtaProReading)")
public class EtaProLogEntry extends BaseIdEntity {

    /** Free-text entry body; can be long and multi-line (newlines flattened to " | " on scrape). */
    @Lob
    private String description;

    private String area;
    private String location;

    /** EtaPRO "Created By" (the operator) — distinct from the audit createdBy on BaseAuditEntity. */
    private String createdByName;

    /** EtaPRO Create Time (converted from the Excel serial date in the scraped CSV). */
    private LocalDateTime createTime;

    private String deactivatedBy;
    private LocalDateTime deactivateTime;
    private String crew;

    /** SHA-256 hex of (createTime|description|createdByName) — dedup key (no Event ID available). */
    @Column(length = 64)
    private String dedupKey;

    private String scrapeSessionId;
}
