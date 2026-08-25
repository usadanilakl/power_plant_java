package com.dk_power.power_plant_java.repository.messaging;

import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepo extends BaseRepository<Message> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    /**
     * Find duplicate message groups: same (conversationId, senderId, sentAt, content hash).
     * Returns rows of [conversationId, senderId, sentAt, count].
     */
    @Query("""
        SELECT m.conversation.id, m.senderId, m.sentAt, COUNT(m)
        FROM Message m
        WHERE m.deleted = false
        GROUP BY m.conversation.id, m.senderId, m.sentAt, m.content
        HAVING COUNT(m) > 1
        """)
    List<Object[]> findDuplicateMessageGroups();

    /**
     * Find all messages matching a specific dedup key, ordered by ID ascending.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.senderId = :senderId
          AND m.sentAt = :sentAt
          AND m.content = :content
          AND m.deleted = false
        ORDER BY m.id ASC
        """)
    List<Message> findByDedupKeyOrderByIdAsc(
        @Param("conversationId") Long conversationId,
        @Param("senderId") Long senderId,
        @Param("sentAt") java.time.LocalDateTime sentAt,
        @Param("content") String content);

    /**
     * Find all messages for a partial dedup key (conversationId, senderId, sentAt), ordered by ID.
     * Used by MessageMergeService to group by content in memory.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.senderId = :senderId
          AND m.sentAt = :sentAt
          AND m.deleted = false
        ORDER BY m.id ASC
        """)
    List<Message> findByConversationIdAndSenderIdAndSentAt(
        @Param("conversationId") Long conversationId,
        @Param("senderId") Long senderId,
        @Param("sentAt") java.time.LocalDateTime sentAt);

    /**
     * Unread messages in a conversation NOT sent by the given user — the ones markRead flips.
     * Callers load these and setIsRead(true)+save each so @PostUpdate fires and the read-state
     * change emits a FieldChange (read receipts converge across the user's devices). The old
     * bulk JPQL UPDATE was removed because it never triggered the listener, so read state
     * silently diverged between nodes.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.senderId <> :userId
          AND m.isRead = false
        """)
    List<Message> findUnreadIncoming(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId);
}
