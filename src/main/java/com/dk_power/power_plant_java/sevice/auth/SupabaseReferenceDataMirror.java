package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.pwa.PwaReferenceDataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Mirrors the PWA reference datasets (LOTO points, work areas, locations) into Supabase
 * {@code reference_snapshot} so the PWA can fall back to Supabase (auth-gated) when the hub is
 * unreachable — instead of the old PUBLIC static JSON on GitHub Pages. The hub stays the primary
 * provider; this is failover.
 *
 * <p>Runs on the hub (and in dev), NOT on prod desktops — same scoping as {@code SupabaseReconciliationService}.
 * Uses the exact same {@link PwaReferenceDataService} producers the live PWA endpoints use, so the
 * failover payload can't drift. A content hash skips re-uploading an unchanged dataset.
 * See project/architecture/supabase/reference-data.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseReferenceDataMirror {

    private final SupabaseAdminClient supabase;
    private final PwaReferenceDataService referenceData;
    private final SyncConfig syncConfig;
    private final Environment env;
    private final ObjectMapper objectMapper;

    @Value("${supabase.reference-mirror-enabled:true}")
    private boolean mirrorEnabled;

    /** Last content hash pushed per key, to skip unchanged datasets (re-pushes once after a restart). */
    private final Map<String, String> lastHash = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 600_000, initialDelay = 90_000) // every 10 min
    public void mirror() {
        if (!mirrorEnabled || isProdDesktop()) return;
        if (!supabase.isEnabled() || !supabase.ping()) return;
        mirrorOne("loto_points", referenceData::getLotoPoints);
        mirrorOne("work_areas", referenceData::getWorkAreas);
        mirrorOne("locations", referenceData::getLocations);
    }

    private void mirrorOne(String key, Supplier<List<Map<String, Object>>> producer) {
        try {
            List<Map<String, Object>> data = producer.get();
            String json = objectMapper.writeValueAsString(data);
            String hash = sha256(json);
            if (hash.equals(lastHash.get(key))) return; // unchanged since last push
            supabase.upsertReferenceSnapshot(key, data, hash);
            lastHash.put(key, hash);
            log.info("[Supabase reference] mirrored {} ({} rows) to Supabase", key, data.size());
        } catch (SupabaseAdminClient.SupabaseUnavailableException e) {
            log.debug("[Supabase reference] {} push skipped — Supabase down", key);
        } catch (RuntimeException | com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("[Supabase reference] failed to mirror {}: {}", key, e.getMessage());
        }
    }

    /** True on a production DESKTOP node (prod profile, not the hub). Dev/test and the hub return false. */
    private boolean isProdDesktop() {
        for (String p : env.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(p)) return !syncConfig.isHubMode();
        }
        return false;
    }

    private static String sha256(String s) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return Integer.toHexString(s.hashCode()); // fallback; still changes when content changes
        }
    }
}
