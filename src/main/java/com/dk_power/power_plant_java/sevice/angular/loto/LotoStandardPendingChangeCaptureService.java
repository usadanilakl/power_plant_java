package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange;
import com.dk_power.power_plant_java.entities.loto.LotoStandardStatus;
import com.dk_power.power_plant_java.repository.loto.LotoStandardApprovalEventRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardPendingChangeRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Captures field-level edits to {@link LotoPoint}s as pending-change rows on
 * any {@link LotoStandard} that contains them, when (and only when) the
 * standard's developmentStatus is {@code APPROVED}. Standalone so neither
 * {@code NgLotoStandardService} nor {@code NgLotoPointService} has to depend
 * on the other (avoids circular-dep wiring).
 *
 * <p>See {@code project/features/loto-standard/loto-procedure.md} §3.3.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class LotoStandardPendingChangeCaptureService {

    private final LotoStandardPendingChangeRepo pendingChangeRepo;
    private final LotoStandardApprovalEventRepo approvalEventRepo;
    private final LotoStandardRepo lotoStandardRepo;

    /**
     * Compare snapshot field values against the just-saved point, and for
     * every APPROVED standard containing that point, write one pending-change
     * row per differing field. {@code beforeFields} is null-safe so callers
     * that didn't capture a pre-edit snapshot just get no rows.
     *
     * @param afterPointId  id of the point that was just updated
     * @param afterFields   field name → value AFTER save (current state)
     * @param beforeFields  field name → value BEFORE save, or null for none
     */
    public void capturePointEditAcrossStandards(Long afterPointId,
                                                 Map<String, String> afterFields,
                                                 Map<String, String> beforeFields) {
        if (afterPointId == null || afterFields == null || afterFields.isEmpty()) return;

        // Build the diff map. Skip fields that didn't change. If beforeFields is
        // null, treat every field as a change (caller had no pre-snapshot).
        Map<String, String[]> diffs = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : afterFields.entrySet()) {
            String fieldName = entry.getKey();
            String newValue = entry.getValue();
            String oldValue = beforeFields != null ? beforeFields.get(fieldName) : null;
            if (Objects.equals(oldValue, newValue)) continue;
            diffs.put(fieldName, new String[]{oldValue, newValue});
        }
        if (diffs.isEmpty()) return;

        // Find every standard containing this point. We rely on the back-ref
        // managed by LotoPoint.lotoStandards being loaded; if not, query.
        // Querying is cheaper than guessing fetch state and works regardless
        // of which side updated the join table last.
        List<LotoStandard> standards = lotoStandardRepo.findStandardsContainingPoint(afterPointId);

        String actor = currentUserName();
        for (LotoStandard s : standards) {
            if (s.getDevelopmentStatus() == null) continue;
            if (!LotoStandardStatus.APPROVED.equals(s.getDevelopmentStatus().getName())) continue;

            boolean firstEditOfCycle = (s.getPendingReviewSince() == null);
            if (firstEditOfCycle) {
                s.setPendingReviewSince(LocalDateTime.now());
                lotoStandardRepo.save(s);
            }

            for (Map.Entry<String, String[]> diff : diffs.entrySet()) {
                LotoStandardPendingChange change = new LotoStandardPendingChange();
                change.setStandard(s);
                change.setLotoPointId(afterPointId);
                change.setFieldName(diff.getKey());
                change.setOldValue(diff.getValue()[0]);
                change.setNewValue(diff.getValue()[1]);
                change.setEditedBy(actor);
                change.setEditedAt(LocalDateTime.now());
                change.setResolution(LotoStandardPendingChange.Resolution.PENDING);
                pendingChangeRepo.save(change);
            }

            if (firstEditOfCycle) {
                String firstField = diffs.keySet().iterator().next();
                LotoStandardApprovalEvent ev = new LotoStandardApprovalEvent();
                ev.setStandard(s);
                ev.setStandardVersion(s.getCurrentVersion());
                ev.setEventType(LotoStandardApprovalEvent.Type.EDIT_PENDING_REVIEW);
                ev.setPerformedBy(actor);
                ev.setEventAt(LocalDateTime.now());
                ev.setFromStatus(LotoStandardStatus.APPROVED);
                ev.setToStatus(LotoStandardStatus.APPROVED);
                ev.setNotes("Pending review opened by edit on '" + firstField + "' of point " + afterPointId);
                approvalEventRepo.save(ev);
            }
        }
    }

    /**
     * Build a field-name → string-value snapshot of a LotoPoint. Used by
     * callers to capture pre-edit state. Restricted to the fields whose
     * changes should require CA review (per loto-procedure.md §3.3).
     */
    public Map<String, String> snapshotPointFields(LotoPoint p) {
        Map<String, String> m = new LinkedHashMap<>();
        if (p == null) return m;
        m.put("tagNumber", p.getTagNumber());
        m.put("description", p.getDescription());
        m.put("specificLocation", p.getSpecificLocation());
        m.put("zeroEnergyMethod", p.getZeroEnergyMethod());
        m.put("isolatedPosition", str(p.getIsolatedPosition()));
        m.put("normalPosition", str(p.getNormalPosition()));
        return m;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /** Suppress unused warning: kept for future "edit on the standard itself" capture. */
    @SuppressWarnings("unused")
    private void touch(Set<LotoStandard> standards) {}
}
