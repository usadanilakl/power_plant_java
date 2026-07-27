package com.dk_power.power_plant_java.entities.messaging.plant;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Hub-local audit mirror of {@code public.plant_conversation} in Supabase (see
 * {@code supabase/migrations/*_plant_chat.sql}). Written by {@code PlantChatAuditPollingService};
 * NEVER written from a hub REST endpoint (Electron/PWA write directly to Supabase — Option C in
 * {@code project/features/users/communication/plant-chat.md}).
 *
 * <p>{@code @LocalOnlyEntity} keeps this row out of the CRDT sync stream — desktops read chat
 * from Supabase Realtime directly, not from each other's H2. The mirror exists ONLY for the
 * hub-side search UI + long-term audit trail beyond Supabase free-tier retention.
 */
@Entity
@Table(name = "plant_conversation", indexes = {
        @Index(name = "idx_plant_conv_supabase_id", columnList = "supabase_id", unique = true),
})
@LocalOnlyEntity(reason = "Hub-only audit mirror of Supabase chat table. Chat is Supabase-authoritative; hub does not sync this to other nodes.")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@Where(clause = "deleted IS NOT TRUE")
public class PlantConversation extends BaseIdEntity {

    /** Supabase UUID — the true id. Used for cross-store dedup on drain. */
    @Column(name = "supabase_id", nullable = false, unique = true, length = 40)
    private String supabaseId;

    @Column(name = "conv_name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Builder.Default
    @Column(name = "is_editable", nullable = false)
    private Boolean isEditable = Boolean.FALSE;

    /** Supabase auth.users.id of the creator (UUID string). Resolve to hub User via user_link if needed. */
    @Column(name = "created_by_supabase_uuid", nullable = false, length = 40)
    private String createdBySupabaseUuid;

    /** Optional: resolved hub User.id, populated by the drainer via user_link lookup. */
    @Column(name = "created_by_hub_user_id")
    private Long createdByHubUserId;

    @Column(name = "created_at_supabase", nullable = false)
    private LocalDateTime createdAtSupabase;

    @Column(name = "updated_at_supabase", nullable = false)
    private LocalDateTime updatedAtSupabase;

    @Column(name = "archived_at_supabase")
    private LocalDateTime archivedAtSupabase;
}
