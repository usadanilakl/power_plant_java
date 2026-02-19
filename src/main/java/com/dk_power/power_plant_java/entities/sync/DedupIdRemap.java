package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Persists dedup ID remappings across sync batches.
 * When a Value/Category/User from device B is dedup-redirected to an existing
 * entity on this device, the mapping (originalId → remappedId) is stored here
 * so future batches can resolve ManyToOne references to the original ID.
 */
@Entity
@Table(name = "dedup_id_remap", uniqueConstraints =
    @UniqueConstraint(columnNames = {"entityType", "originalId"}))
@Getter
@Setter
@NoArgsConstructor
public class DedupIdRemap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityType;

    @Column(nullable = false)
    private Long originalId;

    @Column(nullable = false)
    private Long remappedId;

    @Column(nullable = false)
    private Instant createdAt;

    public DedupIdRemap(String entityType, Long originalId, Long remappedId) {
        this.entityType = entityType;
        this.originalId = originalId;
        this.remappedId = remappedId;
        this.createdAt = Instant.now();
    }
}
