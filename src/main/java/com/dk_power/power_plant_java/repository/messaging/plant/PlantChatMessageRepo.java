package com.dk_power.power_plant_java.repository.messaging.plant;

import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatMessage;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PlantChatMessageRepo extends BaseRepository<PlantChatMessage> {

    Optional<PlantChatMessage> findFirstBySupabaseId(String supabaseId);

    /** Max sent-at across the mirror — used as the audit-drain checkpoint. */
    @Query("select max(m.sentAtSupabase) from PlantChatMessage m")
    LocalDateTime maxSentAtSupabase();

    Page<PlantChatMessage> findByConversationSupabaseIdOrderBySentAtSupabaseDesc(
            String conversationSupabaseId, Pageable pageable);

    /**
     * Case-insensitive audit search over {@code content}. Native SQL so it bypasses the entity's
     * {@code @Where(deleted IS NOT TRUE)} clause — the audit view MUST show every row, including
     * ones that might get soft-deleted via the JPA {@code deleted} boolean (durable evidence trail
     * is the whole point of the audit). Also renders Supabase-side deleted messages (marked with
     * {@code deleted_at_supabase}) so admins can see the pre-delete content.
     *
     * <p>Not a real tsvector index — plant chat volume doesn't warrant it yet.
     */
    @Query(value = """
        select * from plant_chat_message m
         where (cast(:conversationSupabaseId as varchar) is null or m.conversation_supabase_id = cast(:conversationSupabaseId as varchar))
           and (cast(:senderSupabaseUuid as varchar) is null or m.sender_supabase_uuid = cast(:senderSupabaseUuid as varchar))
           and (cast(:fromTs as timestamp) is null or m.sent_at_supabase >= cast(:fromTs as timestamp))
           and (cast(:toTs as timestamp) is null or m.sent_at_supabase <= cast(:toTs as timestamp))
           and (cast(:q as varchar) is null or lower(m.content) like concat('%', lower(cast(:q as varchar)), '%'))
         order by m.sent_at_supabase desc
        """,
        countQuery = """
        select count(*) from plant_chat_message m
         where (cast(:conversationSupabaseId as varchar) is null or m.conversation_supabase_id = cast(:conversationSupabaseId as varchar))
           and (cast(:senderSupabaseUuid as varchar) is null or m.sender_supabase_uuid = cast(:senderSupabaseUuid as varchar))
           and (cast(:fromTs as timestamp) is null or m.sent_at_supabase >= cast(:fromTs as timestamp))
           and (cast(:toTs as timestamp) is null or m.sent_at_supabase <= cast(:toTs as timestamp))
           and (cast(:q as varchar) is null or lower(m.content) like concat('%', lower(cast(:q as varchar)), '%'))
        """,
        nativeQuery = true)
    Page<PlantChatMessage> search(
            @Param("conversationSupabaseId") String conversationSupabaseId,
            @Param("senderSupabaseUuid") String senderSupabaseUuid,
            @Param("fromTs") LocalDateTime from,
            @Param("toTs") LocalDateTime to,
            @Param("q") String q,
            Pageable pageable);
}
