package com.dk_power.power_plant_java.sevice.loto.loto_box;

import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Auto-assigns a LOTO box and locks based on point count.
 *
 * Rules:
 *   ≤5 points  → box from 39-72 (no set), single locks (200-399)
 *   >5 points  → set box (1-38) with best fit, overflow with singles
 *
 * Best fit: smallest available set that covers all points.
 * If no single set covers all points, use the largest available set + singles for the remainder.
 *
 * Example: 22 points → box with 20-lock set + 2 single locks
 */
@Service
@RequiredArgsConstructor
@Transactional
public class LotoAssignmentService {

    private final LotoBoxRepo lotoBoxRepo;
    private final LockRepo lockRepo;
    private final LockInventorySeedService lockInventorySeedService;

    /**
     * Auto-assign a box and locks to a LOTO permit.
     * Returns the assigned LotoBox, and the locks are saved with loto reference.
     */
    public LotoBox autoAssign(Loto loto, int pointCount) {
        // Auto-seed if lock inventory is empty
        if (lockRepo.count() == 0) {
            lockInventorySeedService.seedLockInventory();
        }

        if (pointCount <= 0) {
            // Just assign a no-set box, no locks needed yet
            return assignNoSetBox(loto);
        }

        if (pointCount <= 5) {
            return assignWithSinglesOnly(loto, pointCount);
        } else {
            return assignWithSet(loto, pointCount);
        }
    }

    /**
     * ≤5 points: pick box 39-72, assign single locks
     */
    private LotoBox assignWithSinglesOnly(Loto loto, int pointCount) {
        LotoBox box = findAvailableNoSetBox();
        linkBoxToLoto(box, loto);

        List<Lock> singles = lockRepo.findAvailableSingleLocks();
        if (singles.size() < pointCount) {
            throw new RuntimeException("Not enough single locks available. Need " + pointCount + ", have " + singles.size());
        }
        assignLocks(singles.subList(0, pointCount), loto);

        return box;
    }

    /**
     * >5 points: find best-fit set box, supplement with singles if needed
     */
    private LotoBox assignWithSet(Loto loto, int pointCount) {
        // Get all available set boxes (1-38 with loto IS NULL), sorted by setSize
        List<LotoBox> availableSetBoxes = lotoBoxRepo.findAvailableBoxes().stream()
                .filter(b -> b.getSetSize() != null && b.getSetSize() > 0)
                .sorted(Comparator.comparingInt(LotoBox::getSetSize))
                .toList();

        if (availableSetBoxes.isEmpty()) {
            // Fallback: use no-set box + all singles
            return assignWithSinglesOnly(loto, pointCount);
        }

        // Find best fit: smallest set that covers all points
        LotoBox bestBox = null;
        for (LotoBox candidate : availableSetBoxes) {
            if (candidate.getSetSize() >= pointCount) {
                bestBox = candidate;
                break;
            }
        }

        // If no single set covers all, use the largest available set
        if (bestBox == null) {
            bestBox = availableSetBoxes.get(availableSetBoxes.size() - 1);
        }

        linkBoxToLoto(bestBox, loto);

        // Assign set locks from this box
        List<Lock> setLocks = lockRepo.findAvailableLocksByHomeBox(bestBox.getNumber());
        int setLocksToUse = Math.min(setLocks.size(), pointCount);
        assignLocks(setLocks.subList(0, setLocksToUse), loto);

        // If set doesn't cover all points, supplement with singles
        int remaining = pointCount - setLocksToUse;
        if (remaining > 0) {
            List<Lock> singles = lockRepo.findAvailableSingleLocks();
            if (singles.size() < remaining) {
                throw new RuntimeException("Not enough single locks. Need " + remaining + " more, have " + singles.size());
            }
            assignLocks(singles.subList(0, remaining), loto);
        }

        return bestBox;
    }

    private LotoBox assignNoSetBox(Loto loto) {
        LotoBox box = findAvailableNoSetBox();
        linkBoxToLoto(box, loto);
        return box;
    }

    private LotoBox findAvailableNoSetBox() {
        return lotoBoxRepo.findAvailableBoxes().stream()
                .filter(b -> b.getSetSize() == null || b.getSetSize() == 0)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No available LOTO boxes without lock sets"));
    }

    private void linkBoxToLoto(LotoBox box, Loto loto) {
        box.setLoto(loto);
        loto.setLotoBox(box);
        loto.setBoxNumber(box.getNumber());
        lotoBoxRepo.save(box);
    }

    private void assignLocks(List<Lock> locks, Loto loto) {
        for (Lock lock : locks) {
            lock.setLoto(loto);
            lockRepo.save(lock);
        }
    }

    /**
     * Release all locks from a LOTO permit back to inventory.
     */
    public void releaseLocks(Loto loto) {
        List<Lock> assignedLocks = lockRepo.findByLotoId(loto.getId());
        for (Lock lock : assignedLocks) {
            lock.setLoto(null);
            lock.setAssignedLotoPointId(null);
            lockRepo.save(lock);
        }
    }
}
