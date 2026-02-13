package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sharepoint-sync")
@RequiredArgsConstructor
public class SharePointSyncController {

    private final SharePointSyncSettings syncSettings;

    @GetMapping("/config")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getConfig() {
        return ResponseEntity.ok(new NgApiResponse<>(buildConfigMap(), "SharePoint sync config"));
    }

    @PutMapping("/config")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> updateConfig(@RequestBody Map<String, Object> body) {
        if (body.containsKey("enabled")) {
            syncSettings.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        }
        if (body.containsKey("intervalMs")) {
            Object val = body.get("intervalMs");
            if (val instanceof Number) {
                long ms = ((Number) val).longValue();
                if (ms >= 30000) {
                    syncSettings.setIntervalMs(ms);
                }
            }
        }
        if (body.containsKey("peerSyncIntervalSeconds")) {
            Object val = body.get("peerSyncIntervalSeconds");
            if (val instanceof Number) {
                int sec = ((Number) val).intValue();
                if (sec >= 10) {
                    syncSettings.setPeerSyncIntervalSeconds(sec);
                }
            }
        }
        if (body.containsKey("healthCheckIntervalMs")) {
            Object val = body.get("healthCheckIntervalMs");
            if (val instanceof Number) {
                long ms = ((Number) val).longValue();
                if (ms >= 60000) {
                    syncSettings.setHealthCheckIntervalMs(ms);
                }
            }
        }

        return ResponseEntity.ok(new NgApiResponse<>(buildConfigMap(), "Sync config updated"));
    }

    private Map<String, Object> buildConfigMap() {
        return Map.of(
                "enabled", syncSettings.isEnabled(),
                "intervalMs", syncSettings.getIntervalMs(),
                "peerSyncIntervalSeconds", syncSettings.getPeerSyncIntervalSeconds(),
                "healthCheckIntervalMs", syncSettings.getHealthCheckIntervalMs()
        );
    }
}
