package com.dk_power.power_plant_java.entities.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Node-local high-water mark for the Supabase metadata reconciliation job. Deliberately a plain
 * entity (NOT {@code BaseIdEntity}) so it carries no sync listener / soft-delete and never
 * propagates between hub and desktops — each node keeps its own checkpoints.
 *
 * <p>Two rows: {@code "hub_to_supabase"} (walks hub Users by dateModified, hub-local clock) and
 * {@code "supabase_to_hub"} (walks user_link by metadata_updated_at, UTC).
 */
@Entity
@Table(name = "supabase_sync_checkpoint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupabaseSyncCheckpoint {

    @Id
    @Column(name = "name", length = 64)
    private String name;

    @Column(name = "checkpoint_at")
    private LocalDateTime checkpointAt;
}
