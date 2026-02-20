package com.dk_power.power_plant_java.repository.base_repositories;

import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository for EmailCorrespondence entity.
 * Supports polymorphic queries to find correspondence for any entity type.
 */
public interface EmailCorrespondenceRepo extends BaseRepository<EmailCorrespondence> {

    /**
     * Primary query - get all correspondence for an entity (like Comment)
     * @param entityType The type of entity (e.g., "WorkRequest", "LotoPoint")
     * @param entityId The ID of the entity
     * @return List of correspondence ordered by most recent first
     */
    List<EmailCorrespondence> findByEntityTypeAndEntityIdOrderBySentDateTimeDesc(
        String entityType, Long entityId);

    /**
     * Find correspondence by internet message ID (for email matching)
     * @param internetMessageId The Message-ID header value
     * @return List of matching correspondence
     */
    List<EmailCorrespondence> findByInternetMessageId(String internetMessageId);

    /**
     * Find correspondence by conversation ID (for email thread matching)
     * @param conversationId The conversation ID from Graph API
     * @return List of matching correspondence
     */
    List<EmailCorrespondence> findByConversationId(String conversationId);

    /**
     * Find correspondence by Graph message ID (to prevent duplicates)
     * @param graphMessageId The unique message ID from Graph API
     * @return Optional correspondence
     */
    Optional<EmailCorrespondence> findByGraphMessageId(String graphMessageId);

    /**
     * Count unread inbound correspondence for a specific entity
     * @param entityType The type of entity
     * @param entityId The ID of the entity
     * @return Count of unread inbound messages
     */
    @Query("SELECT COUNT(e) FROM EmailCorrespondence e " +
           "WHERE e.entityType = :entityType AND e.entityId = :entityId " +
           "AND e.direction = 'INBOUND' AND e.isRead = false")
    long countUnreadForEntity(@Param("entityType") String entityType,
                              @Param("entityId") Long entityId);

    /**
     * Find all unread correspondence (for dedicated page)
     * @param direction The direction filter (INBOUND or OUTBOUND)
     * @return List of unread correspondence ordered by most recent first
     */
    List<EmailCorrespondence> findByIsReadFalseAndDirectionOrderBySentDateTimeDesc(
        EmailCorrespondence.Direction direction);

    /**
     * Find unlinked correspondence (entityId is null) for retry matching.
     */
    List<EmailCorrespondence> findByEntityIdIsNull();

    /**
     * Find correspondence by stable SharePoint ID link (dedup-resilient query).
     */
    List<EmailCorrespondence> findByLinkedSharepointIdOrderBySentDateTimeDesc(String linkedSharepointId);

    /**
     * Find graphMessageIds that appear more than once (duplicates from multi-client polling).
     * Returns rows of [graphMessageId, count].
     */
    @Query("SELECT e.graphMessageId, COUNT(e) FROM EmailCorrespondence e " +
           "WHERE e.graphMessageId IS NOT NULL " +
           "GROUP BY e.graphMessageId HAVING COUNT(e) > 1")
    List<Object[]> findDuplicateGraphMessageIds();

    /**
     * Find all correspondence with the given graphMessageId, ordered by ID ascending.
     * Used to determine canonical (lowest ID) during deduplication.
     */
    List<EmailCorrespondence> findByGraphMessageIdOrderByIdAsc(String graphMessageId);
}
