package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.SyncE2EMergeTestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Test-only endpoints (sync.test-endpoints.enabled=true; absent in prod) that DIRECTLY exercise the
 * 2026-08-24 emission-gap fixes in a hub+2-client lab: seed a merge scenario on one node, let it sync,
 * trigger the merge on the hub, then inspect the re-pointed FKs on every node to confirm the managed
 * saves emitted and converged. See {@link SyncE2EMergeTestService}.
 */
@RestController
@RequestMapping("/api/sync-e2e/merge")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
public class SyncE2EMergeTestController {

    private final SyncE2EMergeTestService svc;

    // ---- Loto merge (B1/B4/B5) ----
    @PostMapping("/seed-loto")
    public ResponseEntity<Map<String, Object>> seedLoto(@RequestParam String spId) {
        return ResponseEntity.ok(svc.seedLotoMerge(spId));
    }

    @PostMapping("/trigger-loto")
    public ResponseEntity<Map<String, Object>> triggerLoto() {
        return ResponseEntity.ok(svc.triggerLotoMerge());
    }

    @PostMapping("/inspect-loto")
    public ResponseEntity<Map<String, Object>> inspectLoto(@RequestBody Map<String, Object> ids) {
        return ResponseEntity.ok(svc.inspectLoto(toLongMap(ids)));
    }

    // ---- WorkRequest merge (B2/B6) ----
    @PostMapping("/seed-workrequest")
    public ResponseEntity<Map<String, Object>> seedWr(@RequestParam String spId) {
        return ResponseEntity.ok(svc.seedWorkRequestMerge(spId));
    }

    @PostMapping("/trigger-workrequest")
    public ResponseEntity<Map<String, Object>> triggerWr() {
        return ResponseEntity.ok(svc.triggerWorkRequestMerge());
    }

    @PostMapping("/inspect-workrequest")
    public ResponseEntity<Map<String, Object>> inspectWr(@RequestBody Map<String, Object> ids) {
        return ResponseEntity.ok(svc.inspectWorkRequest(toLongMap(ids)));
    }

    // ---- ZeroEnergy repoint (C1) ----
    @PostMapping("/seed-zeroenergy")
    public ResponseEntity<Map<String, Object>> seedZe() {
        return ResponseEntity.ok(svc.seedZeroEnergyShare());
    }

    @PostMapping("/trigger-zeroenergy")
    public ResponseEntity<Map<String, Object>> triggerZe(@RequestParam Long sourceId, @RequestParam Long targetId) {
        return ResponseEntity.ok(svc.triggerZeroEnergyMerge(sourceId, targetId));
    }

    @PostMapping("/inspect-zeroenergy")
    public ResponseEntity<Map<String, Object>> inspectZe(@RequestBody Map<String, Object> ids) {
        return ResponseEntity.ok(svc.inspectZeroEnergy(toLongMap(ids)));
    }

    // ---- Message read (C3) ----
    @PostMapping("/seed-message")
    public ResponseEntity<Map<String, Object>> seedMsg(@RequestParam Long readerUserId) {
        return ResponseEntity.ok(svc.seedMessageScenario(readerUserId));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Map<String, Object>> markRead(@RequestParam Long conversationId, @RequestParam Long readerUserId) {
        return ResponseEntity.ok(svc.markRead(conversationId, readerUserId));
    }

    @PostMapping("/inspect-message")
    public ResponseEntity<Map<String, Object>> inspectMsg(@RequestBody Map<String, Object> ids) {
        return ResponseEntity.ok(svc.inspectMessage(toLongMap(ids)));
    }

    // ---- Instrument (tag_number key + unique-constraint drop + coexist) ----
    @PostMapping("/seed-instrument")
    public ResponseEntity<Map<String, Object>> seedInstrument(@RequestParam String tag) {
        return ResponseEntity.ok(svc.seedInstrumentMerge(tag));
    }

    @PostMapping("/trigger-instrument")
    public ResponseEntity<Map<String, Object>> triggerInstrument() {
        return ResponseEntity.ok(svc.triggerInstrumentMerge());
    }

    @PostMapping("/inspect-instrument")
    public ResponseEntity<Map<String, Object>> inspectInstrument(@RequestBody Map<String, Object> ids) {
        return ResponseEntity.ok(svc.inspectInstrument(toLongMap(ids)));
    }

    private Map<String, Long> toLongMap(Map<String, Object> in) {
        Map<String, Long> out = new HashMap<>();
        if (in == null) return out;
        for (Map.Entry<String, Object> e : in.entrySet()) {
            Object v = e.getValue();
            if (v instanceof Number n) out.put(e.getKey(), n.longValue());
            else if (v instanceof String s) {
                try { out.put(e.getKey(), Long.parseLong(s)); } catch (NumberFormatException ignore) { /* skip non-numeric like spId */ }
            }
        }
        return out;
    }
}
