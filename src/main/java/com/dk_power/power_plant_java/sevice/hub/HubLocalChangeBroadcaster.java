package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.sync.SyncEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Listens for local entity changes on the hub machine and broadcasts them
 * to connected clients via SSE.
 *
 * When a user edits something directly on the hub, FieldChangeEntityListener
 * fires and SyncEventPublisher publishes a ChangesDetectedEvent. This component
 * picks it up and pushes the changes to connected clients so they sync immediately.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubLocalChangeBroadcaster {

    private final HubSseService hubSseService;
    private final SyncConfig syncConfig;

    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (event.getChanges() == null || event.getChanges().isEmpty()) {
            return;
        }

        String hubMachineId = syncConfig.getMachineId();
        log.info("Hub broadcasting {} local changes to connected clients", event.getChanges().size());

        // Broadcast hub's own changes to all connected clients
        // The hub's machineId is excluded so the hub doesn't receive its own changes back
        hubSseService.broadcastChanges(event.getChanges(), hubMachineId);
    }
}
