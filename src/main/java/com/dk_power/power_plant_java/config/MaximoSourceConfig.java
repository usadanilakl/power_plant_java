package com.dk_power.power_plant_java.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Properties;

/**
 * Where this instance gets Maximo data: directly, or relayed through the hub.
 *
 * <p>Runtime-mutable on purpose. It used to be a plain {@code maximo.source} property driving
 * {@code @ConditionalOnProperty} on two mutually-exclusive controllers — which meant the choice was
 * fixed at boot, could only be changed by editing a file on the machine, and made a fallback
 * impossible: on a kiosk the local controller did not exist to fall back TO.
 *
 * <p>Same shape as {@link SyncConfig}'s server settings: {@code application.properties} supplies the
 * default, a small file next to the app overrides it, and the setter persists so the choice survives
 * a restart.
 */
@Component
@Slf4j
public class MaximoSourceConfig {

    public enum Source { LOCAL, HUB }

    private static final String CONFIG_FILE = "./maximo-source.properties";
    private static final String KEY = "maximo.source";
    private static final String KEY_HUB_URL = "maximo.hub.url";
    private static final String KEY_HUB_EMAIL = "hub.kiosk.email";
    private static final String KEY_HUB_PASSWORD = "hub.kiosk.password";

    @Value("${maximo.source:local}")
    private String configuredSource;
    @Value("${maximo.hub.url:}")
    private String configuredHubUrl;
    @Value("${hub.kiosk.email:}")
    private String configuredHubEmail;
    @Value("${hub.kiosk.password:}")
    private String configuredHubPassword;

    private volatile Source source = Source.LOCAL;
    // Per-device overrides of the baked-in properties. BLANK MEANS "NOT OVERRIDDEN" — the property
    // wins. That is not a nicety: a provisioned kiosk already carries working credentials in
    // device-configs/kiosk.properties, and the settings form posts all three fields together, so
    // treating "" as a real value would let one Save with empty boxes silently disable a device that
    // was configured correctly.
    private volatile String hubUrl;
    private volatile String hubEmail;
    private volatile String hubPassword;

    @PostConstruct
    void init() {
        source = parse(configuredSource);
        loadFromFile();
        log.info("[Maximo] effective source = {} (hub url={})", source,
                getHubUrl().isBlank() ? "NOT SET" : getHubUrl());
    }

    public Source getSource() {
        return source;
    }

    public boolean isHub() {
        return source == Source.HUB;
    }

    /**
     * The hub's base URL for Maximo calls.
     *
     * <p>Deliberately does NOT fall back to {@code sync.server.url}. That is the internal LAN address
     * (10.x), and the machine most likely to need the hub proxy is a kiosk on plant WiFi, which
     * cannot route it — a silent fall-through to the LAN URL is exactly how this failed before. A
     * blank answer here means "not configured", and the caller says so.
     */
    public String getHubUrl() {
        return override(hubUrl, configuredHubUrl);
    }

    public String getHubEmail() {
        return override(hubEmail, configuredHubEmail);
    }

    public String getHubPassword() {
        return override(hubPassword, configuredHubPassword);
    }

    /** The per-device value when one was actually entered, otherwise whatever the jar was built with. */
    private static String override(String device, String configured) {
        return (device == null || device.isBlank()) ? nullToEmpty(configured) : device;
    }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }

    /** True when this device is running an entered value rather than the one baked into the jar. */
    public boolean isHubConnectionOverridden() {
        return notBlank(hubUrl) || notBlank(hubEmail) || notBlank(hubPassword);
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    /**
     * Persist hub connection settings. A null argument leaves that field alone; an empty string
     * clears it. Lets a kiosk be pointed at the public hub URL from its own Settings page, which a
     * jar-baked properties file cannot do.
     */
    public synchronized void setHubConnection(String url, String email, String password) {
        if (url != null) this.hubUrl = url.trim();
        if (email != null) this.hubEmail = email.trim();
        if (password != null) this.hubPassword = password;
        persist();
    }

    /** Persist a new choice so it survives a restart. */
    public synchronized void setSource(Source next) {
        if (next == null) return;
        this.source = next;
        persist();
        log.info("[Maximo] source changed to {}", next);
    }

    private void persist() {
        Properties props = new Properties();
        props.setProperty(KEY, source.name().toLowerCase());
        if (hubUrl != null) props.setProperty(KEY_HUB_URL, hubUrl);
        if (hubEmail != null) props.setProperty(KEY_HUB_EMAIL, hubEmail);
        if (hubPassword != null) props.setProperty(KEY_HUB_PASSWORD, hubPassword);
        try (FileOutputStream fos = new FileOutputStream(CONFIG_FILE)) {
            props.store(fos, "Maximo data source - managed by the app");
        } catch (Exception e) {
            // Keep the in-memory change: the user asked for it and it is working now. Only the
            // survival across restart is lost, which is worth a warning rather than a failure.
            log.warn("[Maximo] could not persist to {}: {}", CONFIG_FILE, e.getMessage());
        }
    }

    private void loadFromFile() {
        File file = new File(CONFIG_FILE);
        if (!file.exists()) return;
        try (FileInputStream fis = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(fis);
            String fromFile = props.getProperty(KEY);
            if (fromFile != null && !fromFile.isBlank()) {
                source = parse(fromFile);
                log.debug("[Maximo] source loaded from {}: {}", CONFIG_FILE, source);
            }
            if (props.containsKey(KEY_HUB_URL)) hubUrl = props.getProperty(KEY_HUB_URL);
            if (props.containsKey(KEY_HUB_EMAIL)) hubEmail = props.getProperty(KEY_HUB_EMAIL);
            if (props.containsKey(KEY_HUB_PASSWORD)) hubPassword = props.getProperty(KEY_HUB_PASSWORD);
        } catch (Exception e) {
            log.warn("[Maximo] could not read {}: {}", CONFIG_FILE, e.getMessage());
        }
    }

    private static Source parse(String raw) {
        return "hub".equalsIgnoreCase(raw == null ? "" : raw.trim()) ? Source.HUB : Source.LOCAL;
    }
}
