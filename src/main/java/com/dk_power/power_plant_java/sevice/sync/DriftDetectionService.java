package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.DriftKind;
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
 * Turns the (report-only, on-demand) content-hash drift oracle into DURABLE, per-machine {@link DriftRecord}s
 * so a table/form can show a stable flagged/reconciled badge instead of re-scanning live every render.
 *
 * <p>Detection is idempotent and self-healing, mirroring the {@code RoundIssue} lifecycle:
 * <ul>
 *   <li>a row that drifts and has no record → a new FLAGGED record;</li>
 *   <li>a row still drifting → its record's kind + lastDetectedAt refresh, but an ACKNOWLEDGED status is
 *       preserved (the user already triaged it) — we never nag a second time;</li>
 *   <li>a previously-RECONCILED row that drifts AGAIN → re-opened to FLAGGED;</li>
 *   <li>an active record whose row is no longer in the drift set → auto-RECONCILED (AUTO_CONVERGED).</li>
 * </ul>
 *
 * <p>The hub round-trips happen OUTSIDE the DB transaction (the persist is a separate short tx per type), and
 * per-type failures are isolated so one unreachable type can't abort the whole sweep. Runs where invoked
 * (client/desktop); on the hub itself {@code compareEntityTypeByContent} short-circuits (no sync server),
 * so a scan there is a harmless no-op.
 */
@Service
@Slf4j
public class DriftDetectionService {

    private static final List<DriftStatus> ACTIVE = List.of(DriftStatus.FLAGGED, DriftStatus.ACKNOWLEDGED);

    private final SyncComparisonService syncComparisonService;
    private final DriftRecordRepository repo;
    private final EntityTableRegistry entityTableRegistry;
    private final TransactionTemplate tx;

    public DriftDetectionService(SyncComparisonService syncComparisonService,
                                 DriftRecordRepository repo,
                                 EntityTableRegistry entityTableRegistry,
                                 PlatformTransactionManager txManager) {
        this.syncComparisonService = syncComparisonService;
        this.repo = repo;
        this.entityTableRegistry = entityTableRegistry;
        this.tx = new TransactionTemplate(txManager);
    }

    /** Scan every synced type, persisting/refreshing drift records. Per-type failures are isolated. */
    public DriftScanResult detectAll() {
        DriftScanResult total = new DriftScanResult();
        for (String type : entityTableRegistry.getSyncOrder()) {
            try {
                DriftScanResult one = detectForType(type);
                total.typesScanned++;
                if (one.flagged > 0 || one.reconciled > 0 || one.stillDrifting > 0) total.typesDrifting++;
                total.flagged += one.flagged;
                total.reconciled += one.reconciled;
                total.stillDrifting += one.stillDrifting;
            } catch (Exception e) {
                total.errors++;
                log.warn("drift.detect failed for {}: {}", type, e.getMessage());
            }
        }
        log.info("drift.detect complete: {} type(s) scanned, {} drifting, {} newly flagged, {} auto-reconciled, {} error(s)",
                total.typesScanned, total.typesDrifting, total.flagged, total.reconciled, total.errors);
        return total;
    }

    /** Scan one type. The hub probe runs first (no tx); the upsert + auto-reconcile is one short tx. */
    public DriftScanResult detectForType(String entityType) {
        // Hub round-trip OUTSIDE the write tx. compareEntityTypeByContent manages its own read-only tx.
        SyncComparisonService.ContentDriftSummary summary =
                syncComparisonService.compareEntityTypeByContent(entityType);
        if (summary.getError() != null) {
            throw new IllegalStateException(summary.getError());
        }

        Map<Long, DriftKind> current = new HashMap<>();
        summary.getDiffering().forEach(id -> current.put(id, DriftKind.DIFFERING));
        summary.getMissingLocally().forEach(id -> current.put(id, DriftKind.MISSING_LOCALLY));
        summary.getMissingOnHub().forEach(id -> current.put(id, DriftKind.MISSING_ON_HUB));

        DriftScanResult r = new DriftScanResult();
        tx.executeWithoutResult(st -> reconcileType(entityType, current, r));
        return r;
    }

    private void reconcileType(String entityType, Map<Long, DriftKind> current, DriftScanResult r) {
        Instant now = Instant.now();

        for (Map.Entry<Long, DriftKind> e : current.entrySet()) {
            DriftRecord rec = repo
                    .findByEntityTypeAndEntityIdAndFieldName(entityType, e.getKey(), DriftRecord.ROW)
                    .orElse(null);
            if (rec == null) {
                rec = new DriftRecord();
                rec.setEntityType(entityType);
                rec.setEntityId(e.getKey());
                rec.setFieldName(DriftRecord.ROW);
                rec.setFirstDetectedAt(now);
                rec.setStatus(DriftStatus.FLAGGED);
                r.flagged++;
            } else if (rec.getStatus() == DriftStatus.RECONCILED) {
                // It converged before, and drifted again — re-open. Clear the prior resolution.
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

        // Auto-reconcile: any active row-level record for this type whose row is no longer drifting.
        for (DriftRecord rec : repo.findByEntityTypeAndFieldNameAndStatusIn(entityType, DriftRecord.ROW, ACTIVE)) {
            if (!current.containsKey(rec.getEntityId())) {
                rec.setStatus(DriftStatus.RECONCILED);
                rec.setResolvedAt(now);
                rec.setResolution("AUTO_CONVERGED");
                repo.save(rec);
                r.reconciled++;
            }
        }
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
