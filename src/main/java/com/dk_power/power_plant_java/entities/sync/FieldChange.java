package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "field_change", indexes = {
    @Index(name = "idx_fc_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_fc_timestamp", columnList = "timestamp"),
    @Index(name = "idx_fc_machine", columnList = "originMachineId"),
    @Index(name = "idx_fc_field", columnList = "entityType, entityId, fieldName")
})
@Getter
@Setter
@NoArgsConstructor
public class FieldChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Entity identification
    @Column(nullable = false)
    private String entityType;          // "Equipment", "LotoPoint", etc.

    @Column(nullable = false)
    private Long entityId;              // The entity's ID

    // Field identification
    @Column(nullable = false)
    private String fieldName;           // "name", "location", "coordinates", etc.

    // Change data
    @Column(columnDefinition = "TEXT")
    private String oldValue;            // JSON serialized previous value (nullable for creates)

    @Column(columnDefinition = "TEXT")
    private String newValue;            // JSON serialized new value

    // Tracking metadata
    @Column(nullable = false)
    private Instant timestamp;          // When change occurred (UTC)

    @Column(nullable = false)
    private String originMachineId;     // Machine that originated this change

    @Column(nullable = false)
    private String originMachineName;   // Human-readable machine name

    // Sync tracking
    @Column(columnDefinition = "TEXT")
    private String syncedToMachines;    // Comma-separated list of machine IDs that have this change

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeType changeType;      // CREATE, UPDATE, DELETE

    // For relationship fields
    private String relationshipType;    // "ManyToOne", "ManyToMany", "OneToMany" (null for simple fields)

    /**
     * When this change was received by the sync server.
     * This field exists to maintain schema compatibility with the sync server's FieldChange entity.
     */
    private Instant receivedAt;

    public enum ChangeType {
        CREATE,     // New entity created
        UPDATE,     // Field value changed
        DELETE      // Entity soft-deleted
    }

    // Constructor for creating a new change
    public FieldChange(String entityType, Long entityId, String fieldName,
                       String oldValue, String newValue,
                       String machineId, String machineName, ChangeType changeType) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.timestamp = Instant.now();
        this.originMachineId = machineId;
        this.originMachineName = machineName;
        this.changeType = changeType;
        this.syncedToMachines = "|" + machineId + "|"; // Initially only synced to origin (delimited format)
        this.receivedAt = Instant.now(); // Set for schema compatibility with sync server
    }

    /**
     * Add a machine to the synced list.
     * Uses delimiter format: |MACHINE_ID| to prevent substring matching issues.
     * e.g., "MACHINE_1" won't accidentally match "MACHINE_10".
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
     * Check if this change has been synced to a specific machine.
     */
    public boolean isSyncedTo(String machineId) {
        if (syncedToMachines == null || syncedToMachines.isEmpty()) {
            return false;
        }
        return syncedToMachines.contains("|" + machineId + "|");
    }

    /**
     * Build a unique key for this change for conflict resolution.
     * Format: entityType:entityId:fieldName
     *
     * @return The change key
     */
    public String buildChangeKey() {
        return entityType + ":" + entityId + ":" + fieldName;
    }

    /**
     * Build a unique key for conflict resolution from components.
     * Format: entityType:entityId:fieldName
     *
     * @param entityType The entity type
     * @param entityId   The entity ID
     * @param fieldName  The field name
     * @return The change key
     */
    public static String buildChangeKey(String entityType, Long entityId, String fieldName) {
        return entityType + ":" + entityId + ":" + fieldName;
    }

    @Override
    public String toString() {
        return "FieldChange{" +
                "entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                ", fieldName='" + fieldName + '\'' +
                ", changeType=" + changeType +
                ", timestamp=" + timestamp +
                ", originMachineId='" + originMachineId + '\'' +
                '}';
    }
}
