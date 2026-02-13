package com.dk_power.power_plant_java.entities.hub;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "hub_client_info")
@Getter
@Setter
@NoArgsConstructor
public class HubClientInfo {

    @Id
    private String machineId;

    private String machineName;
    private String ipAddress;

    private Instant firstSeen;
    private Instant lastSeen;
    private Instant lastSyncTime;

    @Enumerated(EnumType.STRING)
    private ClientStatus status;

    private long totalChangesPushed;
    private long totalChangesPulled;
    private Integer deviceNumber;

    public enum ClientStatus {
        ONLINE, OFFLINE, SYNCING
    }

    public HubClientInfo(String machineId, String machineName, String ipAddress) {
        this.machineId = machineId;
        this.machineName = machineName;
        this.ipAddress = ipAddress;
        this.firstSeen = Instant.now();
        this.lastSeen = Instant.now();
        this.status = ClientStatus.ONLINE;
    }

    public void recordActivity() {
        this.lastSeen = Instant.now();
        this.status = ClientStatus.ONLINE;
    }

    public void recordSync(long pushed, long pulled) {
        this.lastSyncTime = Instant.now();
        this.totalChangesPushed += pushed;
        this.totalChangesPulled += pulled;
    }
}
