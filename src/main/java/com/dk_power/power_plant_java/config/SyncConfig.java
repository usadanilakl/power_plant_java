package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Properties;
import java.util.UUID;

@Configuration
@Getter
@Setter
@Slf4j
public class SyncConfig {

    @Value("${sync.role:}")
    private String syncRole;

    @Value("${sync.machine.id:}")
    private String machineId;

    @Value("${sync.machine.name:${COMPUTERNAME:${HOSTNAME:Unknown}}}")
    private String machineName;

    // Device identity (from device-configs/*.properties or machine-id.properties)
    @Value("${device.number:0}")
    private int deviceNumber;

    @Value("${device.name:}")
    private String deviceName;

    @Value("${server.port:8082}")
    private int syncPort;

    @Value("${sync.discovery.port:8083}")
    private int discoveryPort;

    @Value("${sync.discovery.enabled:true}")
    private boolean discoveryEnabled;

    @Value("${sync.interval.seconds:30}")
    private int syncIntervalSeconds;

    @Value("${sync.retention.days:30}")
    private int retentionDays;

    // JAR update serving (server-side)
    @Value("${update.jar.directory:${user.dir}/updates}")
    private String updateJarDirectory;

    @Value("${update.jar.filename:power_plant_java-1.jar}")
    private String updateJarFilename;

    // Central sync server configuration
    @Value("${sync.server.url:}")
    private String syncServerUrl;

    @Value("${sync.server.enabled:false}")
    private boolean syncServerEnabled;

    // Runtime toggle - allows enabling/disabling sync without restart
    // Defaults to true so sync works normally on startup when syncServerEnabled=true
    private volatile boolean syncRuntimeEnabled = true;

    /**
     * Check if central server sync is enabled and configured.
     * Checks both the config property AND the runtime toggle.
     */
    public boolean isServerSyncEnabled() {
        return syncServerEnabled && syncRuntimeEnabled && syncServerUrl != null && !syncServerUrl.isEmpty();
    }

    /**
     * Check if sync is configured (ignoring runtime toggle).
     * Used to know if sync CAN be enabled.
     */
    public boolean isServerSyncConfigured() {
        return syncServerEnabled && syncServerUrl != null && !syncServerUrl.isEmpty();
    }

    public boolean isHubMode() {
        return "hub".equalsIgnoreCase(syncRole);
    }

    public boolean isSyncRuntimeEnabled() {
        return syncRuntimeEnabled;
    }

    public void setSyncRuntimeEnabled(boolean enabled) {
        this.syncRuntimeEnabled = enabled;
    }

    private static final String MACHINE_ID_FILE = "./machine-id.properties";
    private static final String SYNC_CONFIG_FILE = "./sync-config.properties";

