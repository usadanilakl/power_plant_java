package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardWalkdownDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PositionOptionsDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.WalkdownSubmitRequest;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown;
import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown.GlobalItem;
import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown.PointChecklist;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardWalkdownRepo;
import com.dk_power.power_plant_java.sevice.angular.RfValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mobile (PWA) verification / walkdown workflow for a {@link LotoStandard}, built for <b>offline field use</b>.
 *
 * <p>The mobile client caches a standard while online, does the whole checklist locally with no network, then
 * submits once via {@link #saveEvidence} (evidence) followed by a {@link #verify}/{@link #markWalkdownComplete}
 * transition. The evidence save is its own transaction so a completed walkdown is never lost even if the official
 * transition is rejected (e.g. the submitter turns out to be the creator).</p>
 *
 * <p>Checklist storage is the hub-local {@link LotoStandardWalkdown} (off the CRDT path). Corrections and the
 * official transition go through JPA / the shared {@link NgLotoStandardService} so they sync and stay gated by
 * LOTO role + the verifier-≠-creator/-submitter rule.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PwaLotoStandardWalkdownService {

    private final LotoStandardWalkdownRepo walkdownRepo;
    private final LotoStandardRepo standardRepo;
    private final LotoPointRepo lotoPointRepo;
    private final ValueRepo valueRepo;
    private final RfValueService rfValueService;
    private final NgLotoStandardService lotoStandardService;

    /** Thrown when a submit arrives for a standard whose version changed since the client cached it. */
    public static class StaleStandardException extends RuntimeException {
        public StaleStandardException(String msg) { super(msg); }
    }

    // ── Checklist read/create ────────────────────────────────────────────────

    /** Get the checklist for a standard, creating an empty one (stamped to the current version) if absent. */
    public LotoStandardWalkdownDto getOrCreate(Long standardId) {
        return toDto(getOrCreateEntity(standardId));
    }

    private LotoStandardWalkdown getOrCreateEntity(Long standardId) {
        return walkdownRepo.findByStandardId(standardId).orElseGet(() -> {
            LotoStandard s = standardRepo.findById(standardId)
                    .orElseThrow(() -> new IllegalArgumentException("LOTO standard not found: " + standardId));
            LotoStandardWalkdown w = new LotoStandardWalkdown();
            w.setStandardId(standardId);
            w.setStandardVersion(s.getCurrentVersion());
            w.setStartedBy(currentUserName());
            w.setStartedAt(LocalDateTime.now());
            w.setGlobalItems(new HashMap<>());
            w.setPointResults(new HashMap<>());
            return walkdownRepo.save(w);
        });
    }

    // ── Position options (for in-field corrections) ──────────────────────────

    @Transactional(readOnly = true)
    public PositionOptionsDto positionOptions() {
        return new PositionOptionsDto(safeValues("isoPos"), safeValues("normPos"), safeValues("location"));
    }

    private List<ValueDto> safeValues(String category) {
        try {
            return rfValueService.getValuesByCategory(category);
        } catch (Exception e) {
            log.warn("[PWA] No Value options for category '{}': {}", category, e.getMessage());
            return List.of();
        }
    }

    // ── One-shot offline submission (evidence) ───────────────────────────────

    /**
     * Persist a whole walkdown at once: apply in-field corrections, then replace the checklist with the
     * submitted state. Runs in its own transaction so it commits independently of the official transition.
     *
     * @throws StaleStandardException   if the standard changed since the client cached it
     * @throws IllegalArgumentException on a missing standard/point, or a negative check with no comment
     */
    @Transactional
    public void saveEvidence(Long standardId, WalkdownSubmitRequest req) {
        // Walkdown evidence-recording is a Control Authority activity per operational policy:
        // the CA owns build-time correctness and the walkdown is where they confirm the
        // physical world matches what's on the standard. The evidence IS the walkdown,
        // and it can drive corrections + LotoPoint isLockable/isLabeled flips — both of
        // which are CA's authority.
        lotoStandardService.requireLotoRole(LotoRole.CONTROL_AUTHORITY);

        LotoStandard s = standardRepo.findById(standardId)
                .orElseThrow(() -> new IllegalArgumentException("LOTO standard not found: " + standardId));

        if (req.capturedVersion() != null && s.getCurrentVersion() != null
                && !req.capturedVersion().equals(s.getCurrentVersion())) {
            throw new StaleStandardException("This standard changed since you loaded it (v" + req.capturedVersion()
                    + " → v" + s.getCurrentVersion() + "). Refresh the standard and re-check.");
        }

        if (req.corrections() != null) {
            for (Map.Entry<Long, WalkdownSubmitRequest.PointCorrectionInput> e : req.corrections().entrySet()) {
                WalkdownSubmitRequest.PointCorrectionInput c = e.getValue();
                if (c != null) applyCorrection(e.getKey(), c.tagNumber(), c.description(),
                        c.isoPosId(), c.normPosId(), c.locationId(), c.specificLocation(),
                        c.isLockable(), c.isLabeled());
            }
        }

        LotoStandardWalkdown w = getOrCreateEntity(standardId);
        String user = currentUserName();

        if (req.globalItems() != null) {
            Map<String, GlobalItem> gi = new HashMap<>();
            for (Map.Entry<String, WalkdownSubmitRequest.GlobalItemInput> e : req.globalItems().entrySet()) {
                WalkdownSubmitRequest.GlobalItemInput in = e.getValue();
                boolean checked = in != null && Boolean.TRUE.equals(in.checked());
                String notes = in != null ? in.notes() : null;
                gi.put(e.getKey(), new GlobalItem(checked, checked ? user : null, checked ? nowIso() : null, notes));
            }
            w.setGlobalItems(gi);
        }

        if (req.pointResults() != null) {
            Map<Long, PointChecklist> pr = new HashMap<>();
            for (Map.Entry<Long, PointChecklist> e : req.pointResults().entrySet()) {
                PointChecklist cl = e.getValue() != null ? e.getValue() : new PointChecklist();
                if (hasNegative(cl) && (cl.getComment() == null || cl.getComment().isBlank())) {
                    throw new IllegalArgumentException("Point " + e.getKey()
                            + ": a comment is required when any check is marked negative.");
                }
                cl.setCheckedBy(user);
                cl.setCheckedAt(nowIso());
                pr.put(e.getKey(), cl);
            }
            w.setPointResults(pr);

            // Equipment Lockable and Metal Tag Present are DURABLE PHYSICAL PROPERTIES of the point
            // (does this valve have a padlock provision? is there a permanent metal tag?), not
            // per-walkdown flukes. Persist definitive answers onto the LotoPoint itself so future
            // permit builders can see them. Nulls (unanswered) are skipped — never clobber an
            // existing flag with "walker didn't check today".
            applyPhysicalFlagsFromChecklist(pr);
        }

        stamp(w);
        walkdownRepo.save(w);
    }

    /**
     * Correct a point's tag / description / positions / location / physical flags in place.
     * isoPosId / normPosId / locationId are Value FKs — the id is looked up and set only if it
     * resolves. specificLocation is a free-text string mirroring the LotoPoint column (there is
     * no generalLocation counterpart — that dead field was retired from the UI). isLockable /
     * isLabeled are the durable physical flags (Boolean, so null = leave as is, true/false
     * explicitly sets). Every field is OPTIONAL — only non-null fields are applied. Goes
     * through JPA so the {@code FieldChangeEntityListener} fires (syncs).
     */
    public void applyCorrection(Long pointId, String tagNumber, String description,
                                Long isoPosId, Long normPosId, Long locationId,
                                String specificLocation,
                                Boolean isLockable, Boolean isLabeled) {
        // Corrections modify a LOTO point in place (tag/description/positions/location/flags).
        // Either a Control Authority (who owns build-time content) or a Manager
        // (who owns walkdown and might spot an in-field discrepancy) may apply
        // one — anyone lower is rejected.
        lotoStandardService.requireLotoRole(LotoRole.CONTROL_AUTHORITY, LotoRole.MANAGER);
        LotoPoint p = lotoPointRepo.findById(pointId)
                .orElseThrow(() -> new IllegalArgumentException("LOTO point not found: " + pointId));
        if (tagNumber != null) p.setTagNumber(tagNumber.trim());
        if (description != null) p.setDescription(description);
        if (isoPosId != null) valueRepo.findById(isoPosId).ifPresent(p::setIsoPos);
        if (normPosId != null) valueRepo.findById(normPosId).ifPresent(p::setNormPos);
        if (locationId != null) valueRepo.findById(locationId).ifPresent(p::setLocation);
        if (specificLocation != null) p.setSpecificLocation(specificLocation);
        if (isLockable != null) p.setIsLockable(isLockable);
        if (isLabeled != null) p.setIsLabeled(isLabeled);
        lotoPointRepo.save(p);
    }

    /**
     * Persist Pass/Fail on {@code equipmentLockable} / {@code metalTagPresent} to the LOTO point's
     * durable physical flags ({@code isLockable} / {@code isLabeled}). Only definitive answers are
     * applied — null (unanswered) never clobbers an existing flag. No-op writes are skipped so we
     * don't emit a sync event for a flag that already matches.
     */
    private void applyPhysicalFlagsFromChecklist(Map<Long, PointChecklist> results) {
        for (Map.Entry<Long, PointChecklist> e : results.entrySet()) {
            PointChecklist c = e.getValue();
            if (c == null) continue;
            Boolean lockable = c.getEquipmentLockable();
            Boolean labeled = c.getMetalTagPresent();
            if (lockable == null && labeled == null) continue;

            lotoPointRepo.findById(e.getKey()).ifPresent(p -> {
                boolean changed = false;
                if (lockable != null) {
                    boolean current = Boolean.TRUE.equals(p.getIsLockable());
                    if (lockable.booleanValue() != current) {
                        p.setIsLockable(lockable);
                        changed = true;
                    }
                }
                if (labeled != null) {
                    boolean current = Boolean.TRUE.equals(p.getIsLabeled());
                    if (labeled.booleanValue() != current) {
                        p.setIsLabeled(labeled);
                        changed = true;
                    }
                }
                if (changed) lotoPointRepo.save(p);
            });
        }
    }

    // ── Official transitions (delegated; role + different-person enforced there) ──

    public LotoStandardDto verify(Long standardId, String notes) {
        return lotoStandardService.verify(standardId, notes);
    }

    public LotoStandardDto markWalkdownComplete(Long standardId, String notes) {
        return lotoStandardService.markWalkdownComplete(standardId, notes);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static boolean hasNegative(PointChecklist c) {
        return Boolean.FALSE.equals(c.getFileReferenceProvided())
                || Boolean.FALSE.equals(c.getMetalTagPresent())
                || Boolean.FALSE.equals(c.getEquipmentAccessible())
                || Boolean.FALSE.equals(c.getTagNumbersMatch())
                || Boolean.FALSE.equals(c.getIsolationPositionCorrect())
                || Boolean.FALSE.equals(c.getRestoredPositionCorrect())
                || Boolean.FALSE.equals(c.getEquipmentLockable())
                || Boolean.FALSE.equals(c.getZeroEnergyAdequate());
    }

    private void stamp(LotoStandardWalkdown w) {
        w.setUpdatedBy(currentUserName());
        w.setUpdatedAt(LocalDateTime.now());
    }

    private static String nowIso() {
        return LocalDateTime.now().toString();
    }

    private LotoStandardWalkdownDto toDto(LotoStandardWalkdown w) {
        return new LotoStandardWalkdownDto(
                w.getStandardId(), w.getStandardVersion(),
                w.getStartedBy(), w.getStartedAt(), w.getUpdatedBy(), w.getUpdatedAt(),
                w.getGlobalItems(), w.getPointResults());
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
