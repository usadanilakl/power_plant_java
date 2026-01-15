package com.dk_power.power_plant_java.sevice.sync;

import org.springframework.stereotype.Component;

/**
 * Thread-local context to track whether current operation is from sync.
 * Prevents infinite sync loops: when applying incoming changes, we don't
 * want to trigger another sync broadcast.
 */
@Component
public class SyncContext {

    private static final ThreadLocal<Boolean> IS_SYNCING = ThreadLocal.withInitial(() -> false);

    /**
     * Mark current thread as processing sync (applying incoming changes)
     */
    public void startSync() {
        IS_SYNCING.set(true);
    }

    /**
     * Mark current thread as done processing sync
     */
    public void endSync() {
        IS_SYNCING.set(false);
    }

    /**
     * Check if current thread is processing sync
     * @return true if we're applying incoming sync changes (should NOT broadcast)
     */
    public boolean isSyncing() {
        return IS_SYNCING.get();
    }

    /**
     * Execute a runnable within sync context (won't trigger broadcasts)
     */
    public void executeInSyncContext(Runnable action) {
        startSync();
        try {
            action.run();
        } finally {
            endSync();
        }
    }
}
