package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncBroadcastAsyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Broadcasts LOCAL writes (originating from this server's REST controllers) to
 * this server's own SSE clients so two Angular tabs on the same machine — or
 * the LOTO Builder and the LOTO Standard page open in different windows — see
 * each other's edits live.
 * <p>
 * <b>Why this is separate from the receive-path broadcast:</b>
 * {@link com.dk_power.power_plant_java.sevice.sync.FieldSyncService#applyIncomingChanges}
 * already calls {@link SyncUpdateController#broadcastEntityUpdate} — but ONLY
 * when this server APPLIES a change RECEIVED from a peer machine. Local writes
 * had no such path today, so:
 * <ul>
 *   <li>Tab A on Machine 1 writes → tab A sees its own optimistic result.</li>
 *   <li>Tab B on Machine 1 never gets an SSE event → tab B is stale until the
 *       write round-trips through the hub and comes back as a "remote" change.</li>
 * </ul>
 * This listener closes that gap: on every local {@code ChangesDetectedEvent} it
 * groups the FieldChanges by (entityType, entityId) and hands each to
 * {@link SyncUpdateController#broadcastEntityUpdate}. The writing tab suppresses
 * its own event via the {@code originClientId} echo — see
 * {@link SyncEventPublisher.ChangesDetectedEvent#getOriginClientId()} and the
 * Angular {@code SyncUpdateService.getEntityTypeUpdates$} filter.
 * <p>
 * <b>Interplay with {@code HubLocalChangeBroadcaster}:</b> disjoint. The hub
 * broadcaster forwards to REMOTE hub-SSE clients (other machines' desktops)
 * via {@code HubSseService}, keyed by machine id. This broadcaster writes to
 * {@link SyncUpdateController}'s per-tab emitter registry. Same event, two
 * sinks, no overlap — safe on both hub and desktop.
 * <p>
 * <b>@Async on a bounded executor</b> (see {@link SyncBroadcastAsyncConfig}) —
 * a burst of writes (mass import, snapshot restore, SP pull) doesn't spawn
 * unbounded threads. If the queue fills up the caller runs the broadcast
 * inline, back-pressuring the write path rather than dropping events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocalChangeSseBroadcaster {

    private final SyncUpdateController syncUpdateController;

    @Async(SyncBroadcastAsyncConfig.EXECUTOR_NAME)
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        List<FieldChange> all = event.getChanges();
        if (all == null || all.isEmpty()) return;

        String originClientId = event.getOriginClientId();

        // Group by (entityType, entityId) mirroring FieldSyncService's receive-path
        // grouping shape, so browser subscribers see the same event granularity
        // as they do for remote-machine changes.
        Map<String, List<FieldChange>> grouped = new LinkedHashMap<>();
        for (FieldChange fc : all) {
            String entityType = fc.getEntityType();
            Long entityId = fc.getEntityId();
            if (entityType == null || entityId == null) continue;
            grouped.computeIfAbsent(entityType + ":" + entityId, k -> new ArrayList<>()).add(fc);
        }

        for (Map.Entry<String, List<FieldChange>> entry : grouped.entrySet()) {
            List<FieldChange> group = entry.getValue();
            FieldChange head = group.get(0);
            try {
                syncUpdateController.broadcastEntityUpdate(
                        head.getEntityType(), head.getEntityId(), group, originClientId);
            } catch (Exception e) {
                log.error("Local SSE broadcast failed for {} #{}: {}",
                        head.getEntityType(), head.getEntityId(), e.getMessage());
            }
        }
    }
}
