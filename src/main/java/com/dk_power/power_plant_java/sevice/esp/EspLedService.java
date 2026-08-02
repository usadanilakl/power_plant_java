package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * WLED writer. Talks to an ESP running the stock WLED firmware over its
 * {@code /json/state} API using the <b>individual-LED</b> update path
 * ({@code seg.i}), not segments — same approach the standalone loto-boxes app
 * takes to sidestep WLED's 31-segment cap on 36-boxes-per-ESP hardware.
 * <p>
 * <b>How the write works:</b> for a given ESP, load every LotoBox on any of
 * its LED strips, chain the per-strip LED ranges into a single absolute index
 * space (strip 0 stays as-is, strip 1 offsets by strip-0-total, strip 2 offsets
 * by strip-0-total + strip-1-total, ...), assemble the {@code seg.i} array as
 * {@code [idx, "RRGGBB", idx+1, "RRGGBB", ...]}, and POST it. Any LED not
 * assigned to a box gets the default "closed" color, so gaps between box
 * ranges don't produce random pixels.
 * <p>
 * <b>HTTP client choice:</b> uses {@link HttpClient} (JDK 11+ built-in), NOT
 * Spring's {@code RestTemplate}. WLED's embedded AsyncWebServer 400s
 * RestTemplate + SimpleClientHttpRequestFactory posts even when the JSON body
 * is byte-identical to a working {@code curl} call — some quirk in
 * HttpURLConnection framing that WLED's parser rejects. The JDK's built-in
 * HttpClient behaves like curl for these tiny embedded servers and works. Same
 * Java runtime, different HTTP client class — no dependency changes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EspLedService {

    /** Default color for unassigned LEDs — matches the "closed" box color. */
    private static final int[] DEFAULT_RGB = {0, 0, 32};

    /**
     * JDK HttpClient tuned for LAN calls to WLED boxes. HTTP/1.1 forced —
     * WLED does not speak HTTP/2 and negotiating it is wasted round-trips.
     * Short connect timeout so a half-alive box fails fast instead of pinning
     * a scheduler thread.
     */
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    /** Reused mapper — thread-safe. */
    private final ObjectMapper mapper = new ObjectMapper();

    private final EspDeviceService espDeviceService;
    private final LotoBoxRepo lotoBoxRepo;
    private final LedStripService ledStripService;

    /**
     * Rebuild the full LED array for one ESP from current DB state and POST
     * it. Throws on transport failure so the caller (the queue processor) can
     * count retries.
     */
    public void syncFullLedArray(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            throw new IllegalArgumentException("ESP device or IP address is null");
        }

        // Strips in physical order — LotoBox.rangeStart/rangeEnd are relative
        // to each strip's own [0, totalLeds) window, so we chain them by strip
        // sequence to get absolute WLED indices.
        List<LedStrip> strips = ledStripService.getByEspDeviceId(espDevice.getId());
        strips.sort(Comparator.comparing(s -> s.getSequence() == null ? Integer.MAX_VALUE : s.getSequence()));

        int totalLeds = strips.stream()
                .mapToInt(s -> s.getTotalLeds() == null ? 0 : s.getTotalLeds())
                .sum();
        if (totalLeds == 0) {
            log.warn("[EspLedService] ESP {} has no LED strips configured — skipping sync.", espDevice.getName());
            return;
        }

        // Offset of each strip's start within the chained address space.
        Map<Long, Integer> stripStartOffset = new HashMap<>();
        int running = 0;
        for (LedStrip strip : strips) {
            stripStartOffset.put(strip.getId(), running);
            running += strip.getTotalLeds() == null ? 0 : strip.getTotalLeds();
        }

        // Full color buffer — start with the default closed color for every LED,
        // then overwrite the LEDs each box owns. This handles gaps between box
        // ranges (e.g. box 1 owns 0..17, box 2 owns 20..37 — LEDs 18-19 stay
        // at the default) and boxes with unset rangeStart/rangeEnd (skipped).
        int[][] leds = new int[totalLeds][3];
        for (int i = 0; i < totalLeds; i++) {
            leds[i] = DEFAULT_RGB;
        }

        List<LotoBox> boxes = lotoBoxRepo.findByEspDeviceId(espDevice.getId());
        for (LotoBox box : boxes) {
            if (box.getLedStrip() == null || box.getRangeStart() == null || box.getRangeEnd() == null) continue;
            Integer offset = stripStartOffset.get(box.getLedStrip().getId());
            if (offset == null) continue;

            int r = box.getR() == null ? DEFAULT_RGB[0] : box.getR();
            int g = box.getG() == null ? DEFAULT_RGB[1] : box.getG();
            int b = box.getB() == null ? DEFAULT_RGB[2] : box.getB();
            int start = offset + box.getRangeStart();
            int end = offset + box.getRangeEnd();
            for (int i = start; i <= end && i < totalLeds; i++) {
                leds[i] = new int[]{r, g, b};
            }
        }

        // WLED individual-LED payload: seg.i = [idx, "RRGGBB", idx, "RRGGBB", ...]
        List<Object> segI = new ArrayList<>(totalLeds * 2);
        for (int i = 0; i < totalLeds; i++) {
            segI.add(i);
            segI.add(rgbToHex(leds[i][0], leds[i][1], leds[i][2]));
        }
        Map<String, Object> seg = new HashMap<>();
        seg.put("i", segI);

        Map<String, Object> state = new HashMap<>();
        state.put("on", true);
        state.put("bri", 255);
        state.put("transition", 0);
        state.put("seg", seg);

        String url = "http://" + espDevice.getIpAddress() + "/json/state";
        postJson(url, state, totalLeds, strips, espDevice);
    }

    /**
     * POST JSON to a WLED endpoint via {@link HttpClient}. Throws on non-2xx
     * or transport failure so the queue's retry counter increments.
     */
    private void postJson(String url, Map<String, Object> body, int totalLeds,
                          List<LedStrip> strips, EspDevice espDevice) {
        String bodyJson;
        try {
            bodyJson = mapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize WLED body", e);
        }

        StringBuilder stripInfo = new StringBuilder();
        if (strips != null) {
            for (LedStrip s : strips) {
                if (stripInfo.length() > 0) stripInfo.append(",");
                stripInfo.append(s.getStripNumber()).append(":").append(s.getTotalLeds());
            }
        }
        log.info("[EspLedService] POST {} — {} LEDs, strips=[{}], bodyLen={}",
                url, totalLeds, stripInfo, bodyJson.length());

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(3))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        HttpResponse<String> resp;
        try {
            resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new RuntimeException("WLED POST transport error: " + e.getMessage(), e);
        }

        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            log.warn("[EspLedService] WLED {} rejected: status={} respBody={} reqBodyLen={} reqBodyTail={}",
                    espDevice == null ? url : espDevice.getIpAddress(),
                    resp.statusCode(),
                    resp.body(),
                    bodyJson.length(),
                    bodyJson.length() > 200 ? "…" + bodyJson.substring(bodyJson.length() - 200) : bodyJson);
            throw new RuntimeException("WLED HTTP " + resp.statusCode() + ": " + resp.body());
        }
    }

    /**
     * Turn off all LEDs on an ESP device using WLED JSON API.
     */
    public void turnOffAllLeds(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) return;
        try {
            Map<String, Object> state = new HashMap<>();
            state.put("on", false);
            postJson("http://" + espDevice.getIpAddress() + "/json/state", state, 0, null, espDevice);
            log.info("[EspLedService] Turned off ESP {}", espDevice.getName());
        } catch (Exception e) {
            log.error("[EspLedService] Failed to turn off ESP {}: {}", espDevice.getName(), e.getMessage());
        }
    }

    public boolean isEspDeviceReachable(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) return false;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("http://" + espDevice.getIpAddress() + "/json/info"))
                    .timeout(Duration.ofSeconds(2))
                    .GET().build();
            HttpResponse<Void> resp = http.send(req, HttpResponse.BodyHandlers.discarding());
            return resp.statusCode() >= 200 && resp.statusCode() < 300;
        } catch (Exception e) {
            return false;
        }
    }

    public String getEspDeviceStatus(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) return "Device or IP is null";
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("http://" + espDevice.getIpAddress() + "/json/info"))
                    .timeout(Duration.ofSeconds(2))
                    .GET().build();
            return http.send(req, HttpResponse.BodyHandlers.ofString()).body();
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    /** Convenience wrapper used by admin/UI paths that want to sync every ESP now. */
    public void syncAllEspDevices() {
        for (EspDevice device : espDeviceService.getAllActive()) {
            try {
                syncFullLedArray(device);
            } catch (Exception e) {
                log.error("[EspLedService] Sync failed for ESP {}: {}", device.getName(), e.getMessage());
            }
        }
    }

    private static String rgbToHex(int r, int g, int b) {
        return String.format(Locale.ROOT, "%02X%02X%02X", r & 0xFF, g & 0xFF, b & 0xFF);
    }
}
