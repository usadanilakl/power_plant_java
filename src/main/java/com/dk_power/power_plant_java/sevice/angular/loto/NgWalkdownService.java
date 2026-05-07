package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.entities.loto.WalkdownChecklist;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.WalkdownChecklistRepo;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class NgWalkdownService {

    private final WalkdownChecklistRepo walkdownRepo;
    private final LotoRepo lotoRepo;

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * Begin a new walkdown for a LOTO. Allowed any time the LOTO has been hung
     * (latest snapshot has hungBy populated) and is not Closed.
     */
    public WalkdownChecklist requestWalkdown(Long lotoId, String notes) {
        Loto loto = lotoRepo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        boolean ever_hung = loto.getSnapshots().stream().anyMatch(sn -> sn.getHungBy() != null);
        if (!ever_hung) {
            throw new IllegalStateException("LOTO must be hung before a walkdown can begin");
        }
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Closed".equals(status)) {
            throw new IllegalStateException("Cannot request walkdown on a Closed LOTO");
        }

        WalkdownChecklist w = new WalkdownChecklist();
        w.setLoto(loto);
        w.setLotoSnapshot(loto.getLatestSnapshot());
        w.setRequestedBy(currentUserName());
        w.setRequestedAt(LocalDateTime.now());
        w.setCompleted(false);
        w.setNotes(notes);

        // Pre-populate point states (one entry per LOTO point, all unchecked).
        Map<Long, WalkdownChecklist.PointState> states = new HashMap<>();
        loto.getLotoPointDtos().forEach(pid -> {
            if (pid.getId() != null) states.put(pid.getId(), new WalkdownChecklist.PointState(false, null, null, null));
        });
        w.setPointStates(states);
        return walkdownRepo.save(w);
    }

    /** Toggle (or set) the checked state of a single point on an in-progress walkdown. */
    public WalkdownChecklist checkPoint(Long walkdownId, Long pointId, boolean checked, String pointNotes) {
        WalkdownChecklist w = requireMutable(walkdownId);
        Map<Long, WalkdownChecklist.PointState> states = w.getPointStates();
        WalkdownChecklist.PointState existing = states.getOrDefault(pointId,
                new WalkdownChecklist.PointState(false, null, null, null));
        existing.setChecked(checked);
        existing.setNotes(pointNotes);
        if (checked) {
            existing.setCheckedBy(currentUserName());
            existing.setCheckedAt(LocalDateTime.now().toString());
        } else {
            existing.setCheckedBy(null);
            existing.setCheckedAt(null);
        }
        states.put(pointId, existing);
        w.setPointStates(states);
        return walkdownRepo.save(w);
    }

    /** Mark the walkdown complete. Becomes immutable thereafter. */
    public WalkdownChecklist completeWalkdown(Long walkdownId, String notes) {
        WalkdownChecklist w = requireMutable(walkdownId);
        if (notes != null) w.setNotes(notes);
        w.setCompleted(true);
        w.setCompletedBy(currentUserName());
        w.setCompletedAt(LocalDateTime.now());
        return walkdownRepo.save(w);
    }

    public List<WalkdownChecklist> listForLoto(Long lotoId) {
        return walkdownRepo.findByLoto_IdOrderByRequestedAtDesc(lotoId);
    }

    private WalkdownChecklist requireMutable(Long walkdownId) {
        WalkdownChecklist w = walkdownRepo.findById(walkdownId)
                .orElseThrow(() -> new EntityNotFoundException("Walkdown not found: " + walkdownId));
        if (w.isCompleted()) {
            throw new IllegalStateException("Walkdown is completed and cannot be modified");
        }
        return w;
    }
}
