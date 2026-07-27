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
     * Case-insensitive full-text-ish search over {@code content}. Used by the hub-side search UI.
     * Not a real tsvector index — plant chat volume doesn't warrant it yet.
     */
    @Query("""
        select m from PlantChatMessage m
         where (:conversationSupabaseId is null or m.conversationSupabaseId = :conversationSupabaseId)
           and (:senderSupabaseUuid is null or m.senderSupabaseUuid = :senderSupabaseUuid)
           and (:from is null or m.sentAtSupabase >= :from)
           and (:to is null or m.sentAtSupabase <= :to)
           and (:q is null or lower(m.content) like concat('%', lower(:q), '%'))
         order by m.sentAtSupabase desc
        """)
    Page<PlantChatMessage> search(
            @Param("conversationSupabaseId") String conversationSupabaseId,
            @Param("senderSupabaseUuid") String senderSupabaseUuid,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("q") String q,
            Pageable pageable);
}
