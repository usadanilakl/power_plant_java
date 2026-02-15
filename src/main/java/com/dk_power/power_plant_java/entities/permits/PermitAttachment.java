package com.dk_power.power_plant_java.entities.permits;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "permit_attachment")
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

    private LocalDateTime createdAt;

    private String originMachineId;
    private Boolean syncedToServer;

    @Column(name = "synced_to_machines", columnDefinition = "TEXT")
    private String syncedToMachines;  // Pipe-delimited: |MACHINE_1|MACHINE_2|

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
