package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.Properties;

/**
 * Runtime-mutable sync interval settings.
 * Defaults come from application.properties but can be overridden at runtime via REST API.
 * User changes are persisted to ./sharepoint-sync.properties so they survive restarts.
 */
@Data
@Slf4j
@Component
public class SharePointSyncSettings {

    private static final String SETTINGS_FILE = "./sharepoint-sync.properties";

    // ── SharePoint sync ──
    @Value("${sharepoint.sync.enabled:false}")
    private volatile boolean enabled;

    @Value("${sharepoint.sync.interval:120000}")
    private volatile long intervalMs;

    // ── Peer-to-peer sync ──
    @Value("${sync.interval.seconds:30}")
    private volatile int peerSyncIntervalSeconds;

    private volatile long lastPeerSyncTime = 0;
    private volatile long lastPeerBroadcastTime = 0;

    // ── Health check ──
    @Value("${sync.health.check.interval:300000}")
    private volatile long healthCheckIntervalMs;

    private volatile long lastHealthCheckTime = 0;

    /**
     * After Spring sets @Value defaults, override with persisted user settings if the file exists.
     */
    @PostConstruct
    void loadFromFile() {
        File file = new File(SETTINGS_FILE);
        if (!file.exists()) return;

        try (InputStream in = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(in);

            if (props.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(props.getProperty("enabled"));
            }
            if (props.containsKey("intervalMs")) {
                this.intervalMs = Long.parseLong(props.getProperty("intervalMs"));
            }
            if (props.containsKey("peerSyncIntervalSeconds")) {
                this.peerSyncIntervalSeconds = Integer.parseInt(props.getProperty("peerSyncIntervalSeconds"));
            }
            if (props.containsKey("healthCheckIntervalMs")) {
                this.healthCheckIntervalMs = Long.parseLong(props.getProperty("healthCheckIntervalMs"));
            }

            log.info("Loaded SharePoint sync settings from {}: enabled={}, intervalMs={}, peerSync={}s, healthCheck={}ms",
                    SETTINGS_FILE, enabled, intervalMs, peerSyncIntervalSeconds, healthCheckIntervalMs);
        } catch (Exception e) {
            log.warn("Failed to load SharePoint sync settings from {}: {}", SETTINGS_FILE, e.getMessage());
        }
    }

    /**
     * Persist current user-configurable settings to disk.
     */
    public void persistToFile() {
        Properties props = new Properties();
        props.setProperty("enabled", String.valueOf(enabled));
        props.setProperty("intervalMs", String.valueOf(intervalMs));
        props.setProperty("peerSyncIntervalSeconds", String.valueOf(peerSyncIntervalSeconds));
        props.setProperty("healthCheckIntervalMs", String.valueOf(healthCheckIntervalMs));

        try (OutputStream out = new FileOutputStream(SETTINGS_FILE)) {
            props.store(out, "SharePoint sync settings — managed via UI");
            log.debug("Persisted SharePoint sync settings to {}", SETTINGS_FILE);
        } catch (IOException e) {
            log.error("Failed to persist SharePoint sync settings to {}: {}", SETTINGS_FILE, e.getMessage());
        }
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
