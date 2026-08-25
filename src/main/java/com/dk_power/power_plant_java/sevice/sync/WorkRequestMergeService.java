package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

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
        // Managed re-point (not native SQL) so the FK change fires @PostUpdate and emits a
        // FieldChange — mergeIfDuplicatesExist has already cleared SyncContext, so it syncs
        // to desktops instead of leaving them half-merged. Same guard as the old native
        // UPDATE: only fill the canonical's link when it has none and the duplicate has one.
        WorkRequest canonical = entityManager.find(WorkRequest.class, canonicalId);
        WorkRequest duplicate = entityManager.find(WorkRequest.class, duplicateId);
        if (canonical == null || duplicate == null) return;
        if (canonical.getDailyPermitPackage() == null && duplicate.getDailyPermitPackage() != null) {
            canonical.setDailyPermitPackage(duplicate.getDailyPermitPackage());
            entityManager.merge(canonical);
            log.info("[WorkRequest Merge] Transferred DailyPermitPackage link from ID={} to ID={}",
                duplicateId, canonicalId);
        }
    }

    /**
     * Transfer EmailCorrespondence polymorphic links from a duplicate WorkRequest to the canonical one.
     * Also sets linkedSharepointId for dedup-resilient association.
     */
    private void transferEmailCorrespondenceLinks(Long duplicateId, Long canonicalId, String sharepointId) {
        // Re-point the polymorphic correspondence rows via managed saves so the entityId +
        // linkedSharepointId changes emit FieldChanges. EmailCorrespondence is a tracked
        // entity (@EntityListeners(FieldChangeEntityListener.class)); the old native UPDATE
        // bypassed it, leaving desktops with correspondence still pointing at the deleted dup.
        List<EmailCorrespondence> toMove = entityManager.createQuery(
            "SELECT e FROM EmailCorrespondence e WHERE e.entityType = 'WorkRequest' AND e.entityId = :dupId",
            EmailCorrespondence.class)
            .setParameter("dupId", duplicateId)
            .getResultList();
        for (EmailCorrespondence e : toMove) {
            e.setEntityId(canonicalId);
            e.setLinkedSharepointId(sharepointId);
            entityManager.merge(e);
        }
        if (!toMove.isEmpty()) {
            log.info("[WorkRequest Merge] Transferred {} EmailCorrespondence link(s) from WR ID={} to WR ID={} (SP:{})",
                toMove.size(), duplicateId, canonicalId, sharepointId);
        }

        // Also backfill linkedSharepointId on the canonical WR's existing correspondence.
        List<EmailCorrespondence> toBackfill = entityManager.createQuery(
            "SELECT e FROM EmailCorrespondence e WHERE e.entityType = 'WorkRequest' AND e.entityId = :canId " +
            "AND e.linkedSharepointId IS NULL",
            EmailCorrespondence.class)
            .setParameter("canId", canonicalId)
            .getResultList();
        for (EmailCorrespondence e : toBackfill) {
            e.setLinkedSharepointId(sharepointId);
            entityManager.merge(e);
        }
        if (!toBackfill.isEmpty()) {
            log.info("[WorkRequest Merge] Backfilled linkedSharepointId on {} existing correspondence for WR ID={}",
                toBackfill.size(), canonicalId);
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
        // Managed re-point so each JHA's workRequest FK change emits a FieldChange (Jha is a
        // tracked BasePermitEntity). The old native bulk UPDATE left desktops with JHAs still
        // pointing at the soft-deleted duplicate WR (orphaned under @Where(deleted=false)).
        WorkRequest canonical = entityManager.find(WorkRequest.class, canonicalId);
        if (canonical == null) return;
        List<Jha> jhas = entityManager.createQuery(
            "SELECT j FROM Jha j WHERE j.workRequest.id = :dupId", Jha.class)
            .setParameter("dupId", duplicateId)
            .getResultList();
        for (Jha jha : jhas) {
            jha.setWorkRequest(canonical);
            entityManager.merge(jha);
        }
        if (!jhas.isEmpty()) {
            log.info("[WorkRequest Merge] Transferred {} JHA link(s) from WR ID={} to WR ID={}",
                jhas.size(), duplicateId, canonicalId);
        }
    }
}
