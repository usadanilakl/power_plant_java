package com.dk_power.power_plant_java.sevice.loto.loto_box;

import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Seeds the lock inventory for all 72 LOTO boxes.
 *
 * Box lock set sizes:
 *   Boxes 1-5 and 24:  20 locks each
 *   Boxes 33-38:       50 locks each
 *   Boxes 6-23, 25-32: 10 locks each
 *   Boxes 39-72:       0 (no set — use single locks)
 *
 * Single locks: numbered 200-399 (200 total), not tied to any box.
 *
 * All set locks are numbered the same as their box number.
 */
@Service
@RequiredArgsConstructor
public class LockInventorySeedService {

    private final LotoBoxRepo lotoBoxRepo;
    private final LockRepo lockRepo;

    private static final Set<Integer> TWENTY_LOCK_BOXES = Set.of(1, 2, 3, 4, 5, 24);
    private static final int FIFTY_LOCK_START = 33;
    private static final int FIFTY_LOCK_END = 38;
    private static final int SET_BOX_MAX = 38;

    private static final int SINGLE_LOCK_START = 200;
    private static final int SINGLE_LOCK_END = 399;

    @Transactional
    public void seedLockInventory() {
        seedBoxSetSizes();
        seedSetLocks();    // idempotent: top up missing per box
        seedSingleLocks(); // idempotent: top up missing in 200-399 range
    }

    private void seedBoxSetSizes() {
        List<LotoBox> boxes = lotoBoxRepo.findAll();
        for (LotoBox box : boxes) {
            int num = box.getNumber();
            int setSize = getSetSizeForBox(num);
            if (!Integer.valueOf(setSize).equals(box.getSetSize())) {
                box.setSetSize(setSize);
                lotoBoxRepo.save(box);
            }
        }
    }

    /**
     * Idempotent top-up: ensures each set-box (1..SET_BOX_MAX) has exactly
     * {@code getSetSizeForBox(boxNum)} locks home-boxed there. Adds any that are missing.
     */
    private void seedSetLocks() {
        List<Lock> locksToSave = new ArrayList<>();
        int totalAdded = 0;

        for (int boxNum = 1; boxNum <= SET_BOX_MAX; boxNum++) {
            int targetSize = getSetSizeForBox(boxNum);
            int existing = lockRepo.findByHomeBoxNumber(boxNum).size();
            int missing = targetSize - existing;
            for (int i = 0; i < missing; i++) {
                Lock lock = new Lock();
                lock.setNumber(boxNum); // set locks share the box number
                lock.setHomeBoxNumber(boxNum);
                lock.setLockType("LOCK");
                lock.setIsSingleLock(false);
                locksToSave.add(lock);
            }
            totalAdded += Math.max(0, missing);
        }

        if (!locksToSave.isEmpty()) {
            lockRepo.saveAll(locksToSave);
            System.out.println("Seeded " + totalAdded + " missing set locks across boxes 1-" + SET_BOX_MAX);
        }
    }

    /**
     * Idempotent top-up: ensures every number in [SINGLE_LOCK_START, SINGLE_LOCK_END] has
     * a single-lock row. Adds any that are missing.
     */
    private void seedSingleLocks() {
        List<Lock> existingSingles = lockRepo.findAll().stream()
                .filter(l -> Boolean.TRUE.equals(l.getIsSingleLock()))
                .toList();
        java.util.Set<Integer> haveNumbers = new java.util.HashSet<>();
        for (Lock l : existingSingles) {
            if (l.getNumber() != null) haveNumbers.add(l.getNumber());
        }

        List<Lock> locksToSave = new ArrayList<>();
        for (int lockNum = SINGLE_LOCK_START; lockNum <= SINGLE_LOCK_END; lockNum++) {
            if (haveNumbers.contains(lockNum)) continue;
            Lock lock = new Lock();
            lock.setNumber(lockNum);
            lock.setHomeBoxNumber(null);
            lock.setLockType("LOCK");
            lock.setIsSingleLock(true);
            locksToSave.add(lock);
        }

        if (!locksToSave.isEmpty()) {
            lockRepo.saveAll(locksToSave);
            System.out.println("Seeded " + locksToSave.size() + " missing single locks (" + SINGLE_LOCK_START + "-" + SINGLE_LOCK_END + ")");
        }
    }

    public static int getSetSizeForBox(int boxNumber) {
        if (TWENTY_LOCK_BOXES.contains(boxNumber)) return 20;
        if (boxNumber >= FIFTY_LOCK_START && boxNumber <= FIFTY_LOCK_END) return 50;
        if (boxNumber >= 1 && boxNumber <= SET_BOX_MAX) return 10;
        return 0; // Boxes 39-72 have no set
    }
}
