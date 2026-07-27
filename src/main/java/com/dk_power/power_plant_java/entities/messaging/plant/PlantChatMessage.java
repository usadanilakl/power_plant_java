package com.dk_power.power_plant_java.entities.messaging.plant;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Hub-local audit mirror of {@code public.plant_chat_message}. See {@link PlantConversation} for
 * why chat entities are {@code @LocalOnlyEntity} — they never round-trip through the CRDT sync
 * stream; Supabase Realtime is the primary transport.
 */
@Entity
@Table(name = "plant_chat_message", indexes = {
        @Index(name = "idx_pcm_supabase_id", columnList = "supabase_id", unique = true),
        @Index(name = "idx_pcm_conv_sent", columnList = "conversation_supabase_id,sent_at_supabase"),
        @Index(name = "idx_pcm_sent_at", columnList = "sent_at_supabase"),
})
@LocalOnlyEntity(reason = "Hub-only audit mirror of Supabase chat table.")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@Where(clause = "deleted IS NOT TRUE")
public class PlantChatMessage extends BaseIdEntity {

    @Column(name = "supabase_id", nullable = false, unique = true, length = 40)
    private String supabaseId;

    @Column(name = "conversation_supabase_id", nullable = false, length = 40)
    private String conversationSupabaseId;

    @Column(name = "sender_supabase_uuid", nullable = false, length = 40)
    private String senderSupabaseUuid;

    /** Resolved hub User.id, populated by the drainer via user_link lookup — nullable if unresolvable. */
    @Column(name = "sender_hub_user_id")
    private Long senderHubUserId;

    @Column(name = "sender_display_name", nullable = false)
    private String senderDisplayName;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    @Column(name = "is_important", nullable = false)
    private Boolean isImportant = Boolean.FALSE;

    @Builder.Default
    @Column(name = "requires_ack", nullable = false)
    private Boolean requiresAck = Boolean.FALSE;

    @Column(name = "sent_at_supabase", nullable = false)
    private LocalDateTime sentAtSupabase;

    @Column(name = "edited_at_supabase")
    private LocalDateTime editedAtSupabase;

    @Column(name = "deleted_at_supabase")
    private LocalDateTime deletedAtSupabase;
}
