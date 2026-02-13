package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.Jha;
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
public class JhaMergeService {

    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate JHAs that share the same sharepointId.
     * Called after a sync batch is applied.
     *
     * Temporarily clears SyncContext so dedup changes are tracked
     * by FieldChangeEntityListener and synced to other machines.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = mergeJhas();
            if (merged > 0) {
                log.info("[JHA Merge] {} duplicates deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    @SuppressWarnings("unchecked")
    private int mergeJhas() {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT sharepoint_id, COUNT(*) FROM jha " +
            "WHERE deleted = false AND sharepoint_id IS NOT NULL " +
            "GROUP BY sharepoint_id HAVING COUNT(*) > 1")
            .getResultList();

        if (duplicates.isEmpty()) {
            log.debug("[JHA Merge] No duplicates found");
        } else {
            log.info("[JHA Merge] Found {} sharepointId groups with duplicates", duplicates.size());
        }

        int merged = 0;
        for (Object[] row : duplicates) {
            String sharepointId = (String) row[0];
            int count = ((Number) row[1]).intValue();
            log.info("[JHA Merge] sharepointId='{}' has {} copies", sharepointId, count);
            merged += mergeBySharepointId(sharepointId);
        }
        return merged;
    }

    private int mergeBySharepointId(String sharepointId) {
        List<Jha> jhas = entityManager.createQuery(
            "SELECT j FROM Jha j WHERE j.sharepointId = :spId " +
            "AND j.deleted = false ORDER BY j.id",
            Jha.class)
            .setParameter("spId", sharepointId)
            .getResultList();

        if (jhas.size() <= 1) return 0;

        Jha canonical = jhas.get(0);
        int merged = 0;

        for (int i = 1; i < jhas.size(); i++) {
            Jha duplicate = jhas.get(i);

            // Soft-delete via JPA so FieldChangeEntityListener fires
            duplicate.setDeleted(true);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.info("[JHA Merge] sharepointId='{}' ID={} merged into ID={}",
                sharepointId, duplicate.getId(), canonical.getId());
        }

        return merged;
    }
}
