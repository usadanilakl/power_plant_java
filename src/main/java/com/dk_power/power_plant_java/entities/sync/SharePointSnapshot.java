package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Stores the last-seen SharePoint field values for each entity.
 * Used by SharePointFieldMergeService to detect which fields
 * actually changed on the SharePoint side between syncs.
 */
@Entity
@Table(name = "sharepoint_snapshot",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entityType", "sharepointId"}))
@Getter
@Setter
@NoArgsConstructor
public class SharePointSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Entity type name (e.g., "WorkRequest", "Jha"). */
    @Column(nullable = false)
    private String entityType;

    /** SharePoint item ID. */
    @Column(nullable = false)
    private String sharepointId;

    /** JSON map of SP column name to string value at last sync. */
    @Column(columnDefinition = "TEXT")
    private String fieldsJson;

    /** When this snapshot was last updated. */
    private Instant lastSyncTime;
}
