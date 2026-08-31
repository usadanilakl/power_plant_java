package com.dk_power.power_plant_java.sevice.angular.permits;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Republishes the PWA's work-area snapshot whenever the underlying data has moved on without it.
 *
 * <h2>Why this exists</h2>
 *
 * {@code WorkAreaGitHubPublisher.publishAll()} is called from the four places that WRITE work areas
 * through the service layer. It is not called when a work area arrives by CRDT sync, because the
 * apply path writes entities directly and knows nothing about the PWA snapshot.
 *
 * <p>So a hub that RECEIVES its work areas rather than having them typed in never republishes, and
 * {@code work-areas.json} / {@code work-area-shapes.json} sit at {@code []} forever. That is not
 * hypothetical: it is why the PWA's map picker and the permits map both had nothing to draw.
 *
 * <p>The obvious fix — add a fifth call site in the sync apply path — is the wrong shape twice
 * over. It puts PWA publishing concerns inside the sync hot path, and it leaves the next write path
 * to remember a rule that has already been forgotten once. Converging on a fingerprint instead
 * means the snapshot is correct regardless of HOW the data got there: service save, sync apply,
 * restore from backup, or a manual database fix.
 *
 * <h2>Cost</h2>
 *
 * Two aggregate queries per tick, and a publish only when the fingerprint actually moves. The
 * Supabase sink additionally skips an upsert whose content hash is unchanged, so a redundant
 * publish costs nothing downstream. Publishing is already gated on a configured, active sink, so
 * an instance with no PWA target does nothing here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PwaSnapshotReconciler {

    private final EntityManager entityManager;
    private final WorkAreaGitHubPublisher publisher;

    @Value("${pwa.snapshot.reconcile.enabled:true}")
    private boolean enabled;

    /**
     * Null until the first tick, which is what makes a restart republish once. That is deliberate:
     * the fingerprint is held in memory, so after a restart the only safe assumption is that the
     * snapshot might be stale. One redundant publish is cheap; a silently stale snapshot is what
     * this class exists to prevent.
     */
    private volatile String lastFingerprint;

    @Scheduled(fixedDelay = 600000, initialDelay = 120000) // every 10 min, 2 min after start
    public void reconcile() {
        if (!enabled) return;
        try {
            String current = fingerprint();
            if (current.equals(lastFingerprint)) return;

            boolean first = lastFingerprint == null;
            lastFingerprint = current;
            publisher.publishAreas();
            publisher.publishMonitoredAreas();
            log.info("[PWA Snapshot] Work-area data changed{} — republishing ({})",
                    first ? " since startup" : "", current);
        } catch (Exception e) {
            // A reconciler that can throw on a schedule is worse than a stale snapshot.
            log.warn("[PWA Snapshot] Reconcile pass failed: {}", e.getMessage());
        }
    }

    /**
     * Cheap change detector: row count plus newest modification, for areas and for map shapes.
     *
     * <p>Count catches creates and soft deletes; the timestamp catches edits. Together they miss
     * only an edit that changes nothing observable, which by definition needs no republish.
     */
    @Transactional(readOnly = true)
    protected String fingerprint() {
        return part("WorkArea") + "|" + part("WorkAreaMapShape")
                + "|" + part("MonitoredArea") + "|" + part("AirTest");
    }

    private String part(String entityName) {
        List<Object[]> rows = entityManager
                .createQuery("SELECT COUNT(e), MAX(e.dateModified) FROM " + entityName + " e",
                        Object[].class)
                .getResultList();
        if (rows.isEmpty() || rows.get(0) == null) return entityName + ":0:-";
        Object[] row = rows.get(0);
        return entityName + ":" + row[0] + ":" + (row[1] == null ? "-" : row[1]);
    }
}
