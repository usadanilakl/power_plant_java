package com.dk_power.power_plant_java.entities.messaging.plant;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Hub-local audit mirror of {@code public.plant_chat_ack}. Composite natural key
 * ({@code messageSupabaseId} + {@code userSupabaseUuid}) is stored as a single derived
 * {@code externalUuid} for the drainer's unique-index dedup.
 */
@Entity
@Table(name = "plant_chat_ack", indexes = {
        @Index(name = "idx_pca_external_uuid", columnList = "external_uuid", unique = true),
        @Index(name = "idx_pca_message", columnList = "message_supabase_id"),
        @Index(name = "idx_pca_user", columnList = "user_supabase_uuid"),
})
@LocalOnlyEntity(reason = "Hub-only audit mirror of Supabase chat table.")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@Where(clause = "deleted IS NOT TRUE")
public class PlantChatAck extends BaseIdEntity {

    /**
     * Composite dedup key: {@code messageSupabaseId + "|" + userSupabaseUuid}. Kept as a single
     * indexed column so the drainer can rely on a unique constraint for idempotent upsert without
     * a composite index the {@link jakarta.persistence.Index} annotation doesn't easily express.
     */
    @Column(name = "external_uuid", nullable = false, unique = true, length = 90)
    private String externalUuid;

    @Column(name = "message_supabase_id", nullable = false, length = 40)
    private String messageSupabaseId;

    @Column(name = "user_supabase_uuid", nullable = false, length = 40)
    private String userSupabaseUuid;

    /** Resolved hub User.id — nullable if the ack came from someone not yet linked. */
    @Column(name = "user_hub_user_id")
    private Long userHubUserId;

    @Column(name = "acked_at_supabase", nullable = false)
    private LocalDateTime ackedAtSupabase;
}
