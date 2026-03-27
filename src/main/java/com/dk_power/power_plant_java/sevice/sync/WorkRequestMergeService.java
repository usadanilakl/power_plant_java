package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Dedup merge service for WorkRequest entities.
 * Extends the generic SharePointMergeTemplate and overrides
 * transferRelationships() to handle WR-specific FK transfers:
 * DailyPermitPackage, JHA, EmailCorrespondence, and PermitAttachment.
 */
@Service
@Slf4j
public class WorkRequestMergeService extends SharePointMergeTemplate<WorkRequest> {

    public WorkRequestMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "work_request"; }
    @Override protected String entityName() { return "WorkRequest"; }
    @Override protected Class<WorkRequest> entityClass() { return WorkRequest.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[WorkRequest Merge]"; }

    @Override
    protected void markDeleted(WorkRequest entity) {
        entity.setDeleted(true);
    }

    /**
     * Transfer all FK relationships from the duplicate WR to the canonical one
     * before soft-deleting the duplicate.
     */
    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        transferDailyPermitPackageLink(duplicateId, canonicalId);
        transferJhaLinks(duplicateId, canonicalId);
        transferEmailCorrespondenceLinks(duplicateId, canonicalId, naturalKeyValue);
        transferAttachmentLinks(duplicateId, canonicalId);
    }

    /**
     * Merge a specific duplicate into a canonical WR.
     * Used when we can identify an orphan/local duplicate outside the normal
     * sharepoint_id-based dedup flow (for example via localUuid).
     */
    public void mergeDuplicateIntoCanonical(Long duplicateId, Long canonicalId, String sharepointId) {
        if (duplicateId == null || canonicalId == null || duplicateId.equals(canonicalId)) {
            return;
        }

        WorkRequest duplicate = entityManager.find(WorkRequest.class, duplicateId);
        if (duplicate == null || Boolean.TRUE.equals(duplicate.getDeleted())) {
            return;
        }

        transferRelationships(duplicateId, canonicalId, sharepointId);
        markDeleted(duplicate);
        entityManager.merge(duplicate);
        entityManager.flush();

        log.info("[WorkRequest Merge] Manually merged duplicate WR ID={} into ID={} (SP:{})",
            duplicateId, canonicalId, sharepointId);
    }

    /**
     * Transfer the daily_permit_package_id FK from a duplicate WorkRequest to
     * the canonical one (if the canonical doesn't already have one).
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
     * Transfer PermitAttachment polymorphic links from a duplicate WorkRequest to the canonical one.
     */
    private void transferAttachmentLinks(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE permit_attachment SET entity_id = :canId " +
            "WHERE entity_type = 'WorkRequest' AND entity_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();

        if (updated > 0) {
            log.info("[WorkRequest Merge] Transferred {} PermitAttachment link(s) from WR ID={} to WR ID={}",
                updated, duplicateId, canonicalId);
        }
    }

    /**
     * Transfer JHA foreign keys from a duplicate WorkRequest to the canonical one.
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
