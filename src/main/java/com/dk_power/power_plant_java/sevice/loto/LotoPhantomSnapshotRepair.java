package com.dk_power.power_plant_java.sevice.loto;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-time self-heal for the "LOTO permit shows no points" corruption.
 *
 * <p><b>What went wrong:</b> {@code Loto.getLatestSnapshot()} used to CREATE a snapshot when the permit had none, and
 * {@code NgLotoService.save()} persisted whatever it returned. The sync apply saves the {@code Loto} row BEFORE its
 * {@code LotoSnapshot}s have been applied, so on every inbound permit the receiving client minted and persisted an
 * EMPTY phantom snapshot ({@code dateCreated = now()}, zero points). Because "latest" is {@code max(dateCreated)}, the
 * phantom always won and shadowed the real snapshot — the permit rendered with NO LOTO points even though its
 * approval/hang/verify history (on the real snapshot) still showed. Created inside the sync apply, the phantom emits
 * no field-change, so it never propagated: the hub and the authoring desktop stayed correct and only receivers broke.
 *
 * <p>The cause is fixed (the getter now refuses to manufacture a snapshot mid-sync, and save() only persists one that
 * genuinely exists). This repairs the rows already written. It is deliberately NATIVE SQL: these phantoms are purely
 * client-local ghosts that never existed on the hub, so the delete must NOT emit a sync change.
 *
 * <p>Fingerprint (conservative — all must hold): the snapshot has zero rows in {@code loto_snapshot_points}, no
 * snapshot_reason / created_by / loto_point_order, every aggregate lifecycle column is null, AND a sibling snapshot of
 * the same permit DOES have points. A legitimate snapshot always carries the permit's copied point data, so this can
 * only match a manufactured empty one. Idempotent: a no-op once clean (and on the hub, which never had them).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LotoPhantomSnapshotRepair {

    private final EntityManager em;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void repair() {
        try {
            String where = """
                    NOT EXISTS (SELECT 1 FROM loto_snapshot_points p WHERE p.loto_snapshot_id = s.id)
                    AND s.snapshot_reason IS NULL
                    AND s.created_by IS NULL
                    AND s.loto_point_order IS NULL
                    AND s.ca_approved_for_hanging_by IS NULL
                    AND s.hung_by IS NULL
                    AND s.verified_by IS NULL
                    AND s.ca_activated_by IS NULL
                    AND s.closed_by IS NULL
                    AND EXISTS (SELECT 1 FROM loto_snapshot o
                                JOIN loto_snapshot_points op ON op.loto_snapshot_id = o.id
                                WHERE o.loto_id = s.loto_id AND o.id <> s.id)
                    """;

            Number count = (Number) em.createNativeQuery(
                    "SELECT COUNT(*) FROM loto_snapshot s WHERE " + where).getSingleResult();
            if (count == null || count.intValue() == 0) return;

            int deleted = em.createNativeQuery("DELETE FROM loto_snapshot s WHERE " + where).executeUpdate();
            log.warn("[LOTO repair] Removed {} phantom empty snapshot(s) that were hiding their permit's LOTO points. "
                    + "These were manufactured locally during sync apply and never existed on the hub.", deleted);
        } catch (Exception e) {
            // Never block startup on a best-effort repair (e.g. a schema that predates these columns).
            log.warn("[LOTO repair] Phantom-snapshot repair skipped: {}", e.getMessage());
        }
    }
}
