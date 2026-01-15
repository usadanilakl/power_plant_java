package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
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
     * Publish event that changes need to be synced
     */
    public void publishChanges(List<FieldChange> changes) {
        if (changes == null || changes.isEmpty()) {
            log.info("publishChanges called with empty/null changes, skipping");
            return;
        }

        log.info("Publishing {} changes for sync event", changes.size());
        eventPublisher.publishEvent(new ChangesDetectedEvent(changes));
        log.info("Event published successfully");
    }

    /**
     * Event indicating changes were detected and need syncing
     */
    public static class ChangesDetectedEvent {
        private final List<FieldChange> changes;

        public ChangesDetectedEvent(List<FieldChange> changes) {
            this.changes = changes;
        }

        public List<FieldChange> getChanges() {
            return changes;
        }
    }
}
