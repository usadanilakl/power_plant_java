package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.WalkdownSessionRepo;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Multi-crew walkdown sessions. Each crew can run their own session against the
 * same LOTO, and each session is permanently retained (immutable on complete).
 *
 * <p>Gating: walkdowns can begin once at least one snapshot recorded a
 * {@code verifiedBy} sign-off (i.e. the build was verified), and as long as
 * the LOTO is not Closed.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgWalkdownSessionService {

    private final WalkdownSessionRepo repo;
    private final LotoRepo lotoRepo;

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    public WalkdownSession requestWalkdown(Long lotoId, String crewName, String notes) {
        Loto loto = lotoRepo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found: " + lotoId));
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Closed".equals(status)) {
            throw new IllegalStateException("Cannot start walkdown — LOTO is Closed");
        }
        boolean verified = loto.getSnapshots().stream().anyMatch(sn -> sn.getVerifiedBy() != null);
        if (!verified) {
            throw new IllegalStateException("Walkdown requires the LOTO to have been verified at least once");
        }

        WalkdownSession w = new WalkdownSession();
        w.setLoto(loto);
        w.setCrewName(crewName);
        w.setStartedBy(currentUserName());
        w.setStartedAt(LocalDateTime.now());
        w.setCompleted(false);
        w.setSessionNotes(notes);

        // Pre-populate point states (one entry per LOTO point on the latest snapshot).
        Map<Long, WalkdownSession.PointState> states = new java.util.HashMap<>();
        loto.getLotoPointDtos().forEach(pid -> {
            if (pid.getId() != null) {
                states.put(pid.getId(), new WalkdownSession.PointState(false, null, null, null));
            }
        });
        w.setPointStates(states);
        return repo.save(w);
    }

    public WalkdownSession checkPoint(Long sessionId, Long pointId, boolean checked, String pointNotes) {
        WalkdownSession w = requireMutable(sessionId);
        Map<Long, WalkdownSession.PointState> states = w.getPointStates();
        WalkdownSession.PointState existing = states.getOrDefault(pointId,
                new WalkdownSession.PointState(false, null, null, null));
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
        return repo.save(w);
    }

    public WalkdownSession completeWalkdown(Long sessionId, String notes) {
        WalkdownSession w = requireMutable(sessionId);
        if (notes != null) w.setSessionNotes(notes);
        w.setCompleted(true);
        w.setCompletedBy(currentUserName());
        w.setCompletedAt(LocalDateTime.now());
        return repo.save(w);
    }

    public List<WalkdownSession> listForLoto(Long lotoId) {
        return repo.findByLoto_IdOrderByStartedAtDesc(lotoId);
    }

    public WalkdownSession getById(Long sessionId) {
        return repo.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Walkdown session not found: " + sessionId));
    }

    private WalkdownSession requireMutable(Long sessionId) {
        WalkdownSession w = repo.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Walkdown session not found: " + sessionId));
        if (w.isCompleted()) {
            throw new IllegalStateException("Walkdown session is completed and cannot be modified");
        }
        return w;
    }
}
