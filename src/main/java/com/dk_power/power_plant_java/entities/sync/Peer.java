package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sync_peer")
@Getter
@Setter
@NoArgsConstructor
public class Peer {

    @Id
    private String machineId;

    private String machineName;
    private String ipAddress;
    private int port;
    private Instant lastSeen;
    private Instant lastSyncTime;

    @Enumerated(EnumType.STRING)
    private PeerStatus status;

    public enum PeerStatus {
        ONLINE,
        OFFLINE,
        SYNCING,
        ERROR
    }

    public Peer(String machineId, String machineName, String ipAddress, int port) {
        this.machineId = machineId;
        this.machineName = machineName;
        this.ipAddress = ipAddress;
        this.port = port;
        this.lastSeen = Instant.now();
        this.status = PeerStatus.ONLINE;
    }

    public String getBaseUrl() {
        return "http://" + ipAddress + ":" + port;
    }

    public boolean isStale() {
        return lastSeen != null && lastSeen.isBefore(Instant.now().minusSeconds(120)); // 2 minutes
    }

    public boolean isOnline() {
        return status == PeerStatus.ONLINE || status == PeerStatus.SYNCING;
    }

    @Override
    public String toString() {
        return "Peer{" +
                "machineId='" + machineId + '\'' +
                ", machineName='" + machineName + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                ", port=" + port +
                ", status=" + status +
                ", lastSeen=" + lastSeen +
                '}';
    }
}
