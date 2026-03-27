package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConversationMergeService {

    private final ConversationRepo conversationRepo;
    private final MessageRepo messageRepo;
    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate Conversation records that share the same
     * (entityType, entityId, initiatorId, subject) dedup key.
     *
     * Duplicates occur when two clients independently create a conversation
     * for the same entity with the same subject before sync.
     *
     * Keeps lowest-ID record (deterministic). Reassigns messages from
     * duplicate conversations to the canonical one, then soft-deletes duplicates.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = mergeConversations();
            if (merged > 0) {
                log.info("[Conversation Merge] {} duplicates deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    private int mergeConversations() {
        List<Object[]> duplicates = conversationRepo.findDuplicateConversationGroups();

        if (duplicates.isEmpty()) {
            log.debug("[Conversation Merge] No duplicates found");
            return 0;
        }

        log.debug("[Conversation Merge] Found {} dedup groups with duplicates", duplicates.size());

        int merged = 0;
        for (Object[] row : duplicates) {
            String entityType = (String) row[0];
            Long entityId = (Long) row[1];
            Long initiatorId = (Long) row[2];
            String subject = (String) row[3];
            merged += mergeByDedupKey(entityType, entityId, initiatorId, subject);
        }
        return merged;
    }

    private int mergeByDedupKey(String entityType, Long entityId, Long initiatorId, String subject) {
        List<Conversation> records = conversationRepo.findByDedupKeyOrderByIdAsc(
            entityType, entityId, initiatorId, subject);

        if (records.size() <= 1) return 0;

        Conversation canonical = records.get(0);
        int merged = 0;

        for (int i = 1; i < records.size(); i++) {
            Conversation duplicate = records.get(i);

            // Reassign messages from duplicate to canonical conversation
            List<Message> orphanedMessages = messageRepo.findByConversationIdOrderBySentAtAsc(duplicate.getId());
            for (Message msg : orphanedMessages) {
                msg.setConversation(canonical);
                entityManager.merge(msg);
            }

            // Recalculate unread counts on canonical
            if (duplicate.getInitiatorUnreadCount() > 0) {
                canonical.setInitiatorUnreadCount(
                    canonical.getInitiatorUnreadCount() + duplicate.getInitiatorUnreadCount());
            }
            if (duplicate.getResponderUnreadCount() > 0) {
                canonical.setResponderUnreadCount(
                    canonical.getResponderUnreadCount() + duplicate.getResponderUnreadCount());
            }

            // Update lastMessageAt if duplicate has a more recent message
            if (duplicate.getLastMessageAt() != null &&
                (canonical.getLastMessageAt() == null ||
                 duplicate.getLastMessageAt().isAfter(canonical.getLastMessageAt()))) {
                canonical.setLastMessageAt(duplicate.getLastMessageAt());
            }

            entityManager.merge(canonical);

            // Soft-delete duplicate via JPA so FieldChangeEntityListener fires
            duplicate.setDeleted(true);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.debug("[Conversation Merge] entityType='{}' entityId={} ID={} merged into ID={}",
                entityType, entityId, duplicate.getId(), canonical.getId());
        }

        return merged;
    }
}
