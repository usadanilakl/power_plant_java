package com.dk_power.power_plant_java.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_status")
public class SyncStatus {
    @Id
    private String entityName;
    private LocalDateTime lastSyncTime;

}