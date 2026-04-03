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
    @Value("${device.number:-1}")
    private int deviceNumber;

    @Value("${device.name:}")
    private String deviceName;

    @Value("${server.port:8082}")
    private int syncPort;

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
        if (deviceNumber >= 0 && deviceName != null && !deviceName.isEmpty()) {
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
            log.debug("Hub mode: skipping sync-config.properties file (using profile config)");
        }

        log.info(
            "sync.config.ready role={} machineId={} machineName={} deviceNumber={} deviceName={} syncPort={} intervalSeconds={} serverSyncEnabled={} syncServerUrl={}",
            syncRole,
            machineId,
            machineName,
            deviceNumber >= 0 ? deviceNumber : "unconfigured",
            deviceName != null && !deviceName.isEmpty() ? deviceName : "unconfigured",
            syncPort,
            syncIntervalSeconds,
            syncServerEnabled,
            syncServerUrl
        );

        if (deviceNumber < 0) {
            log.warn("!!! DEVICE NUMBER NOT CONFIGURED - IDs will use fallback device 99. " +
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

            if (tcpResult == 0) {
                log.debug("Firewall rule configured for sync port (TCP:{})", syncPort);
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
                    log.debug("Loaded existing machine ID: {}", id);
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
            log.info("sync.machine_id.generated machineId={}", newId);
        } catch (Exception e) {
            log.error("Error saving machine ID: {}", e.getMessage());
        }

        return newId;
    }

    /**
     * Load device identity (device.number, device.name, machine.id) from machine-id.properties.
     *
     * Priority logic:
     * - If DEVICE_CONFIG env var is explicitly set (by Electron), device-configs/*.properties
     *   wins — machine-id.properties only fills in gaps (machine.id).
     * - If DEVICE_CONFIG is NOT set (standalone deployment), machine-id.properties is the
     *   primary source and overrides the default opi.properties values.
     */
    private void loadDeviceIdentityFromFile() {
        File file = new File(MACHINE_ID_FILE);
        if (!file.exists()) return;

        // If DEVICE_CONFIG env var was explicitly set (by Electron), device-configs values
        // take priority — only load machine.id from file as fallback.
        // If not set, we're running standalone and machine-id.properties is the source of truth.
        boolean deviceConfigExplicitlySet = System.getenv("DEVICE_CONFIG") != null;

        try (FileInputStream fis = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(fis);

            // Load device.number and device.name from machine-id.properties when:
            // - DEVICE_CONFIG is NOT set (standalone mode), OR
            // - DEVICE_CONFIG IS set but classpath properties didn't provide a device number
            //   (e.g., Electron sets DEVICE_CONFIG=installed but device-configs/installed.properties doesn't exist)
            if (!deviceConfigExplicitlySet || this.deviceNumber < 0) {
                String deviceNumberStr = props.getProperty("device.number");
                if (deviceNumberStr != null && !deviceNumberStr.isEmpty()) {
                    try {
                        int num = Integer.parseInt(deviceNumberStr);
                        if (num >= 0 && num <= 99) {
                            this.deviceNumber = num;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }

            if (!deviceConfigExplicitlySet || this.deviceName == null || this.deviceName.isEmpty()) {
                String nameFromFile = props.getProperty("device.name");
                if (nameFromFile != null && !nameFromFile.isEmpty()) {
                    this.deviceName = nameFromFile;
                }
            }

            // machine.id is always loaded from file if not already set
            // (both Electron and standalone need this)
            String idFromFile = props.getProperty("machine.id");
            if (idFromFile != null && !idFromFile.isEmpty() && (machineId == null || machineId.isEmpty())) {
                this.machineId = idFromFile;
            }

            log.debug("Loaded device identity from {} (standalone={}): device.number={}, device.name={}, machine.id={}",
                MACHINE_ID_FILE, !deviceConfigExplicitlySet, deviceNumber, deviceName, machineId);
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
            log.debug("Saved device identity: machine.id={}, device.number={}, device.name={}",
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
                log.debug("Loaded sync server URL from file: {}", syncServerUrl);
            }

            String enabledFromFile = props.getProperty("sync.server.enabled");
            if (enabledFromFile != null) {
                this.syncServerEnabled = Boolean.parseBoolean(enabledFromFile);
                log.debug("Loaded sync server enabled from file: {}", syncServerEnabled);
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
            log.info("sync.server.config.saved url={} enabled={}", url, enabled);
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
