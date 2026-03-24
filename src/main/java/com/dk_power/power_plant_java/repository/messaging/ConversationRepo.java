package com.dk_power.power_plant_java.repository.messaging;

import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepo extends BaseRepository<Conversation> {

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND (c.initiatorId = :userId OR c.responderId = :userId)
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findVisibleByEntityAndUserOrderByLastMessageAtDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("userId") Long userId);

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.initiatorId = :userId OR c.responderId = :userId
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findVisibleByUserOrderByLastMessageAtDesc(@Param("userId") Long userId);

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.id = :conversationId
          AND (c.initiatorId = :userId OR c.responderId = :userId)
        """)
    Optional<Conversation> findVisibleByIdAndUser(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId);

    /**
     * Find duplicate conversation groups: same (entityType, entityId, initiatorId, responderId).
     * Returns rows of [entityType, entityId, initiatorId, responderId, count].
     */
    @Query("""
        SELECT c.entityType, c.entityId, c.initiatorId, c.responderId, COUNT(c)
        FROM Conversation c
        WHERE c.deleted = false
        GROUP BY c.entityType, c.entityId, c.initiatorId, c.responderId
        HAVING COUNT(c) > 1
        """)
    List<Object[]> findDuplicateConversationGroups();

    /**
     * Find all conversations matching a specific dedup key, ordered by ID ascending.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND c.initiatorId = :initiatorId
          AND c.responderId = :responderId
          AND c.deleted = false
        ORDER BY c.id ASC
        """)
    List<Conversation> findByDedupKeyOrderByIdAsc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("initiatorId") Long initiatorId,
        @Param("responderId") Long responderId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN c.initiatorId = :userId THEN c.initiatorUnreadCount ELSE c.responderUnreadCount END
        ), 0)
        FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND (c.initiatorId = :userId OR c.responderId = :userId)
        """)
    long sumUnreadForEntityAndUser(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("userId") Long userId);
}
