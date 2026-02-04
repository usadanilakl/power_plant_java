package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.PendingFileSync;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncDirection;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PendingFileSyncRepository extends JpaRepository<PendingFileSync, Long> {

    /**
     * Find all pending tasks ready for processing (status = PENDING and nextRetryTime <= now).
     */
    @Query("SELECT p FROM PendingFileSync p WHERE p.status = :status AND p.nextRetryTime <= :now ORDER BY p.createdAt ASC")
    List<PendingFileSync> findReadyForProcessing(@Param("status") SyncStatus status, @Param("now") Instant now);

    /**
     * Find pending uploads ready to process.
     */
    default List<PendingFileSync> findPendingUploads() {
        return findByDirectionAndStatusInAndNextRetryTimeLessThanEqualOrderByCreatedAtAsc(
            SyncDirection.UPLOAD,
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS),
            Instant.now()
        );
    }

    /**
     * Find pending downloads ready to process.
     */
    default List<PendingFileSync> findPendingDownloads() {
        return findByDirectionAndStatusInAndNextRetryTimeLessThanEqualOrderByCreatedAtAsc(
            SyncDirection.DOWNLOAD,
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS),
            Instant.now()
        );
    }

    List<PendingFileSync> findByDirectionAndStatusInAndNextRetryTimeLessThanEqualOrderByCreatedAtAsc(
        SyncDirection direction, List<SyncStatus> statuses, Instant nextRetryTime);

    /**
     * Check if there's already a pending sync for an entity in a given direction.
     */
    boolean existsByEntityIdAndDirectionAndStatusIn(Long entityId, SyncDirection direction, List<SyncStatus> statuses);

    /**
     * Find existing pending task for entity (to avoid duplicates).
     */
    Optional<PendingFileSync> findByEntityIdAndDirectionAndStatusIn(
        Long entityId, SyncDirection direction, List<SyncStatus> statuses);

    /**
     * Delete completed tasks older than a certain time.
     */
    @Modifying
    @Query("DELETE FROM PendingFileSync p WHERE p.status = 'COMPLETED' AND p.lastAttemptTime < :before")
    int deleteCompletedBefore(@Param("before") Instant before);

    /**
     * Delete all completed tasks.
     */
    @Modifying
    @Query("DELETE FROM PendingFileSync p WHERE p.status = 'COMPLETED'")
    int deleteAllCompleted();

    /**
     * Reset stuck IN_PROGRESS tasks back to PENDING (for recovery after crash).
     */
    @Modifying
    @Query("UPDATE PendingFileSync p SET p.status = 'PENDING', p.nextRetryTime = :now WHERE p.status = 'IN_PROGRESS'")
    int resetStuckTasks(@Param("now") Instant now);

    /**
     * Count pending tasks by direction.
     */
    long countByDirectionAndStatusIn(SyncDirection direction, List<SyncStatus> statuses);

    /**
     * Find tasks by direction and status (for recovery of FAILED tasks).
     */
    List<PendingFileSync> findByDirectionAndStatusIn(SyncDirection direction, List<SyncStatus> statuses);

    /**
     * Reset FAILED upload tasks back to PENDING (for retry after server becomes reachable).
     */
    @Modifying
    @Query("UPDATE PendingFileSync p SET p.status = 'PENDING', p.retryCount = 0, p.nextRetryTime = :now " +
           "WHERE p.status = 'FAILED' AND p.direction = 'UPLOAD'")
    int resetFailedUploads(@Param("now") Instant now);
}
