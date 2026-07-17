package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Publishes sync events when changes are detected.
 * Enables event-driven sync instead of polling.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * Publish event that changes need to be synced. Existing signature —
     * kept for callers that have no request context (background jobs,
     * SharePoint pull, etc.).
     */
    public void publishChanges(List<FieldChange> changes) {
        publishChanges(changes, null);
    }

    /**
     * Publish event with the originating browser tab's client id. Used by the
     * new same-machine cross-tab reactivity path so a tab that made a write
     * can filter its own echo out of the SSE feed.
     */
    public void publishChanges(List<FieldChange> changes, String originClientId) {
        if (changes == null || changes.isEmpty()) {
            log.info("publishChanges called with empty/null changes, skipping");
            return;
        }

        log.info("Publishing {} changes for sync event", changes.size());
        eventPublisher.publishEvent(new ChangesDetectedEvent(changes, originClientId));
        log.info("Event published successfully");
    }

    /**
     * Event indicating changes were detected and need syncing.
     * <p>
     * {@code originClientId} is nullable — carries the browser tab's
     * {@code X-Client-Id} header when the write originated from a Ng REST
     * call. Null for background jobs, sync-repair, SharePoint pulls, etc.
     * Listeners that broadcast to SSE echo this back to clients so a tab
     * can suppress its own writes from its refetch pipeline. Kept as a
     * constructor + getter pair (not @Value) because {@link CentralSyncService}
     * already consumes the class and Lombok would silently reshape.
     */
    public static class ChangesDetectedEvent {
        private final List<FieldChange> changes;
        private final String originClientId;

        /** Legacy constructor retained for direct callers that don't have request context. */
        public ChangesDetectedEvent(List<FieldChange> changes) {
            this(changes, null);
        }

        public ChangesDetectedEvent(List<FieldChange> changes, String originClientId) {
            this.changes = changes;
            this.originClientId = originClientId;
        }

        public List<FieldChange> getChanges() {
            return changes;
        }

        public String getOriginClientId() {
            return originClientId;
        }
    }

}
