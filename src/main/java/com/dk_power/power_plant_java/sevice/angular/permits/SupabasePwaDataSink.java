package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@link PwaDataSink} that upserts datasets into the Supabase {@code reference_snapshot} table — the
 * auth-gated PWA failover source (replaces the public GitHub Pages JSON). Active when
 * {@code pwa.data-target} is {@code supabase} (default) or {@code both}, and Supabase is configured.
 * A per-key content hash skips re-uploading an unchanged dataset. See
 * project/architecture/supabase/reference-data.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabasePwaDataSink implements PwaDataSink {

    private final SupabaseAdminClient supabase;
    private final ObjectMapper objectMapper;

    @Value("${pwa.data-target:supabase}")
    private String dataTarget;

    private final Map<String, String> lastHash = new ConcurrentHashMap<>();

    @Override
    public boolean isActive() {
        String t = dataTarget == null ? "" : dataTarget.trim().toLowerCase();
        return (t.equals("supabase") || t.equals("both")) && supabase.isEnabled();
    }

    @Override
    public String name() {
        return "supabase";
    }

    @Override
    public void publishText(String datasetKey, String fileBaseName, String json) throws Exception {
        String hash = sha256(json);
        if (hash.equals(lastHash.get(datasetKey))) return;
        // Parse so the payload lands as a jsonb array/object, not a quoted JSON string.
        Object payload = objectMapper.readValue(json, Object.class);
        supabase.upsertReferenceSnapshot(datasetKey, payload, hash);
        lastHash.put(datasetKey, hash);
        log.info("[PWA Publisher] supabase: upserted reference_snapshot '{}'", datasetKey);
    }

    @Override
    public void publishBinary(String datasetKey, String fileBaseName, byte[] content) throws Exception {
        String b64 = Base64.getEncoder().encodeToString(content);
        String hash = sha256(b64);
        if (hash.equals(lastHash.get(datasetKey))) return;
        // A binary asset (the map image) can't be a jsonb array — store it as a base64 data payload.
        Map<String, Object> payload = Map.of(
                "contentType", "image/jpeg",
                "fileName", fileBaseName,
                "base64", b64);
        supabase.upsertReferenceSnapshot(datasetKey, payload, hash);
        lastHash.put(datasetKey, hash);
        log.info("[PWA Publisher] supabase: upserted binary reference_snapshot '{}'", datasetKey);
    }

    private static String sha256(String s) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return Integer.toHexString(s.hashCode());
        }
    }
}
