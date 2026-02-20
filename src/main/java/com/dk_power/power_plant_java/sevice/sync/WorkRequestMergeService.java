package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
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
public class WorkRequestMergeService {

    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate WorkRequests that share the same sharepointId.
     * Called after a sync batch is applied (in afterCommit callback).
     *
     * Multiple clients pulling from SharePoint independently create WorkRequests
     * with different local IDs but the same sharepointId. After sync, duplicates
     * accumulate. This method keeps the lowest-ID entity (deterministic across
     * all clients) and soft-deletes the rest.
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
            int merged = mergeWorkRequests();
            if (merged > 0) {
                log.info("[WorkRequest Merge] {} duplicates deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    @SuppressWarnings("unchecked")
    private int mergeWorkRequests() {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT sharepoint_id, COUNT(*) FROM work_request " +
            "WHERE deleted = false AND sharepoint_id IS NOT NULL " +
            "GROUP BY sharepoint_id HAVING COUNT(*) > 1")
            .getResultList();

        if (duplicates.isEmpty()) {
            log.debug("[WorkRequest Merge] No duplicates found");
        } else {
            log.info("[WorkRequest Merge] Found {} sharepointId groups with duplicates", duplicates.size());
        }

        int merged = 0;
        for (Object[] row : duplicates) {
            String sharepointId = (String) row[0];
            int count = ((Number) row[1]).intValue();
            log.info("[WorkRequest Merge] sharepointId='{}' has {} copies", sharepointId, count);
            merged += mergeBySharepointId(sharepointId);
        }
        return merged;
    }

    private int mergeBySharepointId(String sharepointId) {
        List<WorkRequest> workRequests = entityManager.createQuery(
            "SELECT w FROM WorkRequest w WHERE w.sharepointId = :spId " +
            "AND w.deleted = false ORDER BY w.id",
            WorkRequest.class)
            .setParameter("spId", sharepointId)
            .getResultList();

        if (workRequests.size() <= 1) return 0;

        WorkRequest canonical = workRequests.get(0);
        int merged = 0;

        for (int i = 1; i < workRequests.size(); i++) {
            WorkRequest duplicate = workRequests.get(i);

            transferDailyPermitPackageLink(duplicate.getId(), canonical.getId());
            transferJhaLinks(duplicate.getId(), canonical.getId());
            transferEmailCorrespondenceLinks(duplicate.getId(), canonical.getId(), sharepointId);

            // Soft-delete via JPA so FieldChangeEntityListener fires and creates
            // a FieldChange record — this ensures the deletion syncs to other machines.
            duplicate.setDeleted(true);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.info("[WorkRequest Merge] sharepointId='{}' ID={} merged into ID={}",
                sharepointId, duplicate.getId(), canonical.getId());
        }

        return merged;
    }

    /**
     * Transfer the daily_permit_package_id FK from a duplicate WorkRequest to
     * the canonical one (if the canonical doesn't already have one).
     *
     * DailyPermitPackage uses @OneToMany @JoinColumn — the FK lives on the
     * work_request table but isn't a mapped Java field on WorkRequest, so
     * native SQL is the correct approach. Both machines run this dedup
     * independently and deterministically, arriving at the same state.
     */
    private void transferDailyPermitPackageLink(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE work_request SET daily_permit_package_id = " +
            "(SELECT daily_permit_package_id FROM work_request WHERE id = :dupId) " +
            "WHERE id = :canId AND daily_permit_package_id IS NULL " +
            "AND (SELECT daily_permit_package_id FROM work_request WHERE id = :dupId) IS NOT NULL")
            .setParameter("dupId", duplicateId)
            .setParameter("canId", canonicalId)
            .executeUpdate();

        if (updated > 0) {
            log.info("[WorkRequest Merge] Transferred DailyPermitPackage link from ID={} to ID={}",
                duplicateId, canonicalId);
        }
    }

    /**
     * Transfer EmailCorrespondence polymorphic links from a duplicate WorkRequest to the canonical one.
     * Also sets linkedSharepointId for dedup-resilient association.
     */
    private void transferEmailCorrespondenceLinks(Long duplicateId, Long canonicalId, String sharepointId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE email_correspondence SET entity_id = :canId, linked_sharepoint_id = :spId " +
            "WHERE entity_type = 'WorkRequest' AND entity_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("spId", sharepointId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();

        if (updated > 0) {
            log.info("[WorkRequest Merge] Transferred {} EmailCorrespondence link(s) from WR ID={} to WR ID={} (SP:{})",
                updated, duplicateId, canonicalId, sharepointId);
        }

        // Also backfill linkedSharepointId on the canonical WR's existing correspondence
        int backfilled = entityManager.createNativeQuery(
            "UPDATE email_correspondence SET linked_sharepoint_id = :spId " +
            "WHERE entity_type = 'WorkRequest' AND entity_id = :canId " +
            "AND linked_sharepoint_id IS NULL")
            .setParameter("spId", sharepointId)
            .setParameter("canId", canonicalId)
            .executeUpdate();

        if (backfilled > 0) {
            log.info("[WorkRequest Merge] Backfilled linkedSharepointId on {} existing correspondence for WR ID={}",
                backfilled, canonicalId);
        }
    }

    /**
     * Transfer JHA foreign keys from a duplicate WorkRequest to the canonical one.
     * JHA has a @ManyToOne WorkRequest via work_request_id column.
     * When the duplicate WR is soft-deleted, its JHAs would become orphaned.
     */
    private void transferJhaLinks(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE jha SET work_request_id = :canId WHERE work_request_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();

        if (updated > 0) {
            log.info("[WorkRequest Merge] Transferred {} JHA link(s) from WR ID={} to WR ID={}",
                updated, duplicateId, canonicalId);
        }
    }
}
