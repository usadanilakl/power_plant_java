package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sync-time dedup for {@link RecurringPm} (natural key: pmKey). Hub-only (the {@link SharePointMergeTemplate}
 * guard). Two nodes can independently create the same PM catalog row; without a merge the deterministic-coexist
 * dedup leaves them diverged on the origin. Canonical: prefer the row an operator locked (classificationLocked —
 * they deliberately set shift/cadence/formKeyList and that must not be dropped); otherwise smallest id
 * (deterministic across nodes). No child re-point — nothing FK-references RecurringPm.
 */
@Service
@Slf4j
public class RecurringPmMergeService extends SharePointMergeTemplate<RecurringPm> {

    public RecurringPmMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "recurring_pm"; }
    @Override protected String entityName() { return "RecurringPm"; }
    @Override protected Class<RecurringPm> entityClass() { return RecurringPm.class; }
    @Override protected String naturalKeyColumn() { return "pm_key"; }
    @Override protected String jpaFieldName() { return "pmKey"; }
    @Override protected String logPrefix() { return "[RecurringPm Merge]"; }
    @Override protected void markDeleted(RecurringPm entity) { entity.setDeleted(true); }

    @Override
    protected RecurringPm selectCanonical(List<RecurringPm> sorted) {
        List<RecurringPm> locked = sorted.stream()
                .filter(r -> Boolean.TRUE.equals(r.getClassificationLocked())).toList();
        // Exactly one locked → it wins (don't discard the operator's deliberate config). Otherwise the
        // deterministic smallest-id (also covers "both locked" — a conflict left to LWW on the fields).
        return locked.size() == 1 ? locked.get(0) : sorted.get(0);
    }
}
