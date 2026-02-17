package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
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
public class EmailCorrespondenceMergeService {

    private final EmailCorrespondenceRepo repo;
    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate EmailCorrespondence records that share the same graphMessageId.
     * Called after a sync batch is applied (in afterCommit callback).
     *
     * Duplicates occur when multiple clients independently poll the same inbox and both
     * create an INBOUND record for the same incoming email (same graphMessageId).
     * After sync, both records exist on all clients. This method keeps the lowest-ID
     * record (deterministic across all clients) and soft-deletes the rest.
     *
     * Only OUTBOUND emails (created by user action on a single client) and emails
     * without a graphMessageId are exempt — they cannot be duplicated this way.
     *
     * IMPORTANT: Temporarily clears SyncContext so dedup changes are tracked
     * by FieldChangeEntityListener and synced to other machines.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = mergeCorrespondence();
            if (merged > 0) {
                log.info("[EmailCorrespondence Merge] {} duplicates deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    private int mergeCorrespondence() {
        List<Object[]> duplicates = repo.findDuplicateGraphMessageIds();

        if (duplicates.isEmpty()) {
            log.debug("[EmailCorrespondence Merge] No duplicates found");
            return 0;
        }

        log.info("[EmailCorrespondence Merge] Found {} graphMessageId groups with duplicates",
            duplicates.size());

        int merged = 0;
        for (Object[] row : duplicates) {
            String graphMessageId = (String) row[0];
            merged += mergeByGraphMessageId(graphMessageId);
        }
        return merged;
    }

    private int mergeByGraphMessageId(String graphMessageId) {
        List<EmailCorrespondence> records = repo.findByGraphMessageIdOrderByIdAsc(graphMessageId);

        if (records.size() <= 1) return 0;

        EmailCorrespondence canonical = records.get(0); // lowest ID wins (deterministic)
        int merged = 0;

        for (int i = 1; i < records.size(); i++) {
            EmailCorrespondence duplicate = records.get(i);

            // EmailCorrespondence is a leaf entity — nothing else holds a FK to it,
            // so no FK transfers are needed before soft-deleting.
            // Soft-delete via JPA so FieldChangeEntityListener fires and creates
            // a FieldChange record — this ensures the deletion syncs to other machines.
            duplicate.setDeleted(true);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.info("[EmailCorrespondence Merge] graphMessageId='{}' ID={} merged into ID={}",
                graphMessageId, duplicate.getId(), canonical.getId());
        }

        return merged;
    }
}