    @PostConstruct
    public void init() {
        // Load device identity from machine-id.properties (Electron writes this)
        loadDeviceIdentityFromFile();

        // If device config imported (via DEVICE_CONFIG env var), use those values
        if (deviceNumber > 0 && deviceName != null && !deviceName.isEmpty()) {
            // Derive machineId from device name if not already set
            if (machineId == null || machineId.isEmpty()) {
                machineId = deviceName.toUpperCase()
                    .replaceAll("\\s+", "-")
                    .replaceAll("[^A-Z0-9\\-]", "");
            }
            // Persist to machine-id.properties so DevicePrefixedIdGenerator can read it
            saveDeviceIdentityToFile();
        } else {
            // No device config from properties — load from machine-id.properties
            if (machineId == null || machineId.isEmpty()) {
                machineId = loadOrCreateMachineId();
            }
        }

        // Try to get computer name from environment if not set
        if (machineName == null || machineName.isEmpty() || machineName.equals("Unknown")) {
            machineName = getComputerName();
        }

        // Use device name as machine name if available
        if (deviceName != null && !deviceName.isEmpty()) {
            machineName = deviceName;
        }

        // Load sync server config from file (overrides application.properties)
        // Hub mode uses profile-defined config exclusively — file cannot override it
        if (!isHubMode()) {
            loadSyncServerConfigFromFile();
        } else {
            log.info("Hub mode: skipping sync-config.properties file (using profile config)");
        }

        log.info("===========================================");
        log.info("DEVICE IDENTITY");
        log.info("  Device Number: {}", deviceNumber > 0 ? deviceNumber : "NOT CONFIGURED");
        log.info("  Device Name: {}", deviceName != null && !deviceName.isEmpty() ? deviceName : "NOT CONFIGURED");
        log.info("  Machine ID: {}", machineId);
        log.info("  Source: {}", deviceNumber > 0 ? "device config" : "auto-generated (CONFIGURE DEVICE!)");
        log.info("-------------------------------------------");
        log.info("SYNC CONFIG");
        log.info("  Machine Name: {}", machineName);
        log.info("  Sync Port: {}", syncPort);
        log.info("  Discovery Port: {}", discoveryPort);
        log.info("  Discovery Enabled: {}", discoveryEnabled);
        log.info("  Sync Interval: {} seconds", syncIntervalSeconds);
        log.info("  Server Sync Enabled: {}", syncServerEnabled);
        log.info("  Sync Server URL: {}", syncServerUrl);
        log.info("===========================================");

        if (deviceNumber <= 0) {
            log.warn("!!! DEVICE NUMBER NOT CONFIGURED - IDs will use fallback device 9. " +
                "Set DEVICE_CONFIG env var or configure via Electron settings. !!!");
        }

        // Try to configure firewall for sync ports (Windows only)
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            configureWindowsFirewall();
        }
    }

    private void configureWindowsFirewall() {
        try {
            // Add TCP rule for HTTP sync
            String tcpRuleName = "PowerPlantSync_TCP_" + syncPort;
            ProcessBuilder tcpBuilder = new ProcessBuilder(
                "netsh", "advfirewall", "firewall", "add", "rule",
                "name=" + tcpRuleName, "dir=in", "action=allow", "protocol=TCP", "localport=" + syncPort);
            Process tcpProcess = tcpBuilder.start();
            int tcpResult = tcpProcess.waitFor();

            // Add UDP rule for discovery
            String udpRuleName = "PowerPlantSync_UDP_" + discoveryPort;
            ProcessBuilder udpBuilder = new ProcessBuilder(
                "netsh", "advfirewall", "firewall", "add", "rule",
                "name=" + udpRuleName, "dir=in", "action=allow", "protocol=UDP", "localport=" + discoveryPort);
            Process udpProcess = udpBuilder.start();
            int udpResult = udpProcess.waitFor();

            if (tcpResult == 0 || udpResult == 0) {
                log.info("Firewall rules configured for sync ports (TCP:{}, UDP:{})", syncPort, discoveryPort);
            } else {
                log.debug("Firewall rules may already exist or require admin privileges");
            }
        } catch (Exception e) {
            log.debug("Could not configure firewall automatically: {} (this is normal if not running as admin)", e.getMessage());
        }
    }

    private String loadOrCreateMachineId() {
        File file = new File(MACHINE_ID_FILE);
        Properties props = new Properties();

        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                props.load(fis);
                String id = props.getProperty("machine.id");
                if (id != null && !id.isEmpty()) {
                    log.info("Loaded existing machine ID: {}", id);
                    return id;
                }
            } catch (Exception e) {
                log.error("Error loading machine ID: {}", e.getMessage());
            }
        }

        // Generate new ID and save
        String newId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        props.setProperty("machine.id", newId);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            props.store(fos, "Machine identification for field-based sync");
            log.info("Generated new machine ID: {}", newId);
        } catch (Exception e) {
            log.error("Error saving machine ID: {}", e.getMessage());
        }

        return newId;
    }

    /**
     * Load device identity (device.number, device.name, machine.id) from machine-id.properties.
     * This is the primary source — written by Electron during first-run setup.
     */
    private void loadDeviceIdentityFromFile() {
        File file = new File(MACHINE_ID_FILE);
        if (!file.exists()) return;

        try (FileInputStream fis = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(fis);

            String deviceNumberStr = props.getProperty("device.number");
            if (deviceNumberStr != null && !deviceNumberStr.isEmpty() && deviceNumber <= 0) {
                try {
                    int num = Integer.parseInt(deviceNumberStr);
                    if (num >= 1 && num <= 9) {
                        this.deviceNumber = num;
                    }
                } catch (NumberFormatException ignored) {}
            }

            String nameFromFile = props.getProperty("device.name");
            if (nameFromFile != null && !nameFromFile.isEmpty() && (deviceName == null || deviceName.isEmpty())) {
                this.deviceName = nameFromFile;
            }

            String idFromFile = props.getProperty("machine.id");
            if (idFromFile != null && !idFromFile.isEmpty() && (machineId == null || machineId.isEmpty())) {
                this.machineId = idFromFile;
            }

            log.info("Loaded device identity from {}: device.number={}, device.name={}, machine.id={}",
                MACHINE_ID_FILE, deviceNumber, deviceName, machineId);
        } catch (Exception e) {
            log.warn("Could not load device identity from {}: {}", MACHINE_ID_FILE, e.getMessage());
        }
    }

    /**
     * Save device identity to machine-id.properties.
     * DevicePrefixedIdGenerator reads device.number from this file.
     */
    private void saveDeviceIdentityToFile() {
        File file = new File(MACHINE_ID_FILE);
        Properties props = new Properties();

        // Load existing properties first to preserve any extra fields
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                props.load(fis);
            } catch (Exception ignored) {}
        }

        props.setProperty("machine.id", machineId);
        props.setProperty("device.number", String.valueOf(deviceNumber));
        props.setProperty("device.name", deviceName != null ? deviceName : "");

        try (FileOutputStream fos = new FileOutputStream(file)) {
            props.store(fos, "Device identity for sync and ID generation — managed by Electron");
            log.info("Saved device identity: machine.id={}, device.number={}, device.name={}",
                machineId, deviceNumber, deviceName);
        } catch (Exception e) {
            log.error("Failed to save device identity to {}: {}", MACHINE_ID_FILE, e.getMessage());
        }
    }

    private String getComputerName() {
        // Try environment variables first
        String name = System.getenv("COMPUTERNAME");
        if (name != null && !name.isEmpty()) return name;

        name = System.getenv("HOSTNAME");
        if (name != null && !name.isEmpty()) return name;

        // Try getting hostname
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            log.warn("Could not determine hostname: {}", e.getMessage());
        }

        return "Unknown-" + machineId;
    }

    /**
     * Load sync server URL from config file.
     * File values override application.properties values.
     */
    private void loadSyncServerConfigFromFile() {
        File file = new File(SYNC_CONFIG_FILE);
        if (!file.exists()) {
            log.debug("No sync config file found at {}", SYNC_CONFIG_FILE);
            return;
        }

        try (FileInputStream fis = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(fis);

            String urlFromFile = props.getProperty("sync.server.url");
            if (urlFromFile != null && !urlFromFile.isEmpty()) {
                this.syncServerUrl = urlFromFile;
                log.info("Loaded sync server URL from file: {}", syncServerUrl);
            }

            String enabledFromFile = props.getProperty("sync.server.enabled");
            if (enabledFromFile != null) {
                this.syncServerEnabled = Boolean.parseBoolean(enabledFromFile);
                log.info("Loaded sync server enabled from file: {}", syncServerEnabled);
            }
        } catch (Exception e) {
            log.warn("Could not load sync config from file: {}", e.getMessage());
        }
    }

    /**
     * Save sync server URL to config file.
     * This persists the configuration across application restarts.
     *
     * @param url The sync server URL
     * @param enabled Whether sync is enabled
     */
    public synchronized void saveSyncServerConfig(String url, boolean enabled) {
        if (isHubMode()) {
            log.warn("Hub mode: ignoring sync server config change (hub uses profile config)");
            return;
        }
        this.syncServerUrl = url;
        this.syncServerEnabled = enabled;

        Properties props = new Properties();
        props.setProperty("sync.server.url", url != null ? url : "");
        props.setProperty("sync.server.enabled", String.valueOf(enabled));

        try (FileOutputStream fos = new FileOutputStream(SYNC_CONFIG_FILE)) {
            props.store(fos, "Sync server configuration - managed by application");
            log.info("Saved sync server config to file: url={}, enabled={}", url, enabled);
        } catch (Exception e) {
            log.error("Failed to persist sync configuration: {}", e.getMessage());
            throw new RuntimeException("Failed to persist sync configuration", e);
        }
    }

    /**
     * Validate sync server URL format.
     *
     * @param url The URL to validate
     * @return true if the URL is valid HTTP or HTTPS
     */
    public boolean isValidSyncServerUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        try {
            URL parsedUrl = new URL(url.trim());
            String protocol = parsedUrl.getProtocol();
            return "http".equals(protocol) || "https".equals(protocol);
        } catch (MalformedURLException e) {
            return false;
        }
    }
}
