package com.dk_power.power_plant_java.entities.permits;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

@Entity
@Table(name = "permit_attachment", indexes = {
    // Every per-entity attachment count (WorkRequestMapper, JobLog list, etc.) queries by
    // (entityType, entityId). Without this index that is a FULL SCAN of the multi-hundred-MB
    // base64 table — the hidden N+1 behind the JobLog getAll connection leak.
    @Index(name = "idx_permit_attachment_entity", columnList = "entity_type, entity_id")
})
@DynamicUpdate  // only UPDATE dirty columns — avoids rewriting the ~1.3MB base64Content row on sync-flag-only saves
@Getter
@Setter
public class PermitAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType;      // "WorkRequest", "Jha"
    private Long entityId;

    private String fileName;
    private String contentType;
    private String attachmentType;  // "photo", "signature", "document"

    @Column(columnDefinition = "TEXT")
    private String base64Content;

    @Column(length = 64)
    private String contentHash;

    private LocalDateTime createdAt;

    private String originMachineId;
    private Boolean syncedToServer;

    @Column(name = "synced_to_machines", columnDefinition = "TEXT")
    private String syncedToMachines;  // Pipe-delimited: |MACHINE_1|MACHINE_2|

    /**
     * Tombstone flag for attachment sync. When {@code true}, this row represents a delete that
     * still needs to be broadcast to peer machines. The row lingers in the database only long
     * enough for the sync channel to carry the tombstone to every client; the receiving side
     * removes its local copy (see {@link com.dk_power.power_plant_java.sevice.sync.AttachmentSyncHandler}).
     * Consumers that display attachments (UI, exports, SharePoint push) MUST filter this out.
     */
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    /**
     * Provenance marker. Well-known values: {@code "ebinder"} for PDFs pulled by the eBinder
     * scraper (the "Sync PDFs" tool only touches rows tagged this way); {@code null} or
     * anything else is treated as manually uploaded and preserved even on matched chemicals.
     * Legacy scraper attachments in production DB carry {@code null} — the sync tool applies
     * a filename-shape fallback ({@code sds-*.pdf}) to treat them as {@code ebinder}-owned.
     */
    @Column(name = "origin", length = 32)
    private String origin;

    public void addSyncedMachine(String machineId) {
        String delimitedId = "|" + machineId + "|";
        if (syncedToMachines == null || syncedToMachines.isEmpty()) {
            syncedToMachines = delimitedId;
        } else if (!syncedToMachines.contains(delimitedId)) {
            syncedToMachines += delimitedId;
        }
    }

    public boolean isSyncedTo(String machineId) {
        if (syncedToMachines == null || syncedToMachines.isEmpty()) return false;
        return syncedToMachines.contains("|" + machineId + "|");
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
