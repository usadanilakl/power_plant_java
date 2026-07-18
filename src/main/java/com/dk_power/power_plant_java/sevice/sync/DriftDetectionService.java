package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.DriftKind;
import com.dk_power.power_plant_java.entities.sync.DriftPeer;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.entities.sync.DriftStatus;
import com.dk_power.power_plant_java.repository.sync.DriftRecordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns the (report-only, on-demand) drift oracles into DURABLE, per-machine {@link DriftRecord}s so a
 * table/form can show a stable flagged/reconciled badge instead of re-scanning live every render.
 *
 * <p>Detects against TWO peers, independently:
 * <ul>
 *   <li>{@link DriftPeer#HUB} — the content-hash oracle ({@code compareEntityTypeByContent}): accurate
 *       field-level value drift, for every synced type;</li>
 *   <li>{@link DriftPeer#SHAREPOINT} — {@code EntityVerificationService.verify}, for SP-backed types only:
 *       currently row-presence drift (a local row missing from SP). SP field-value drift is available
 *       on-demand per row via {@code threeWayFieldDiff} (surfaced on drill-down), not type-wide here.</li>
 * </ul>
 *
 * <p>Each peer's records follow the same idempotent, self-healing lifecycle (mirroring {@code RoundIssue}):
 * open FLAGGED on first detection, preserve an ACKNOWLEDGED triage while still drifting, re-open a
 * RECONCILED row that drifts again, and auto-RECONCILE (AUTO_CONVERGED) an active row no longer drifting.
 * The auto-reconcile sweep is peer-scoped and is SKIPPED for a peer we couldn't reach this scan (so a hub
 * outage or SP being down never falsely clears real drift). Hub/SP round-trips run OUTSIDE the DB tx.
 */
@Service
@Slf4j
public class DriftDetectionService {

    private static final List<DriftStatus> ACTIVE = List.of(DriftStatus.FLAGGED, DriftStatus.ACKNOWLEDGED);

    private final SyncComparisonService syncComparisonService;
    private final EntityVerificationService entityVerificationService;
    private final DriftRecordRepository repo;
    private final EntityTableRegistry entityTableRegistry;
    private final TransactionTemplate tx;

    public DriftDetectionService(SyncComparisonService syncComparisonService,
                                 EntityVerificationService entityVerificationService,
                                 DriftRecordRepository repo,
                                 EntityTableRegistry entityTableRegistry,
                                 PlatformTransactionManager txManager) {
        this.syncComparisonService = syncComparisonService;
        this.entityVerificationService = entityVerificationService;
        this.repo = repo;
        this.entityTableRegistry = entityTableRegistry;
        this.tx = new TransactionTemplate(txManager);
    }

    /** Scan every synced type against both peers. Per-type/per-peer failures are isolated. */
    public DriftScanResult detectAll() {
        DriftScanResult total = new DriftScanResult();
        for (String type : entityTableRegistry.getSyncOrder()) {
            try {
                accumulate(total, detectHubForType(type));
            } catch (Exception e) {
                total.errors++;
                log.warn("drift.detect[HUB] failed for {}: {}", type, e.getMessage());
            }
            if (entityVerificationService.isSpBacked(type)) {
                try {
                    accumulate(total, detectSpForType(type));
                } catch (Exception e) {
                    total.errors++;
                    log.warn("drift.detect[SP] failed for {}: {}", type, e.getMessage());
                }
            }
        }
        log.info("drift.detect complete: {} scans, {} newly flagged, {} still drifting, {} auto-reconciled, {} error(s)",
                total.typesScanned, total.flagged, total.stillDrifting, total.reconciled, total.errors);
        return total;
    }

    private void accumulate(DriftScanResult total, DriftScanResult one) {
        total.typesScanned++;
        if (one.flagged > 0 || one.reconciled > 0 || one.stillDrifting > 0) total.typesDrifting++;
        total.flagged += one.flagged;
        total.stillDrifting += one.stillDrifting;
        total.reconciled += one.reconciled;
    }

    /** HUB drift for one type via the content-hash oracle. Probe runs first (no tx); upsert is one short tx. */
    public DriftScanResult detectHubForType(String entityType) {
        SyncComparisonService.ContentDriftSummary summary =
                syncComparisonService.compareEntityTypeByContent(entityType);
        if (summary.getError() != null) {
            throw new IllegalStateException(summary.getError());
        }
        Map<Long, DriftKind> current = new HashMap<>();
        summary.getDiffering().forEach(id -> current.put(id, DriftKind.DIFFERING));
        summary.getMissingLocally().forEach(id -> current.put(id, DriftKind.MISSING_LOCALLY));
        summary.getMissingOnHub().forEach(id -> current.put(id, DriftKind.MISSING_ON_PEER));

        DriftScanResult r = new DriftScanResult();
        tx.executeWithoutResult(st -> reconcile(entityType, DriftPeer.HUB, current, r));
        return r;
    }

    /**
     * SHAREPOINT drift for one SP-backed type via the 3-way verification. Records row-presence drift
     * (local rows missing from SP). If SP (or the hub, which verify also needs) is unreachable this scan,
     * we do NOT auto-reconcile — the peer's true state is unknown, so clearing records would be a false
     * "resolved". SP field-value drift is intentionally NOT type-scanned here (drill-down only).
     */
    public DriftScanResult detectSpForType(String entityType) {
        DriftScanResult r = new DriftScanResult();
        if (!entityVerificationService.isSpBacked(entityType)) return r;

        EntityVerificationService.VerificationResult v =
                entityVerificationService.verify(entityType, null);
        if (!v.isHubReachable() || !v.isSpReachable()) {
            log.debug("drift.detect[SP] {} skipped — hubReachable={} spReachable={}",
                    entityType, v.isHubReachable(), v.isSpReachable());
            return r; // unknown state — never flag or clear on an unreachable peer
        }

        Map<Long, DriftKind> current = new HashMap<>();
        for (EntityVerificationService.EntityVerificationStatus s : v.getIssues()) {
            if (s.getEntityId() == null) continue; // SP_ONLY (no local id) — an import case, not row drift
            if ("MISSING_FROM_SP".equals(s.getSpStatus())) {
                current.put(s.getEntityId(), DriftKind.MISSING_ON_PEER);
            }
        }
        tx.executeWithoutResult(st -> reconcile(entityType, DriftPeer.SHAREPOINT, current, r));
        return r;
    }

    private void reconcile(String entityType, DriftPeer peer, Map<Long, DriftKind> current, DriftScanResult r) {
        Instant now = Instant.now();

        for (Map.Entry<Long, DriftKind> e : current.entrySet()) {
            DriftRecord rec = repo
                    .findByEntityTypeAndEntityIdAndFieldNameAndPeer(entityType, e.getKey(), DriftRecord.ROW, peer)
                    .orElse(null);
            if (rec == null) {
                rec = new DriftRecord();
                rec.setEntityType(entityType);
                rec.setEntityId(e.getKey());
                rec.setFieldName(DriftRecord.ROW);
                rec.setPeer(peer);
                rec.setFirstDetectedAt(now);
                rec.setStatus(DriftStatus.FLAGGED);
                r.flagged++;
            } else if (rec.getStatus() == DriftStatus.RECONCILED) {
                rec.setStatus(DriftStatus.FLAGGED);
                rec.setResolvedAt(null);
                rec.setResolvedBy(null);
                rec.setResolution(null);
                r.flagged++;
            } else {
                r.stillDrifting++; // FLAGGED or ACKNOWLEDGED — preserve the user's triage
            }
            rec.setKind(e.getValue());
            rec.setLastDetectedAt(now);
            repo.save(rec);
        }

        // Auto-reconcile: active row-level records for THIS peer whose row is no longer drifting.
        for (DriftRecord rec : repo.findByEntityTypeAndPeerAndFieldNameAndStatusIn(
                entityType, peer, DriftRecord.ROW, ACTIVE)) {
            if (!current.containsKey(rec.getEntityId())) {
                rec.setStatus(DriftStatus.RECONCILED);
                rec.setResolvedAt(now);
                rec.setResolution("AUTO_CONVERGED");
                repo.save(rec);
                r.reconciled++;
            }
        }
    }

    // ==================== Queries + triage (for the UI) ====================

    /** Active (FLAGGED + ACKNOWLEDGED) records for a type — feeds the table badge map (one call per type). */
    public List<DriftRecord> activeForType(String entityType) {
        return repo.findByEntityTypeAndStatusIn(entityType, ACTIVE);
    }

    /** Every record (any status/field/peer) for one row — the form/row drill-down. */
    public List<DriftRecord> forRow(String entityType, Long entityId) {
        return repo.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /** Mark a record ACKNOWLEDGED (the user saw it and chose to leave it). No-op on a resolved record. */
    public boolean acknowledge(Long recordId) {
        return Boolean.TRUE.equals(tx.execute(st -> {
            DriftRecord r = repo.findById(recordId).orElse(null);
            if (r == null || r.getStatus() == DriftStatus.RECONCILED) return false;
            r.setStatus(DriftStatus.ACKNOWLEDGED);
            repo.save(r);
            return true;
        }));
    }

    /**
     * Mark a row's records for a peer RECONCILED after the user reconciled it (accept hub/local). Closes
     * both the row-level record and any field-level records for that (type,id,peer). Called by the resolve
     * endpoints so the badge clears immediately without waiting for the next scan to auto-converge.
     */
    public int markReconciled(String entityType, Long entityId, DriftPeer peer, String resolution, String by) {
        return tx.execute(st -> {
            int closed = 0;
            java.time.Instant now = Instant.now();
            for (DriftRecord r : repo.findByEntityTypeAndEntityId(entityType, entityId)) {
                if (r.getPeer() != peer || r.getStatus() == DriftStatus.RECONCILED) continue;
                r.setStatus(DriftStatus.RECONCILED);
                r.setResolvedAt(now);
                r.setResolvedBy(by);
                r.setResolution(resolution);
                repo.save(r);
                closed++;
            }
            return closed;
        });
    }

    /** Global counts by status — feeds the header indicator's trustworthy drift badge. */
    public Map<String, Long> summaryCounts() {
        Map<String, Long> m = new java.util.LinkedHashMap<>();
        m.put("flagged", repo.countByStatus(DriftStatus.FLAGGED));
        m.put("acknowledged", repo.countByStatus(DriftStatus.ACKNOWLEDGED));
        m.put("reconciled", repo.countByStatus(DriftStatus.RECONCILED));
        return m;
    }

    /** Small mutable tally returned by a scan. */
    public static class DriftScanResult {
        public int typesScanned;
        public int typesDrifting;
        public int flagged;        // newly opened (or re-opened) this scan
        public int stillDrifting;  // already-open records seen still drifting
        public int reconciled;     // auto-closed this scan
        public int errors;
    }
}
