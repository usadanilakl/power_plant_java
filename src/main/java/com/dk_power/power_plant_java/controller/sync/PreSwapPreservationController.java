package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.PreSwapChangePreservationService;
import com.dk_power.power_plant_java.sevice.sync.PreSwapChangePreservationService.PreservationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Client-side rescue after a full-DB swap. When the Electron manager replaces this desktop's local DB with
 * the hub's snapshot, it first copies the old {@code .mv.db} aside; after the swap + restart it POSTs that
 * copy's path here so this client's un-pushed local changes are re-injected into the outbox and pushed to the
 * hub instead of being lost.
 *
 * <p>Under {@code /api/resync/*}, which SecurityConfigSpring already restricts to internal/LAN callers — the
 * Electron manager calls it on its own localhost backend.
 */
@RestController
@RequestMapping("/api/resync")
@RequiredArgsConstructor
@Slf4j
public class PreSwapPreservationController {

    private final PreSwapChangePreservationService preservationService;

    /**
     * Mark the restored hub snapshot as already-on-hub (so the outbound loop doesn't re-push the hub's own
     * history back), then re-inject this client's un-pushed local changes read from the pre-swap DB copy.
     * POST /api/resync/preserve-local-changes?asidePath=/path/to/proddb-preswap.mv.db
     */
    @PostMapping("/preserve-local-changes")
    public ResponseEntity<PreservationResult> preserve(@RequestParam("asidePath") String asidePath) {
        log.info("preswap.preserve requested aside={}", asidePath);
        // Stop the post-swap outbound re-push of the hub's own change-history. Called SEPARATELY (its own
        // transaction) so that if this bulk UPDATE fails it can't roll back the rescue below. Best-effort: on
        // failure the client simply re-pushes the snapshot once and self-heals — the pre-fix behaviour.
        try {
            preservationService.markRestoredSnapshotOnServer();
        } catch (Exception e) {
            log.warn("preswap: marking restored snapshot already-on-hub failed (client will re-push once, then self-heal): {}",
                    e.getMessage());
        }
        return ResponseEntity.ok(preservationService.preserveFromAside(asidePath));
    }
}
