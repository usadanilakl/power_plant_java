package com.dk_power.power_plant_java.entities.permits;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    /**
     * TRANSITIONAL legacy column. base64 used to be stored inline here (whole-row rewrites →
     * bloat). {@code PermitAttachmentContentMigration} copies it to {@link PermitAttachmentContent}
     * and NULLs it; a later release drops the column. Kept mapped only as a read-only fallback for
     * rows not yet migrated. New writes NEVER touch it — they go to the {@code content} child.
     * {@code @JsonIgnore} so the JSON wire shape is unchanged (base64 is exposed via getBase64Content()).
     */
    // Physical column is BASE64CONTENT (no underscore) — this project's naming strategy does NOT
    // snake-case a field with a digit before the capital (base64Content -> BASE64CONTENT, unlike
    // entityId -> ENTITY_ID). Must point at the EXISTING data column, not a new one.
    @Column(name = "base64content", columnDefinition = "TEXT")
    @JsonIgnore
    private String legacyBase64Content;

    /**
     * Out-of-row base64 storage (1:1, shared PK). EAGER so {@link #getBase64Content()} works for the
     * many consumers that read it outside an open Hibernate session (OSIV is off). Writes and
     * tombstones cascade; {@link #setBase64Content(String)} with null nulls the association so
     * orphanRemoval deletes the blob row. {@code @JsonIgnore} to avoid changing the wire shape.
     */
    @OneToOne(mappedBy = "attachment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private PermitAttachmentContent content;

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

    /**
     * Reads the blob from the out-of-row {@code content} child; falls back to the legacy inline
     * column for rows not yet migrated (so a partial migration never surfaces as empty).
     */
    public String getBase64Content() {
        if (content != null && content.getBase64Content() != null) {
            return content.getBase64Content();
        }
        return legacyBase64Content;
    }

    /**
     * Writes the blob to the out-of-row {@code content} child. {@code null} tombstones it (nulls the
     * association → orphanRemoval deletes the blob row). Never writes the legacy inline column.
     */
    public void setBase64Content(String base64Content) {
        if (base64Content == null) {
            this.content = null;
        } else if (this.content == null) {
            this.content = new PermitAttachmentContent(this, base64Content);
        } else {
            this.content.setBase64Content(base64Content);
        }
    }

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
