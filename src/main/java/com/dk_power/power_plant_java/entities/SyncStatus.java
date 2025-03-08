package com.dk_power.power_plant_java.entities;

import com.azure.core.annotation.Get;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_status")
@Getter
@Setter
public class SyncStatus {
    @Id
    private String entityName;
    private LocalDateTime lastSyncTime;

    public SyncStatus() {}

    public SyncStatus(String entityName, LocalDateTime min) {
        this.entityName = entityName;
        this.lastSyncTime = min;
    }
}