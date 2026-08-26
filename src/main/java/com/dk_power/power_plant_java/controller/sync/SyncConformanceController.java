package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.SyncConformanceService;
import com.dk_power.power_plant_java.sevice.sync.SyncConformanceOperationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dk_power.power_plant_java.sevice.sync.ConformanceResult;

import java.util.List;
import java.util.Map;

/**
 * Sync-conformance harness endpoints. Test-only: the bean is absent in production unless
 * {@code sync.test-endpoints.enabled=true} (same gate as the other {@code /api/sync-e2e} / {@code /api/sync-test}
 * harnesses). LAN-only via {@code SecurityConfigSpring} ({@code /api/sync-conformance/} in the lanOnly matcher).
 *
 * <p>Phase 1 exposes coverage/discovery of the collection-mutation surface — the inventory of every owning
 * {@code @ManyToMany}/{@code @OneToMany} field across all synced entities, i.e. every place the
 * "collection change doesn't emit / doesn't sync" bug (the LotoStandard.lotoPoints regression) can hide.
 * See {@link SyncConformanceService}.
 */
@RestController
@RequestMapping("/api/sync-conformance")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
public class SyncConformanceController {

    private final SyncConformanceService svc;
    private final SyncConformanceOperationService ops;

    /** Every owning @ManyToMany / @OneToMany tracked field across all synced entities. */
    @GetMapping("/collection-fields")
    public ResponseEntity<List<Map<String, Object>>> collectionFields() {
        return ResponseEntity.ok(svc.discoverCollectionFields());
    }

    /** Full coverage report: synced-type count/list, collection-field inventory, and registration gaps. */
    @GetMapping("/coverage")
    public ResponseEntity<Map<String, Object>> coverage() {
        return ResponseEntity.ok(svc.coverageReport());
    }

    /**
     * Confirm this node is safe to run mutation sweeps on: every external integration (SharePoint, Maximo,
     * Supabase) must be off, or Phase-2 mutations are refused. Read this BEFORE trusting the harness so a
     * sweep can never push test data to a live external system (the prod hub has all three live).
     */
    @GetMapping("/isolation-status")
    public ResponseEntity<Map<String, Object>> isolationStatus() {
        return ResponseEntity.ok(svc.isolationStatus());
    }

    // ---- Generator 1: scalar field sweep (mutate each field, assert a FieldChange was emitted) ----

    /** Sweep every scalar field of every synced type; returns a summary with the emission gaps first. Refused unless isolated. */
    @PostMapping("/field-sweep")
    public ResponseEntity<Map<String, Object>> fieldSweepAll() {
        return ResponseEntity.ok(svc.fieldSweepAll());
    }

    /** Sweep every scalar field of ONE synced type (targeted debugging). Refused unless isolated. */
    @PostMapping("/field-sweep/{entityType}")
    public ResponseEntity<List<ConformanceResult>> fieldSweep(@PathVariable String entityType) {
        return ResponseEntity.ok(svc.fieldSweep(entityType));
    }

    // ---- Generator 2: real-operation tests (collection/membership/lifecycle) ----

    /** Flagship: LotoStandard add/remove member through the real gated service; asserts the membership change emitted. */
    @PostMapping("/operation/loto-standard-membership")
    public ResponseEntity<List<ConformanceResult>> lotoStandardMembership() {
        return ResponseEntity.ok(ops.lotoStandardMembership());
    }
}
