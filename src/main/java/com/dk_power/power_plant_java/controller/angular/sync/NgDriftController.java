package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.sevice.sync.DriftDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        DriftDetectionService.DriftScanResult r = new DriftDetectionService.DriftScanResult();
        r.typesScanned = 1;
        StringBuilder problems = new StringBuilder();
        try {
            add(r, driftDetectionService.detectHubForType(entityType));
        } catch (Exception e) {
            r.errors++;
            problems.append("hub check failed: ").append(e.getMessage()).append("; ");
            log.error("drift scan[HUB] failed for {}: {}", entityType, e.getMessage());
        }
        try {
            add(r, driftDetectionService.detectSpForType(entityType));
        } catch (Exception e) {
            r.errors++;
            problems.append("SharePoint check failed: ").append(e.getMessage()).append("; ");
            log.error("drift scan[SP] failed for {}: {}", entityType, e.getMessage());
        }
        String msg = problems.length() == 0
                ? "Drift scan complete for " + entityType
                : "Drift scan partial for " + entityType + " — " + problems;
        return ResponseEntity.ok(new NgApiResponse<>(r, msg));
    }

    private void add(DriftDetectionService.DriftScanResult total, DriftDetectionService.DriftScanResult one) {
        total.flagged += one.flagged;
        total.stillDrifting += one.stillDrifting;
        total.reconciled += one.reconciled;
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
}
