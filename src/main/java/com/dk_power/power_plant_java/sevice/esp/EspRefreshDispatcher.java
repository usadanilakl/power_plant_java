package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Sends ESP refresh triggers along the "hub-first, local fallback" path.
 * <p>
 * User-driven actions (a button on the LOTO board) can't tolerate the 5s
 * queue tick or the 10s leadership grace period — the user clicked a color
 * and expects the LED to change. This dispatcher makes the choice per call:
 * <ul>
 *   <li><b>Hub node:</b> enqueue on the local queue. The hub is unconditionally
 *       leader, so the next tick fires the write. No round-trip.</li>
 *   <li><b>Desktop node:</b> POST the trigger to the hub with a short timeout.
 *       If the hub answers, the hub takes ownership of the write. If the hub
 *       is unreachable, POST fails fast → desktop writes to the ESP itself
 *       via {@link EspLedService#syncFullLedArray} on the current thread and
 *       enqueues a queue row only if that direct write also fails, so the
 *       leader-based retry can pick it up later.</li>
 * </ul>
 * <p>
 * Why not always defer to the leader-based queue? Because
 * {@link WledCommandQueueService} on the desktop only runs after
 * {@link WledLeadershipService} has flipped the node to leader — up to 10s
 * after the hub becomes unreachable. Meanwhile the user's click sits
 * unprocessed. This bypass keeps user actions responsive regardless of
 * leadership state.
 */
@Service
@Slf4j
public class EspRefreshDispatcher {

    /** Match {@link EspLedService}'s short-timeout client — ESPs on LAN answer fast. */
    private final RestTemplate hubClient = buildShortTimeoutClient();

    private final NodeIdentityService nodeIdentity;
    private final WledCommandQueueService wledCommandQueueService;
    private final EspLedService espLedService;

    @Value("${sync.server.url:}")
    private String hubBaseUrl;

    public EspRefreshDispatcher(NodeIdentityService nodeIdentity,
                                WledCommandQueueService wledCommandQueueService,
                                EspLedService espLedService) {
        this.nodeIdentity = nodeIdentity;
        this.wledCommandQueueService = wledCommandQueueService;
        this.espLedService = espLedService;
    }

    private static RestTemplate buildShortTimeoutClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(3));
        return new RestTemplate(factory);
    }

    /**
     * Route an ESP refresh request through the hub-first / local-fallback flow.
     * Never throws — worst case is a warn log and the leader-based retry via the queue.
     */
    public void dispatch(LotoBox box) {
        if (box == null || box.getLedStrip() == null || box.getLedStrip().getEspDevice() == null) return;
        EspDevice esp = box.getLedStrip().getEspDevice();
        Long espDeviceId = esp.getId();

        if (nodeIdentity.isHub()) {
            wledCommandQueueService.enqueueEspRefresh(espDeviceId);
            return;
        }

        if (tryHubTrigger(espDeviceId)) return;

        // Hub unreachable — do the write here. This desktop only reaches ESPs
        // on the same LAN; if that also fails, enqueue so leadership-based
        // retry picks it up once we flip to leader.
        try {
            espLedService.syncFullLedArray(esp);
            log.debug("[EspDispatch] Local write to ESP {} succeeded (hub was unreachable).", esp.getName());
        } catch (Exception e) {
            log.warn("[EspDispatch] Local write to ESP {} failed: {}. Falling back to queue.",
                    esp.getName(), e.getMessage());
            wledCommandQueueService.enqueueEspRefresh(espDeviceId);
        }
    }

    /**
     * Returns true if the hub accepted the refresh trigger. Silent on failure —
     * the caller falls back to local. Short timeout so a dead hub doesn't stall
     * a user click for the shared RestTemplate's default (5min).
     */
    private boolean tryHubTrigger(Long espDeviceId) {
        if (hubBaseUrl == null || hubBaseUrl.isEmpty()) return false;
        String url = hubBaseUrl.replaceAll("/$", "") + "/ng/loto-boxes/esp/" + espDeviceId + "/refresh";
        try {
            hubClient.postForObject(url, null, String.class);
            return true;
        } catch (Exception e) {
            log.debug("[EspDispatch] Hub trigger failed for ESP {}: {}", espDeviceId, e.getMessage());
            return false;
        }
    }
}
