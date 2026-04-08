package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sharepoint.SharePointSyncStatus;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/sharepoint-sync")
public class SharePointSyncController {

    private final SharePointSyncSettings syncSettings;
    private final SharePointSyncOrchestrator orchestrator;
    private final SyncConfig syncConfig;
    private final CentralSyncService centralSyncService;
    private final RestTemplate restTemplate;

    public SharePointSyncController(
            SharePointSyncSettings syncSettings,
            SharePointSyncOrchestrator orchestrator,
            SyncConfig syncConfig,
            @Lazy CentralSyncService centralSyncService,
            RestTemplate restTemplate) {
        this.syncSettings = syncSettings;
        this.orchestrator = orchestrator;
        this.syncConfig = syncConfig;
        this.centralSyncService = centralSyncService;
        this.restTemplate = restTemplate;
    }

    // ── Config endpoints (existing) ──

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

        syncSettings.persistToFile();

        return ResponseEntity.ok(new NgApiResponse<>(buildConfigMap(), "Sync config updated"));
    }

    // ── Unified sync status endpoints ──

    @GetMapping("/status")
    public ResponseEntity<NgApiResponse<List<SharePointSyncStatus>>> getAllStatuses() {
        List<SharePointSyncStatus> statuses = orchestrator.getAllSyncStatuses();
        return ResponseEntity.ok(new NgApiResponse<>(statuses, "All entity sync statuses"));
    }

    @GetMapping("/status/{entityType}")
    public ResponseEntity<NgApiResponse<SharePointSyncStatus>> getStatus(@PathVariable String entityType) {
        SharePointSyncStatus status = orchestrator.getSyncStatus(entityType);
        if (status == null) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Unknown entity type: " + entityType));
        }
        return ResponseEntity.ok(new NgApiResponse<>(status, entityType + " sync status"));
    }

    // ── Manual sync endpoints ──

    @PostMapping("/sync/{entityType}")
    public ResponseEntity<NgApiResponse<SyncResult>> syncEntityType(@PathVariable String entityType) {
        // Fast-fail at the HTTP layer if sync is paused (e.g. during migration)
        if (orchestrator.isClientSyncInProgress()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                .body(new NgApiResponse<>(null, "Sync paused — try again shortly"));
        }

        // If not hub mode and hub is online, proxy the request to hub
        if (!syncConfig.isHubMode() && centralSyncService.isServerAvailable()) {
            try {
                SyncResult proxyResult = proxyToHub(entityType);
                if (proxyResult != null) {
                    String msg = String.format("%s sync (via hub): created=%d, updated=%d, autoClosed=%d, skipped=%d, failed=%d",
                        entityType, proxyResult.getCreated(), proxyResult.getUpdated(),
                        proxyResult.getAutoClosed(), proxyResult.getSkipped(), proxyResult.getFailed());
                    return ResponseEntity.ok(new NgApiResponse<>(proxyResult, msg));
                }
                // proxyResult == null only on transport failure — fall through to local sync
                log.warn("[SP Sync] Hub unreachable for {}, falling back to local sync", entityType);
            } catch (HubRejectedException e) {
                // Hub explicitly rejected (e.g. 503 during migration) — do NOT fall back to local.
                // The hub's decision is authoritative; propagate as 503 to the caller.
                return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new NgApiResponse<>(null, e.getMessage()));
            }
        }

        SyncResult result = orchestrator.syncEntityType(entityType);
        String errorMsg = result.getErrorMessage();
        if (errorMsg != null) {
            if (errorMsg.startsWith("Unknown entity type")) {
                return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(result, errorMsg));
            }
            if (errorMsg.startsWith("Sync paused")) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new NgApiResponse<>(result, errorMsg));
            }
        }
        String message = String.format("%s sync: created=%d, updated=%d, autoClosed=%d, skipped=%d, failed=%d",
            entityType, result.getCreated(), result.getUpdated(),
            result.getAutoClosed(), result.getSkipped(), result.getFailed());
        return ResponseEntity.ok(new NgApiResponse<>(result, message));
    }

    @PostMapping("/sync-all")
    public ResponseEntity<NgApiResponse<List<SyncResult>>> syncAll() {
        List<String> types = orchestrator.getRegisteredEntityTypes();

        // Fast-fail at the HTTP layer if local sync is paused (e.g. during migration)
        if (orchestrator.isClientSyncInProgress()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                .body(new NgApiResponse<>(null, "Sync paused — try again shortly"));
        }

        // If not hub mode and hub is online, proxy all to hub
        if (!syncConfig.isHubMode() && centralSyncService.isServerAvailable()) {
            List<SyncResult> results = new java.util.ArrayList<>();
            for (String type : types) {
                try {
                    SyncResult proxyResult = proxyToHub(type);
                    results.add(proxyResult != null ? proxyResult : orchestrator.syncEntityType(type));
                } catch (HubRejectedException e) {
                    // Hub rejected — propagate as 503 for the whole batch, do NOT fall back locally
                    return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                        .body(new NgApiResponse<>(null, e.getMessage()));
                }
            }
            return ResponseEntity.ok(new NgApiResponse<>(results, "Synced " + types.size() + " entity types via hub"));
        }

        List<SyncResult> results = types.stream()
            .map(orchestrator::syncEntityType)
            .toList();
        return ResponseEntity.ok(new NgApiResponse<>(results, "Synced " + types.size() + " entity types"));
    }

    // ── Discovery endpoint ──

    @GetMapping("/entity-types")
    public ResponseEntity<NgApiResponse<List<String>>> getEntityTypes() {
        List<String> types = orchestrator.getRegisteredEntityTypes();
        return ResponseEntity.ok(new NgApiResponse<>(types, "Registered entity types"));
    }

    /**
     * Clear all SP snapshots, forcing next sync to re-evaluate all fields.
     * Use after fixing sync bugs to recover from stale snapshot state.
     */
    @PostMapping("/clear-snapshots")
    public ResponseEntity<NgApiResponse<String>> clearSnapshots() {
        orchestrator.clearAllSnapshots();
        return ResponseEntity.ok(new NgApiResponse<>("Snapshots cleared", "All SharePoint snapshots cleared — next sync will re-evaluate all fields"));
    }

    // ── Helpers ──

    private Map<String, Object> buildConfigMap() {
        return Map.of(
                "enabled", syncSettings.isEnabled(),
                "intervalMs", syncSettings.getIntervalMs(),
                "peerSyncIntervalSeconds", syncSettings.getPeerSyncIntervalSeconds(),
                "healthCheckIntervalMs", syncSettings.getHealthCheckIntervalMs()
        );
    }

    /**
     * Thrown when the hub explicitly rejects a sync request (e.g. 503 during migration).
     * Callers MUST NOT fall back to local sync on this exception — the hub's rejection is authoritative.
     */
    public static class HubRejectedException extends RuntimeException {
        public HubRejectedException(String message) { super(message); }
    }

    /**
     * Proxy a sync request to the hub.
     * @return SyncResult on success, or null on transport failure (connection refused, timeout, DNS).
     * @throws HubRejectedException if the hub responded with 4xx/5xx — caller must propagate, not fall back.
     */
    @SuppressWarnings("unchecked")
    private SyncResult proxyToHub(String entityType) {
        String hubUrl = syncConfig.getSyncServerUrl() + "/api/sharepoint-sync/sync/" + entityType;
        log.info("[SP Sync] Proxying {} sync to hub: {}", entityType, hubUrl);
        ResponseEntity<NgApiResponse> response;
        try {
            response = restTemplate.postForEntity(hubUrl, null, NgApiResponse.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            // Hub returned 4xx/5xx — authoritative rejection, do NOT fall back
            String body = e.getResponseBodyAsString();
            log.warn("[SP Sync] Hub rejected {} sync: {} {}", entityType, e.getStatusCode(), body);
            throw new HubRejectedException("Hub rejected sync: " + e.getStatusCode() + " " + body);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // Transport failure (connection refused, timeout) — safe to fall back to local
            log.warn("[SP Sync] Hub unreachable for {}: {}", entityType, e.getMessage());
            return null;
        } catch (Exception e) {
            log.warn("[SP Sync] Hub proxy failed for {}: {}", entityType, e.getMessage());
            return null;
        }

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object data = response.getBody().getResponseData();
            if (data instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) data;
                SyncResult result = new SyncResult();
                result.setCreated(toInt(map.get("created")));
                result.setUpdated(toInt(map.get("updated")));
                result.setAutoClosed(toInt(map.get("autoClosed")));
                result.setSkipped(toInt(map.get("skipped")));
                result.setFailed(toInt(map.get("failed")));
                result.setErrorMessage((String) map.get("errorMessage"));
                return result;
            }
        }
        return null;
    }

    private static int toInt(Object val) {
        return val instanceof Number ? ((Number) val).intValue() : 0;
    }
}
