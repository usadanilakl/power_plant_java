package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.SyncDeadLetter;
import com.dk_power.power_plant_java.repository.sync.SyncDeadLetterRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Records field-changes that could not be applied so they are visible and replayable instead of
 * silently dropped. Writes in a {@code REQUIRES_NEW} transaction so a dead-letter survives even if
 * the surrounding apply transaction later rolls back. Upserts by {@code (changeId, machineId)} so a
 * repeatedly re-delivered change bumps its attempt count rather than duplicating rows.
 *
 * <p>Inc 0a wires the {@code NO_SERVICE} case (unregistered entity type) here — the exact silent-drop
 * that lost LotoStandardApprovalEvent / ShiftDay / WorkCategoryProfile this month.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncDeadLetterService {

    public static final String REASON_NO_SERVICE = "NO_SERVICE";

    private final SyncDeadLetterRepo repo;
    private final SyncConfig syncConfig;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordNoService(String entityType, List<FieldChange> changes) {
        if (changes == null || changes.isEmpty()) {
            record(entityType, null, null, null, null, null, null, REASON_NO_SERVICE);
            return;
        }
        for (FieldChange c : changes) {
            record(c.getEntityType(), c.getEntityId(), c.getId(), c.getFieldName(),
                    c.getOldValue(), c.getNewValue(), c.getOriginMachineId(), REASON_NO_SERVICE);
        }
    }

    private void record(String entityType, Long entityId, java.util.UUID changeId, String fieldName,
                        String oldValue, String newValue, String originMachineId, String reason) {
        try {
            String machineId = syncConfig.getMachineId();
            SyncDeadLetter dl = (changeId != null)
                    ? repo.findByChangeIdAndMachineId(changeId, machineId).orElseGet(SyncDeadLetter::new)
                    : new SyncDeadLetter();

            Instant now = Instant.now();
            if (dl.getId() == null) {
                dl.setChangeId(changeId);
                dl.setEntityType(entityType);
                dl.setEntityId(entityId);
                dl.setFieldName(fieldName);
                dl.setOldValue(oldValue);
                dl.setNewValue(newValue);
                dl.setOriginMachineId(originMachineId);
                dl.setMachineId(machineId);
                dl.setReason(reason);
                dl.setFirstSeenAt(now);
                dl.setAttempts(1);
            } else {
                dl.setAttempts(dl.getAttempts() + 1);
                dl.setResolved(false); // re-seen means the cause is still present
            }
            dl.setLastSeenAt(now);
            repo.save(dl);
        } catch (Exception e) {
            // A dead-letter write must never itself break the apply loop.
            log.error("sync.dead_letter.record_failed entityType={} changeId={}: {}",
                    entityType, changeId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public long unresolvedCount() {
        return repo.countByResolvedFalse();
    }
}
