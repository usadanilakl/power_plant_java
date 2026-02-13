package com.dk_power.power_plant_java.entities.hub;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing a stored H2 database backup uploaded by a client.
 * Clients can upload their H2 backups to the hub, and other clients
 * can download them for full resync.
 */
@Entity
@Table(name = "hub_stored_backups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HubStoredBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false, unique = true)
    private String checksum;

    @Column(nullable = false)
    private String originMachineId;

    private String originMachineName;

    @Column(nullable = false)
    private Instant uploadedAt;
}
