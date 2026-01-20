package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Persistent queue for file sync operations.
 *
 * When files need to be uploaded/downloaded to/from the sync server,
 * they are recorded here. This ensures that:
 * - Files queued while the sync server is offline will be retried when it comes back online
 * - Files pending sync survive application restarts
 * - Failed uploads are retried with exponential backoff
 */
@Entity
@Table(name = "pending_file_sync", indexes = {
    @Index(name = "idx_pfs_status", columnList = "status"),
    @Index(name = "idx_pfs_entity", columnList = "entityId"),
    @Index(name = "idx_pfs_next_retry", columnList = "nextRetryTime")
})
@Getter
@Setter
@NoArgsConstructor
public class PendingFileSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long entityId;  // FileObject ID

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SyncDirection direction;  // UPLOAD or DOWNLOAD

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SyncStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant lastAttemptTime;

    private Instant nextRetryTime;

    @Column(nullable = false)
    private int retryCount = 0;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    // Cached file info for uploads (in case FileObject is modified before upload completes)
    private String fileNumber;

    @Column(columnDefinition = "TEXT")
    private String extensions;  // Comma-separated list

    private String targetPath;  // For downloads: where to save the file

    @Column(columnDefinition = "TEXT")
    private String oldFolderToDelete;  // For downloads triggered by vendor/fileType rename: old folder to delete after download completes

    public enum SyncDirection {
        UPLOAD,     // Local file -> Sync server
        DOWNLOAD    // Sync server -> Local file
    }

    public enum SyncStatus {
        PENDING,        // Waiting to be processed
        IN_PROGRESS,    // Currently being processed
        COMPLETED,      // Successfully synced
        FAILED          // Failed after max retries
    }

    public PendingFileSync(Long entityId, SyncDirection direction, String fileNumber, String extensions) {
        this.entityId = entityId;
        this.direction = direction;
        this.fileNumber = fileNumber;
        this.extensions = extensions;
        this.status = SyncStatus.PENDING;
        this.createdAt = Instant.now();
        this.nextRetryTime = Instant.now();
    }

    public PendingFileSync(Long entityId, SyncDirection direction, String fileNumber, String extensions, String targetPath) {
        this(entityId, direction, fileNumber, extensions);
        this.targetPath = targetPath;
    }

    /**
     * Check if this task is ready for retry based on the scheduled retry time.
     */
    public boolean isReadyForRetry() {
        return nextRetryTime == null || Instant.now().isAfter(nextRetryTime);
    }

    /**
     * Schedule the next retry with exponential backoff.
     */
    public void scheduleRetry(long delayMs) {
        this.nextRetryTime = Instant.now().plusMillis(delayMs);
    }

    /**
     * Mark as failed with error message.
     */
    public void markFailed(String error) {
        this.status = SyncStatus.FAILED;
        this.lastError = error;
        this.lastAttemptTime = Instant.now();
    }

    /**
     * Mark as in progress.
     */
    public void markInProgress() {
        this.status = SyncStatus.IN_PROGRESS;
        this.lastAttemptTime = Instant.now();
    }

    /**
     * Mark as completed.
     */
    public void markCompleted() {
        this.status = SyncStatus.COMPLETED;
        this.lastAttemptTime = Instant.now();
    }

    /**
     * Increment retry count and update last attempt time.
     */
    public void incrementRetry() {
        this.retryCount++;
        this.lastAttemptTime = Instant.now();
    }

    /**
     * Get extensions as array.
     */
    public String[] getExtensionsArray() {
        if (extensions == null || extensions.isEmpty()) {
            return new String[0];
        }
        return extensions.split(",");
    }

    @Override
    public String toString() {
        return String.format("PendingFileSync{id=%d, entityId=%d, direction=%s, status=%s, retries=%d}",
            id, entityId, direction, status, retryCount);
    }
}
