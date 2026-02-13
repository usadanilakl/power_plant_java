package com.dk_power.power_plant_java.entities.hub;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "hub_synced_file", indexes = {
    @Index(name = "idx_hsf_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_hsf_hash", columnList = "fileHash"),
    @Index(name = "idx_hsf_origin", columnList = "originMachineId")
})
@Getter
@Setter
@NoArgsConstructor
public class HubSyncedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityType;

    @Column(nullable = false)
    private Long entityId;

    private String originalPath;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false)
    private String fileName;

    private String extension;
    private Long fileSize;

    @Column(nullable = false)
    private String fileHash;

    private String contentType;
    private String originMachineId;
    private Instant uploadedAt;

    @Column(columnDefinition = "TEXT")
    private String syncedToMachines;

    private boolean deleted;
    private Instant deletedAt;

    /**
     * Add a machine to the synced list using pipe-delimited format.
     */
    public void addSyncedMachine(String machineId) {
        String delimitedId = "|" + machineId + "|";
        if (syncedToMachines == null || syncedToMachines.isEmpty()) {
            syncedToMachines = delimitedId;
        } else if (!syncedToMachines.contains(delimitedId)) {
            syncedToMachines += delimitedId;
        }
    }

    /**
     * Check if this file has been synced to a specific machine.
     */
    public boolean isSyncedTo(String machineId) {
        if (syncedToMachines == null || syncedToMachines.isEmpty()) {
            return false;
        }
        return syncedToMachines.contains("|" + machineId + "|");
    }
}
