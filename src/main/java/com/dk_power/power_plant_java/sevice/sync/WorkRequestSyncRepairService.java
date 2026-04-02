package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Repairs sync history gaps for WorkRequest rows that exist locally but are
 * missing a CREATE marker in FIELD_CHANGE. Late clients cannot materialize such
 * rows from replay, so we backfill a synthetic create history exactly once,
 * regardless of whether the WR originated from SharePoint or another path.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkRequestSyncRepairService {

    private static final int DEFAULT_BACKFILL_BATCH_SIZE = 200;

    private final WorkRequestRepo workRequestRepo;
    private final FieldChangeTracker fieldChangeTracker;

    public boolean ensureCreateHistoryIfMissing(Long workRequestId) {
        if (workRequestId == null) {
            return false;
        }

        WorkRequest entity = workRequestRepo.findById(workRequestId).orElse(null);
        if (entity == null) {
            log.warn("[WR Repair] WorkRequest {} not found for create-history repair", workRequestId);
            return false;
        }

        return !fieldChangeTracker.ensureCreateHistoryIfMissing(entity).isEmpty();
    }

    public int backfillMissingCreateHistory() {
        return backfillMissingCreateHistory(DEFAULT_BACKFILL_BATCH_SIZE);
    }

    public int backfillMissingCreateHistory(int limit) {
        List<Long> ids = workRequestRepo.findIdsMissingCreateMarker(limit);
        int repaired = 0;

        for (Long id : ids) {
            if (ensureCreateHistoryIfMissing(id)) {
                repaired++;
            }
        }

        if (repaired > 0) {
            log.info("[WR Repair] Backfilled create history for {} WorkRequest rows", repaired);
        }

        return repaired;
    }
}
