package com.dk_power.power_plant_java.repository.messaging;

import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepo extends BaseRepository<Conversation> {

    /**
     * All conversations for an entity — visible to any operator.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findByEntityOrderByLastMessageAtDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId);

    /**
     * Conversations for an entity visible to a specific user
     * (user is initiator, or responderId is null meaning open to all operators, or user is responder).
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND (c.initiatorId = :userId OR c.responderId = :userId OR c.responderId IS NULL)
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findVisibleByEntityAndUserOrderByLastMessageAtDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("userId") Long userId);

    /**
     * All conversations where user is a participant (initiator or responder or open conversations).
     * For PWA contractors: filters by initiatorId only.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.initiatorId = :userId OR c.responderId = :userId
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findVisibleByUserOrderByLastMessageAtDesc(@Param("userId") Long userId);

    /**
     * Access check: user can access if they are initiator, responder, or conversation is open (null responderId).
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.id = :conversationId
          AND (c.initiatorId = :userId OR c.responderId = :userId OR c.responderId IS NULL)
        """)
    Optional<Conversation> findVisibleByIdAndUser(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId);

    /**
     * Strict participant check: user must be initiator OR responder (no open-conversation wildcard).
     * Used by PWA to prevent cross-contractor enumeration.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND (c.initiatorId = :userId OR c.responderId = :userId)
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findByEntityAndParticipantOrderByLastMessageAtDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("userId") Long userId);

    /**
     * Strict access check: user must be initiator OR responder (not open-conversation wildcard).
     */
    @Query("""
        SELECT COUNT(c) > 0 FROM Conversation c
        WHERE c.id = :conversationId
          AND (c.initiatorId = :userId OR c.responderId = :userId)
        """)
    boolean isUserParticipant(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId);

    /**
     * Find duplicate conversation groups: same (entityType, entityId, initiatorId, subject).
     */
    @Query("""
        SELECT c.entityType, c.entityId, c.initiatorId, c.subject, COUNT(c)
        FROM Conversation c
        WHERE c.deleted = false
        GROUP BY c.entityType, c.entityId, c.initiatorId, c.subject
        HAVING COUNT(c) > 1
        """)
    List<Object[]> findDuplicateConversationGroups();

    /**
     * Find all conversations matching dedup key, ordered by ID ascending.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND c.initiatorId = :initiatorId
          AND c.subject = :subject
          AND c.deleted = false
        ORDER BY c.id ASC
        """)
    List<Conversation> findByDedupKeyOrderByIdAsc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("initiatorId") Long initiatorId,
        @Param("subject") String subject);

    /**
     * Sum unread count for current user across conversations for an entity.
     * For initiator: use initiatorUnreadCount.
     * For others (operators): use responderUnreadCount.
     */
    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN c.initiatorId = :userId THEN c.initiatorUnreadCount ELSE c.responderUnreadCount END
        ), 0)
        FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.entityId = :entityId
          AND (c.initiatorId = :userId OR c.responderId = :userId OR c.responderId IS NULL)
        """)
    long sumUnreadForEntityAndUser(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("userId") Long userId);

    /**
     * All conversations of an entity type in a given status, newest activity first. The WO Q&A inbox uses this
     * (entityType='MaximoWorkOrder', status=OPEN) — a cheap local query over the already-synced Conversation
     * table, so the inbox never re-fetches Maximo.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.entityType = :entityType
          AND c.status = :status
        ORDER BY c.lastMessageAt DESC, c.id DESC
        """)
    List<Conversation> findByEntityTypeAndStatusOrderByLastMessageAtDesc(
        @Param("entityType") String entityType,
        @Param("status") Conversation.Status status);
}
