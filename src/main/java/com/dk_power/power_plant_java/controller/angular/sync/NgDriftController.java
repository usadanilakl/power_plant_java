package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.sevice.sync.DriftDetectionService;
import com.dk_power.power_plant_java.sevice.sync.SyncComparisonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Angular-facing read/triage API over the persisted {@link DriftRecord}s (Stream A). The heavy field-level
 * diffs are NOT duplicated here — the UI reuses the existing {@code /ng/sync/compare/{type}/{id}} (2-way)
 * and {@code /ng/sync/compare/verify/{type}/{id}/diff} (3-way local/hub/SP) endpoints to show WHICH fields
 * differ; this controller owns detection triggers, the badge-feeding status maps, row drill-down, and the
 * flagged/acknowledged lifecycle.
 */
@RestController
@RequestMapping("/ng/sync/drift")
@RequiredArgsConstructor
@Slf4j
public class NgDriftController {

    private final DriftDetectionService driftDetectionService;
    private final SyncComparisonService syncComparisonService;
    private final SyncConfig syncConfig;
    private final com.dk_power.power_plant_java.sevice.sync.SyncLabelService syncLabelService;

    /** Run a full drift scan (both peers, every type) and persist/refresh records. Synchronous. */
    @PostMapping("/scan")
    public ResponseEntity<NgApiResponse<DriftDetectionService.DriftScanResult>> scanAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(driftDetectionService.detectAll(), "Drift scan complete"));
        } catch (Exception e) {
            log.error("drift scan failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Scan failed: " + e.getMessage()));
        }
    }

    /**
     * Scan a single type (hub always; SharePoint too if it is SP-backed). The two peers are detected
     * INDEPENDENTLY — a hub-probe failure must NOT abort the SharePoint scan. This is load-bearing:
     * a type like WorkRequest drifts ONLY on the SP peer (missing-from-SP rows), while the hub content-hash
     * probe is the heaviest/most failure-prone (large rows + a possibly-absent hub endpoint). Running them
     * in one try/catch (hub first) let a hub throw swallow the SP records entirely, so nothing ever showed.
     */
    @PostMapping("/scan/{entityType}")
    public ResponseEntity<NgApiResponse<DriftDetectionService.DriftScanResult>> scanType(
            @PathVariable String entityType) {
        DriftDetectionService.DriftScanResult r = driftDetectionService.scanTypeFull(entityType);
        return ResponseEntity.ok(new NgApiResponse<>(r, r.errors == 0
                ? "Drift scan complete for " + entityType
                : "Drift scan partial for " + entityType + " (" + r.errors + " check(s) failed)"));
    }

    /** Per-type scan overview (last-scanned, SP-backed, active count, error) — the Drift Center's list. */
    @GetMapping("/overview")
    public ResponseEntity<NgApiResponse<List<com.dk_power.power_plant_java.entities.sync.DriftScanState>>> overview() {
        return ResponseEntity.ok(new NgApiResponse<>(driftDetectionService.overview(), "OK"));
    }

    /** Active (flagged + acknowledged) records for a type — the frontend builds its per-row badge map. */
    @GetMapping("/status/{entityType}")
    public ResponseEntity<NgApiResponse<List<DriftRecord>>> statusForType(@PathVariable String entityType) {
        return ResponseEntity.ok(new NgApiResponse<>(
                driftDetectionService.activeForType(entityType), "OK"));
    }

    /** Every record (any status/field/peer) for one row — the form/row drill-down. */
    @GetMapping("/row/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<List<DriftRecord>>> rowRecords(
            @PathVariable String entityType, @PathVariable Long entityId) {
        return ResponseEntity.ok(new NgApiResponse<>(
                driftDetectionService.forRow(entityType, entityId), "OK"));
    }

    /** Acknowledge a record (leave the drift, stop nagging). */
    @PostMapping("/acknowledge/{recordId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> acknowledge(@PathVariable Long recordId) {
        boolean ok = driftDetectionService.acknowledge(recordId);
        return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("acknowledged", ok, "recordId", recordId),
                ok ? "Acknowledged" : "Record not found or already resolved"));
    }

    /** Global drift counts (flagged/acknowledged/reconciled) — the header indicator's trustworthy signal. */
    @GetMapping("/summary")
    public ResponseEntity<NgApiResponse<Map<String, Long>>> summary() {
        return ResponseEntity.ok(new NgApiResponse<>(driftDetectionService.summaryCounts(), "OK"));
    }

    /** Breakdown of active drift by direction/peer (hub differs / on-hub-not-here / here-not-on-hub / SP). */
    @GetMapping("/breakdown")
    public ResponseEntity<NgApiResponse<Map<String, Long>>> breakdown() {
        return ResponseEntity.ok(new NgApiResponse<>(driftDetectionService.breakdown(), "OK"));
    }

    /**
     * Friendly labels (id -> tag/name/description) for HUB-ONLY rows the local list can't render — used by the
     * "missing from local" strip so a row reads "01-VCND100" instead of a bare id. One batched hub call
     * (was one round-trip per id); ids the hub can't resolve come back as "#id".
     */
    @PostMapping("/hub-labels/{entityType}")
    public ResponseEntity<NgApiResponse<Map<Long, String>>> hubLabels(
            @PathVariable String entityType, @RequestBody List<Long> ids) {
        return ResponseEntity.ok(new NgApiResponse<>(fill(ids, fetchHubLabels(entityType, ids)), "OK"));
    }

    /**
     * Labels for a MIXED list of drifted rows — the Drift Center's row list, where some ids exist locally
     * (DIFFERING / MISSING_ON_PEER) and some don't (MISSING_LOCALLY). Resolves locally first (free, no
     * network) and asks the hub only for what's left, so a normal drift list costs zero or one hub call.
     */
    @PostMapping("/labels/{entityType}")
    public ResponseEntity<NgApiResponse<Map<Long, String>>> labels(
            @PathVariable String entityType, @RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) return ResponseEntity.ok(new NgApiResponse<>(Map.of(), "OK"));

        Map<Long, String> resolved = new LinkedHashMap<>(syncLabelService.labelsFor(entityType, ids));
        List<Long> unresolved = ids.stream()
                .filter(id -> id != null && ("#" + id).equals(resolved.get(id)))
                .toList();
        if (!unresolved.isEmpty()) resolved.putAll(fetchHubLabels(entityType, unresolved));
        return ResponseEntity.ok(new NgApiResponse<>(fill(ids, resolved), "OK"));
    }

    /** One batched hub call; empty (not an error) when sync isn't configured or the hub is unreachable. */
    private Map<Long, String> fetchHubLabels(String entityType, List<Long> ids) {
        String url = syncConfig.getSyncServerUrl();
        if (ids == null || ids.isEmpty() || url == null || url.isBlank()) return Map.of();
        try {
            return syncComparisonService.fetchServerEntityLabels(entityType, ids, url);
        } catch (Exception e) {
            log.debug("hub labels failed for {}: {}", entityType, e.getMessage());
            return Map.of();
        }
    }

    /** Guarantee an entry per requested id so the UI never has to special-case a missing key. */
    private Map<Long, String> fill(List<Long> ids, Map<Long, String> resolved) {
        Map<Long, String> out = new LinkedHashMap<>();
        if (ids == null) return out;
        for (Long id : ids) {
            if (id == null) continue;
            String v = resolved.get(id);
            out.put(id, (v == null || v.isBlank()) ? "#" + id : v);
        }
        return out;
    }
}
