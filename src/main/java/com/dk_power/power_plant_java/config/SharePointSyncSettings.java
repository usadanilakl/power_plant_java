package com.dk_power.power_plant_java.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Runtime-mutable sync interval settings.
 * Defaults come from application.properties but can be changed at runtime via REST API.
 */
@Data
@Component
public class SharePointSyncSettings {

    // ── SharePoint sync ──
    @Value("${sharepoint.sync.enabled:false}")
    private volatile boolean enabled;

    @Value("${sharepoint.sync.interval:120000}")
    private volatile long intervalMs;

    private volatile long lastWrSyncTime = 0;
    private volatile long lastJhaSyncTime = 0;

    // ── Peer-to-peer sync ──
    @Value("${sync.interval.seconds:30}")
    private volatile int peerSyncIntervalSeconds;

    private volatile long lastPeerSyncTime = 0;
    private volatile long lastPeerBroadcastTime = 0;

    // ── Health check ──
    @Value("${sync.health.check.interval:300000}")
    private volatile long healthCheckIntervalMs;

    private volatile long lastHealthCheckTime = 0;

    // ── SharePoint helpers ──

    public boolean isWrSyncDue() {
        return enabled && (System.currentTimeMillis() - lastWrSyncTime >= intervalMs);
    }

    public boolean isJhaSyncDue() {
        return enabled && (System.currentTimeMillis() - lastJhaSyncTime >= intervalMs);
    }

    public void markWrSynced() {
        this.lastWrSyncTime = System.currentTimeMillis();
    }

    public void markJhaSynced() {
        this.lastJhaSyncTime = System.currentTimeMillis();
    }

    // ── Peer sync helpers ──

    public long getPeerSyncIntervalMs() {
        return peerSyncIntervalSeconds * 1000L;
    }

    public boolean isPeerSyncDue() {
        return System.currentTimeMillis() - lastPeerSyncTime >= getPeerSyncIntervalMs();
    }

    public boolean isPeerBroadcastDue() {
        return System.currentTimeMillis() - lastPeerBroadcastTime >= getPeerSyncIntervalMs();
    }

    public void markPeerSynced() {
        this.lastPeerSyncTime = System.currentTimeMillis();
    }

    public void markPeerBroadcast() {
        this.lastPeerBroadcastTime = System.currentTimeMillis();
    }

    // ── Health check helpers ──

    public boolean isHealthCheckDue() {
        return System.currentTimeMillis() - lastHealthCheckTime >= healthCheckIntervalMs;
    }

    public void markHealthChecked() {
        this.lastHealthCheckTime = System.currentTimeMillis();
    }
}
