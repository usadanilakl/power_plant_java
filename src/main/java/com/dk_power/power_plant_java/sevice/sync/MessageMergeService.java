package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class MessageMergeService {

    private final MessageRepo messageRepo;
    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate Message records that share the same
     * (conversationId, senderId, sentAt, content) dedup key.
     *
     * Duplicates occur when the same message is created on two clients
     * before sync. Message is a leaf entity - nothing holds a FK to it,
     * so no FK transfers needed before soft-deleting.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = mergeMessages();
            if (merged > 0) {
                log.info("[Message Merge] {} duplicates deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    private int mergeMessages() {
        List<Object[]> duplicates = messageRepo.findDuplicateMessageGroups();

        if (duplicates.isEmpty()) {
            log.debug("[Message Merge] No duplicates found");
            return 0;
        }

        log.info("[Message Merge] Found {} dedup groups with duplicates", duplicates.size());

        int merged = 0;
        for (Object[] row : duplicates) {
            Long conversationId = (Long) row[0];
            Long senderId = (Long) row[1];
            LocalDateTime sentAt = (LocalDateTime) row[2];
            merged += mergeByPartialKey(conversationId, senderId, sentAt);
        }
        return merged;
    }

    private int mergeByPartialKey(Long conversationId, Long senderId, LocalDateTime sentAt) {
        List<Message> allMatches = messageRepo.findByConversationIdAndSenderIdAndSentAt(
            conversationId, senderId, sentAt);

        if (allMatches.size() <= 1) {
            return 0;
        }

        Map<String, List<Message>> byContent = new LinkedHashMap<>();
        for (Message message : allMatches) {
            byContent.computeIfAbsent(message.getContent(), key -> new ArrayList<>()).add(message);
        }

        int merged = 0;
        for (List<Message> group : byContent.values()) {
            if (group.size() <= 1) {
                continue;
            }

            Message canonical = group.get(0);
            for (int i = 1; i < group.size(); i++) {
                Message duplicate = group.get(i);
                duplicate.setDeleted(true);
                entityManager.merge(duplicate);
                entityManager.flush();
                merged++;

                log.info("[Message Merge] conversationId={} senderId={} ID={} merged into ID={}",
                    conversationId, senderId, duplicate.getId(), canonical.getId());
            }
        }
        return merged;
    }
}
