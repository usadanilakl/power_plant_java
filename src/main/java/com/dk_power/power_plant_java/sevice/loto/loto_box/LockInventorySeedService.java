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
        // Update box set sizes
        seedBoxSetSizes();

        // Seed set locks (only if none exist yet)
        if (lockRepo.count() == 0) {
            seedSetLocks();
            seedSingleLocks();
        }
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

    private void seedSetLocks() {
        List<Lock> locksToSave = new ArrayList<>();

        for (int boxNum = 1; boxNum <= SET_BOX_MAX; boxNum++) {
            int setSize = getSetSizeForBox(boxNum);
            for (int i = 0; i < setSize; i++) {
                Lock lock = new Lock();
                lock.setNumber(boxNum); // All locks in a set numbered same as box
                lock.setHomeBoxNumber(boxNum);
                lock.setLockType("LOCK");
                lock.setIsSingleLock(false);
                locksToSave.add(lock);
            }
        }

        lockRepo.saveAll(locksToSave);
        System.out.println("Seeded " + locksToSave.size() + " set locks across boxes 1-" + SET_BOX_MAX);
    }

    private void seedSingleLocks() {
        List<Lock> locksToSave = new ArrayList<>();

        for (int lockNum = SINGLE_LOCK_START; lockNum <= SINGLE_LOCK_END; lockNum++) {
            Lock lock = new Lock();
            lock.setNumber(lockNum);
            lock.setHomeBoxNumber(null);
            lock.setLockType("LOCK");
            lock.setIsSingleLock(true);
            locksToSave.add(lock);
        }

        lockRepo.saveAll(locksToSave);
        System.out.println("Seeded " + locksToSave.size() + " single locks (" + SINGLE_LOCK_START + "-" + SINGLE_LOCK_END + ")");
    }

    public static int getSetSizeForBox(int boxNumber) {
        if (TWENTY_LOCK_BOXES.contains(boxNumber)) return 20;
        if (boxNumber >= FIFTY_LOCK_START && boxNumber <= FIFTY_LOCK_END) return 50;
        if (boxNumber >= 1 && boxNumber <= SET_BOX_MAX) return 10;
        return 0; // Boxes 39-72 have no set
    }
}
