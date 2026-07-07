package com.dk_power.power_plant_java.sevice.esp;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Node identity for the WLED writer-leadership check.
 * <p>
 * {@link #getHostname()} is captured once at startup ({@link InetAddress#getLocalHost()})
 * and used purely for logging — "which machine sent this WLED write". Not persisted
 * anywhere; if hostnames change between restarts, nothing breaks.
 * <p>
 * {@link #isHub()} reads {@code sync.role} — the same property that gates the rest
 * of the hub-only beans in this codebase (see {@code @ConditionalOnProperty(name =
 * "sync.role", havingValue = "hub")} throughout). Everything else is a desktop.
 */
@Service
@Slf4j
@Getter
public class NodeIdentityService {

    @Value("${sync.role:desktop}")
    private String syncRole;

    private String hostname;

    @PostConstruct
    void init() {
        try {
            hostname = InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            hostname = "unknown-host";
            log.warn("[NodeIdentity] Could not resolve hostname, falling back to 'unknown-host'", e);
        }
        log.info("[NodeIdentity] hostname={}, syncRole={}", hostname, syncRole);
    }

    public boolean isHub() {
        return "hub".equalsIgnoreCase(syncRole);
    }
}
