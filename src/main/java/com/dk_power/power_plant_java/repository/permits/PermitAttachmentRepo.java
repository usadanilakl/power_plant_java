package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PermitAttachmentRepo extends JpaRepository<PermitAttachment, Long> {
    List<PermitAttachment> findByEntityTypeAndEntityId(String entityType, Long entityId);
    long countByEntityTypeAndEntityId(String entityType, Long entityId);

    @Query("SELECT a.entityId, COUNT(a) FROM PermitAttachment a WHERE a.entityType = :entityType AND a.entityId IN :entityIds GROUP BY a.entityId")
    List<Object[]> countByEntityTypeGroupedByEntityId(@Param("entityType") String entityType, @Param("entityIds") Collection<Long> entityIds);
    boolean existsByEntityTypeAndEntityIdAndFileName(String entityType, Long entityId, String fileName);
    boolean existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
        String entityType, Long entityId, String fileName, String contentHash);
    Optional<PermitAttachment> findFirstByEntityTypeAndEntityIdAndFileNameAndContentHashOrderByIdAsc(
        String entityType, Long entityId, String fileName, String contentHash);
    List<PermitAttachment> findBySyncedToServerFalseOrSyncedToServerIsNull();

    /** Attachments queued for a Maximo doclink upload retry — scoped to FieldListItem parents only. */
    List<PermitAttachment> findByMaximoAttachPendingTrueAndEntityTypeOrderByIdAsc(String entityType);

    /** Total pending-attachment count for the drift dashboard. */
    long countByMaximoAttachPendingTrueAndEntityType(String entityType);

    @Query("SELECT a FROM PermitAttachment a WHERE a.syncedToMachines IS NULL OR a.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%')")
    List<PermitAttachment> findNotSyncedTo(@Param("machineId") String machineId);

    /**
     * Metadata-only view for the /pending endpoint. Base64 now lives in an EAGER out-of-row child,
     * so loading full entities here would drag every pending blob into heap. This projection selects
     * scalar columns only — no blob, no entity load.
     */
    interface PendingAttachmentView {
        Long getId();
        String getEntityType();
        Long getEntityId();
        String getFileName();
        String getContentType();
        String getAttachmentType();
        String getOriginMachineId();
        boolean isDeleted();
        String getOrigin();
        java.time.LocalDateTime getCreatedAt();
    }

    @Query("SELECT a.id AS id, a.entityType AS entityType, a.entityId AS entityId, a.fileName AS fileName, "
        + "a.contentType AS contentType, a.attachmentType AS attachmentType, a.originMachineId AS originMachineId, "
        + "a.deleted AS deleted, a.origin AS origin, a.createdAt AS createdAt "
        + "FROM PermitAttachment a WHERE a.syncedToMachines IS NULL "
        + "OR a.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%')")
    List<PendingAttachmentView> findPendingMetadataNotSyncedTo(@Param("machineId") String machineId);

    // ─── Tombstone-aware finders (used by the SDS Sync PDFs flow) ─────────────────────────

    /** Live (non-tombstoned) attachments for one owning entity. */
    List<PermitAttachment> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, Long entityId);

    /** Any attachment (deleted or not) with the given filename — used by the receiver of a
     *  tombstone to find and remove the matching local row. */
    Optional<PermitAttachment> findFirstByEntityTypeAndEntityIdAndFileNameOrderByIdAsc(
        String entityType, Long entityId, String fileName);

    /** Hash-only dedup for a live attachment on this entity. Filename-agnostic — matches whether
     *  the same PDF was uploaded under a different name. */
    boolean existsByEntityTypeAndEntityIdAndContentHashAndDeletedFalse(
        String entityType, Long entityId, String contentHash);

    /** Find the live (non-tombstoned) row for a given (entity, hash) pair. */
    Optional<PermitAttachment> findFirstByEntityTypeAndEntityIdAndContentHashAndDeletedFalseOrderByIdAsc(
        String entityType, Long entityId, String contentHash);

    /**
     * Sweep old tombstones so the table doesn't grow unbounded. Called by a scheduled task
     * once tombstones have had enough time to propagate to every machine. Native SQL because
     * we want to hard-delete tombstoned rows past the retention window regardless of any JPA
     * lifecycle logic.
     */
    @Transactional
    @Modifying
    @Query(value = "DELETE FROM permit_attachment WHERE deleted = TRUE AND created_at < :cutoff", nativeQuery = true)
    int purgeTombstonesOlderThan(@Param("cutoff") java.time.LocalDateTime cutoff);
}
