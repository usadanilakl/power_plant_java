package com.dk_power.power_plant_java.sevice.esp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Decides — for THIS node, right now — whether it's the one that gets to send
 * WLED writes to the ESP controllers. Only the leader runs the queue processor
 * inside {@link WledCommandQueueService}, so at any moment only one node is
 * POSTing to a given ESP under normal conditions.
 * <p>
 * <b>Rules:</b>
 * <ol>
 *   <li>Hub is always leader. It's the canonical writer, on-site, next to the
 *       ESP controllers.</li>
 *   <li>Desktops probe the hub every {@link #PROBE_INTERVAL_SECONDS} seconds
 *       at {@code ${sync.server.url}/ng/leadership/alive}. If the hub responds
 *       within {@link #PROBE_TIMEOUT_MS} ms, the desktop is NOT leader — it
 *       defers to the hub.</li>
 *   <li>If the hub has been unreachable for {@link #HUB_DOWN_GRACE_SECONDS}+
 *       seconds, desktops flip to leader mode and start writing.</li>
 * </ol>
 * <p>
 * <b>Multi-desktop hub-down race:</b> when several desktops promote themselves
 * at the same time, they'll each rebuild the target LED array from their own
 * local DB and POST it to the ESP. Writes are idempotent (the full-array send
 * from {@link EspLedService#syncFullLedArray} sets every LED to its DB-declared
 * color), so the race causes duplicate HTTP posts but no correctness issue. We
 * accept that in exchange for not needing a distributed lease table across
 * per-node H2 databases.
 * <p>
 * <b>Hub-return handoff:</b> when the hub comes back after a desktop was
 * writing, that desktop's next probe succeeds → it flips {@code leader=false}
 * on the next tick and stops writing. Hub is unconditionally leader on
 * itself, so it starts writing immediately. Nothing is lost — the queue is
 * DB-backed and both nodes read from the same authoritative state (their own
 * DB, which sync brings in line with the rest of the cluster).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WledLeadershipService {

    /** Interval between hub-probe attempts on desktops. */
    private static final long PROBE_INTERVAL_SECONDS = 3;

    /** How long the hub can be unreachable before desktops take over. */
    private static final long HUB_DOWN_GRACE_SECONDS = 10;

    /** RestTemplate probe timeout — hub either answers quickly on the LAN, or it's down. */
    private static final int PROBE_TIMEOUT_MS = 2000;

    private final NodeIdentityService nodeIdentity;

    @Value("${sync.server.url:}")
    private String hubBaseUrl;

    /**
     * Timestamp of the most recent successful probe against the hub. Seeded at
     * startup with {@code Instant.now()} on desktops — treat the hub as
     * "alive at boot" so if it never actually was alive, we still take over
     * after the grace period elapses (boot + 10s).
     */
    private final AtomicReference<Instant> hubLastSeen = new AtomicReference<>();

    /**
     * Cached leadership state. Read by {@link WledCommandQueueService} on every
     * queue-processing tick to decide whether to run.
     */
    private volatile boolean leader;

    /**
     * Boot state: hubs are leader immediately (no probe needed). Desktops are
     * NOT leader initially — the first probe cycle needs a chance to confirm
     * the hub is down before flipping.
     */
    @jakarta.annotation.PostConstruct
    void init() {
        if (nodeIdentity.isHub()) {
            leader = true;
            log.info("[WledLeadership] I am the HUB — leader immediately.");
        } else {
            leader = false;
            // Seed with boot time so the grace period ticks from process start
            // — if the hub is unreachable from the very first probe, we still
            // promote after HUB_DOWN_GRACE_SECONDS.
            hubLastSeen.set(Instant.now());
            log.info("[WledLeadership] I am a DESKTOP ({}) — probing hub at {} every {}s, taking over after {}s of silence.",
                    nodeIdentity.getHostname(),
                    hubBaseUrl == null || hubBaseUrl.isEmpty() ? "<no sync.server.url>" : hubBaseUrl,
                    PROBE_INTERVAL_SECONDS,
                    HUB_DOWN_GRACE_SECONDS);
        }
    }

    /** Callback for {@link WledCommandQueueService} — should I be writing to ESPs right now? */
    public boolean isLeader() {
        return leader;
    }

    @Scheduled(fixedDelay = PROBE_INTERVAL_SECONDS * 1000)
    void probeHub() {
        // Hub is always the leader on itself. No probe, no promotion logic.
        if (nodeIdentity.isHub()) return;

        if (hubBaseUrl == null || hubBaseUrl.isEmpty()) {
            // No hub configured. Desktop takes over immediately — nothing else
            // is going to write. Logged once at startup; keep silent here to
            // avoid log spam every 3s.
            leader = true;
            return;
        }

        try {
            // Raw HttpURLConnection with a short hand-rolled timeout — the
            // shared RestTemplate bean has a 5-minute response timeout which
            // would stall the scheduled task when the hub is unreachable.
            String url = hubBaseUrl.replaceAll("/$", "") + "/ng/leadership/alive";
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            try {
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(PROBE_TIMEOUT_MS);
                conn.setReadTimeout(PROBE_TIMEOUT_MS);
                int status = conn.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new RuntimeException("HTTP " + status);
                }
            } finally {
                conn.disconnect();
            }
            hubLastSeen.set(Instant.now());
            if (leader) {
                log.info("[WledLeadership] Hub back online — stepping down.");
                leader = false;
            }
        } catch (Exception e) {
            // Hub probe failed. Don't touch hubLastSeen — we want the grace
            // period measured from the LAST known-good state (or boot time
            // if we've never seen the hub). If enough silence has elapsed,
            // promote to leader.
            Instant seen = hubLastSeen.get();
            long silenceSeconds = Duration.between(seen, Instant.now()).getSeconds();
            if (silenceSeconds >= HUB_DOWN_GRACE_SECONDS && !leader) {
                log.warn("[WledLeadership] Hub unreachable for {}s ({}). Taking over as leader.",
                        silenceSeconds, e.getMessage());
                leader = true;
            }
        }
    }
}
