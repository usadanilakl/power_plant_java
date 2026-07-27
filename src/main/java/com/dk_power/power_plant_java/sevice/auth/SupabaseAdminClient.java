package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Thin admin client for the Supabase secondary auth store (GoTrue admin API + PostgREST).
 *
 * <p>Authenticated with the <b>service-role</b> key (bypasses RLS) — hub-only, never shipped to the
 * browser. All mutating callers use it fire-and-forget: if Supabase is down the hub keeps working
 * and reconciliation catches up later, so methods throw {@link SupabaseUnavailableException} for
 * 5xx / network failures (after 2 retries) and {@link SupabaseClientException} for 4xx (fail fast).
 *
 * <p>See project/features/users/dual-auth.md.
 */
@Service
@Slf4j
public class SupabaseAdminClient {

    /** Thrown when Supabase is unreachable / erroring (treat as "store is down"). */
    public static class SupabaseUnavailableException extends RuntimeException {
        public SupabaseUnavailableException(String m, Throwable c) { super(m, c); }
    }

    /** Thrown on a 4xx (bad request / conflict) — a client-side problem, do not retry. */
    public static class SupabaseClientException extends RuntimeException {
        private final int status;
        public SupabaseClientException(int status, String m) { super(m); this.status = status; }
        public int getStatus() { return status; }
    }

    /** Snapshot of a Supabase user relevant to reconciliation. */
    public record SupabaseUser(
            String uuid,
            String email,
            LocalDateTime passwordUpdatedAt,
            LocalDateTime metadataUpdatedAt,
            Map<String, Object> metadata) {}

    /** A public.user_link row surfaced during the Supabase→hub metadata delta walk. */
    public record SupabaseLink(
            String uuid,
            String hubEmail,
            LocalDateTime metadataUpdatedAt) {}

    private final boolean enabled;
    private final String url;
    private final String serviceKey;
    private final String anonKey;
    private final RestClient client;

    public SupabaseAdminClient(
            @Value("${supabase.url:}") String url,
            @Value("${supabase.service.role.key:}") String serviceKey,
            @Value("${supabase.anon.key:}") String anonKey,
            @Value("${supabase.enabled:true}") boolean enabledFlag,
            @Value("${supabase.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${supabase.read-timeout-ms:8000}") int readTimeoutMs) {

        this.url = url == null ? "" : url.trim().replaceAll("/+$", "");
        this.serviceKey = serviceKey == null ? "" : serviceKey.trim();
        this.anonKey = anonKey == null ? "" : anonKey.trim();
        this.enabled = enabledFlag && !this.url.isBlank() && !this.serviceKey.isBlank();

        // NOTE: use the JDK HttpClient factory, NOT SimpleClientHttpRequestFactory — the latter is
        // backed by HttpURLConnection, which cannot send the HTTP PATCH method (ProtocolException).
        // PostgREST link updates (linkHubUser / setLinkPasswordUpdatedAt) are PATCH, so they silently
        // failed under the Simple factory while GET/POST/PUT worked. JdkClientHttpRequestFactory
        // (java.net.http.HttpClient) supports PATCH.
        java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofMillis(connectTimeoutMs))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(java.time.Duration.ofMillis(readTimeoutMs));

        this.client = RestClient.builder()
                .baseUrl(this.url.isBlank() ? "http://localhost:0" : this.url)
                .requestFactory(factory)
                .defaultHeader("apikey", this.serviceKey)
                .defaultHeader("Authorization", "Bearer " + this.serviceKey)
                .build();

        if (this.enabled) {
            log.info("[Supabase] Admin client configured for {}", this.url);
        } else {
            log.info("[Supabase] Admin client DISABLED (supabase.url / service key not set). "
                    + "Hub operates standalone; reconciliation is a no-op.");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    // ── Reachability ─────────────────────────────────────────────────────────

    /** Cheap unauthenticated health probe. Returns false when disabled or unreachable — never throws. */
    public boolean ping() {
        if (!enabled) return false;
        try {
            ResponseEntity<Void> resp = client.get().uri("/auth/v1/health").retrieve().toBodilessEntity();
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.debug("[Supabase] ping failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifies an email+password against Supabase by attempting a GoTrue password grant. Returns true
     * only on a 200. This proves <b>knowledge of the password</b> (not mere possession of a bearer
     * token), which is what the hub {@code /reconcile} endpoint must gate on before overwriting the
     * hub credential. Fails closed (false) when Supabase is unreachable.
     */
    public boolean verifyPassword(String email, String password) {
        if (!enabled) return false;
        String apiKey = !anonKey.isBlank() ? anonKey : serviceKey;
        try {
            ResponseEntity<Void> resp = client.post()
                    .uri("/auth/v1/token?grant_type=password")
                    // Authorize this grant with the apikey (anon), NOT the default service-role bearer.
                    // NB: a request-level h.remove(AUTHORIZATION) is a no-op against builder defaults;
                    // h.set overrides the merged default, so set both to the anon key.
                    .headers(h -> {
                        h.set(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
                        h.set("apikey", apiKey);
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email, "password", password))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> { /* wrong creds → not verified */ })
                    .toBodilessEntity();
            return resp.getStatusCode().is2xxSuccessful();
        } catch (RuntimeException e) {
            log.debug("[Supabase] verifyPassword failed for {}: {}", email, e.getMessage());
            return false;
        }
    }

    // ── User CRUD (GoTrue admin API) ─────────────────────────────────────────

    /**
     * Creates a Supabase auth user. If the email already exists (409/422) the existing uuid is
     * returned instead, so provisioning stays idempotent.
     */
    public String createUser(String email, String plaintextPassword, Map<String, Object> metadata) {
        requireEnabled();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("password", plaintextPassword);
        body.put("email_confirm", true);
        body.put("user_metadata", metadata == null ? Map.of() : metadata);
        try {
            JsonNode created = withRetry(() -> client.post()
                    .uri("/auth/v1/admin/users")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class));
            return created != null && created.hasNonNull("id") ? created.get("id").asText() : null;
        } catch (SupabaseClientException e) {
            // Duplicate email — recover the existing uuid so callers can link it.
            if (e.getStatus() == 422 || e.getStatus() == 409) {
                SupabaseUser existing = getUserByEmail(email);
                if (existing != null) {
                    log.info("[Supabase] createUser: {} already existed — reusing uuid {}", email, existing.uuid());
                    return existing.uuid();
                }
            }
            throw e;
        }
    }

    public void updateUserEmail(String uuid, String newEmail) {
        requireEnabled();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", newEmail);
        body.put("email_confirm", true);
        adminUpdate(uuid, body);
    }

    public void updateUserPassword(String uuid, String plaintextPassword) {
        requireEnabled();
        adminUpdate(uuid, Map.of("password", plaintextPassword));
    }

    public void updateUserMetadata(String uuid, Map<String, Object> metadata) {
        requireEnabled();
        adminUpdate(uuid, Map.of("user_metadata", metadata == null ? Map.of() : metadata));
    }

    private void adminUpdate(String uuid, Map<String, Object> body) {
        withRetry(() -> client.put()
                .uri("/auth/v1/admin/users/{id}", uuid)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity());
    }

    /**
     * Looks up a Supabase user by email. Returns null when no row exists. Combines the
     * {@code get_auth_sync_status} RPC (uuid + reconciliation timestamps from public.user_link)
     * with an admin fetch for the current email + metadata.
     */
    public SupabaseUser getUserByEmail(String email) {
        requireEnabled();
        JsonNode statusArr = withRetry(() -> client.post()
                .uri("/rest/v1/rpc/get_auth_sync_status")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("p_email", email))
                .retrieve()
                .body(JsonNode.class));

        if (statusArr == null || !statusArr.isArray() || statusArr.isEmpty()) {
            return null;
        }
        JsonNode row = statusArr.get(0);
        String uuid = row.path("supabase_uuid").asText(null);
        LocalDateTime pwdAt = parseTs(row.path("password_updated_at").asText(null));
        LocalDateTime metaAt = parseTs(row.path("metadata_updated_at").asText(null));

        String currentEmail = email;
        Map<String, Object> metadata = Map.of();
        try {
            JsonNode u = withRetry(() -> client.get()
                    .uri("/auth/v1/admin/users/{id}", uuid)
                    .retrieve()
                    .body(JsonNode.class));
            if (u != null) {
                currentEmail = u.path("email").asText(email);
                JsonNode md = u.get("user_metadata");
                if (md != null && md.isObject()) {
                    metadata = new com.fasterxml.jackson.databind.ObjectMapper().convertValue(md, Map.class);
                }
            }
        } catch (RuntimeException e) {
            log.debug("[Supabase] getUserByEmail: metadata fetch failed for {} ({}) — returning timestamps only",
                    email, e.getMessage());
        }
        return new SupabaseUser(uuid, currentEmail, pwdAt, metaAt, metadata);
    }

    /**
     * Lists public.user_link rows whose metadata changed after {@code since} (service-role read,
     * bypasses RLS), ordered oldest-first. Used by the Supabase→hub metadata delta walk.
     */
    public List<SupabaseLink> listLinksModifiedSince(LocalDateTime since) {
        requireEnabled();
        String iso = since.atOffset(ZoneOffset.UTC).toString();
        JsonNode arr = withRetry(() -> client.get()
                .uri(b -> b.path("/rest/v1/user_link")
                        .queryParam("select", "supabase_uuid,hub_email,metadata_updated_at")
                        .queryParam("metadata_updated_at", "gt." + iso)
                        .queryParam("order", "metadata_updated_at.asc")
                        .queryParam("limit", "1000")
                        .build())
                .retrieve()
                .body(JsonNode.class));
        List<SupabaseLink> out = new java.util.ArrayList<>();
        if (arr != null && arr.isArray()) {
            for (JsonNode row : arr) {
                out.add(new SupabaseLink(
                        row.path("supabase_uuid").asText(null),
                        row.path("hub_email").asText(null),
                        parseTs(row.path("metadata_updated_at").asText(null))));
            }
        }
        return out;
    }

    /**
     * Fetches the reconciliation timestamps for a known uuid from public.user_link (service-role read,
     * bypasses RLS). Used when the hub already knows the Supabase uuid and must NOT look up by a
     * possibly-changed email. Returns null when no link row exists.
     */
    public SupabaseUser getSyncStatusByUuid(String uuid) {
        requireEnabled();
        JsonNode arr = withRetry(() -> client.get()
                .uri(b -> b.path("/rest/v1/user_link")
                        .queryParam("select", "password_updated_at,metadata_updated_at")
                        .queryParam("supabase_uuid", "eq." + uuid)
                        .queryParam("limit", "1")
                        .build())
                .retrieve()
                .body(JsonNode.class));
        if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
        JsonNode row = arr.get(0);
        return new SupabaseUser(uuid, null,
                parseTs(row.path("password_updated_at").asText(null)),
                parseTs(row.path("metadata_updated_at").asText(null)),
                Map.of());
    }

    /** Fetches a Supabase auth user's current email + user_metadata by uuid (single admin call). */
    public SupabaseUser getUserByUuid(String uuid) {
        requireEnabled();
        JsonNode u = withRetry(() -> client.get()
                .uri("/auth/v1/admin/users/{id}", uuid)
                .retrieve()
                .body(JsonNode.class));
        if (u == null || !u.hasNonNull("id")) return null;
        Map<String, Object> metadata = Map.of();
        JsonNode md = u.get("user_metadata");
        if (md != null && md.isObject()) {
            metadata = new com.fasterxml.jackson.databind.ObjectMapper().convertValue(md, Map.class);
        }
        return new SupabaseUser(uuid, u.path("email").asText(null), null, null, metadata);
    }

    /** Writes hub_user_id / hub_email back onto the public.user_link cross-reference row. */
    public void linkHubUser(String uuid, Long hubUserId, String email) {
        requireEnabled();
        Map<String, Object> patch = new LinkedHashMap<>();
        patch.put("hub_user_id", hubUserId);
        patch.put("hub_email", email);
        patchLink(uuid, patch);
    }

    /**
     * Forces public.user_link.password_updated_at to a specific instant. Bulk-provisioning uses this
     * to backdate the throwaway temp password to the epoch, so the LWW comparison always treats the
     * hub's real password as newer and the user's first hub login pushes it to Supabase.
     */
    public void setLinkPasswordUpdatedAt(String uuid, LocalDateTime utc) {
        requireEnabled();
        String iso = utc.atOffset(ZoneOffset.UTC).toString();
        patchLink(uuid, Map.of("password_updated_at", iso));
    }

    private void patchLink(String uuid, Map<String, Object> patch) {
        // Build path + query via the URI builder (same pattern as the working GET queries above); a
        // string template with an embedded query can drop/mangle the filter under some encodings.
        withRetry(() -> client.patch()
                .uri(b -> b.path("/rest/v1/user_link").queryParam("supabase_uuid", "eq." + uuid).build())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "return=minimal")
                .body(patch)
                .retrieve()
                .toBodilessEntity());
    }

    // ── Plant Chat admin ─────────────────────────────────────────────────────

    /**
     * Create a new plant chat conversation via PostgREST (service-role bypasses RLS). Returns the
     * created row's Supabase UUID so the caller can immediately mirror it into the H2 audit table.
     * See {@code project/features/users/communication/plant-chat.md}.
     */
    public String createPlantConversation(String name, String description, String createdBySupabaseUuid,
                                          Boolean isEditable, String entityType, Long entityId) {
        requireEnabled();
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("name", name);
        if (description != null && !description.isBlank()) row.put("description", description);
        row.put("created_by", createdBySupabaseUuid);
        if (isEditable != null) row.put("is_editable", isEditable);
        if (entityType != null && !entityType.isBlank()) row.put("entity_type", entityType);
        if (entityId != null) row.put("entity_id", entityId);

        JsonNode created = withRetry(() -> client.post()
                .uri("/rest/v1/plant_conversation")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "return=representation")
                .body(row)
                .retrieve()
                .body(JsonNode.class));
        if (created == null) {
            throw new SupabaseUnavailableException("Supabase returned no body on conversation create", null);
        }
        // PostgREST returns an array of inserted rows.
        JsonNode row0 = created.isArray() ? (created.size() > 0 ? created.get(0) : null) : created;
        return row0 != null && row0.hasNonNull("id") ? row0.get("id").asText() : null;
    }

    /** Soft-archive a conversation by setting {@code archived_at}. Idempotent. */
    public void archivePlantConversation(String supabaseId) {
        requireEnabled();
        String iso = LocalDateTime.now(ZoneOffset.UTC).atOffset(ZoneOffset.UTC).toString();
        withRetry(() -> client.patch()
                .uri(b -> b.path("/rest/v1/plant_conversation").queryParam("id", "eq." + supabaseId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "return=minimal")
                .body(Map.of("archived_at", iso))
                .retrieve()
                .toBodilessEntity());
    }

    /** Un-archive (clear {@code archived_at}). */
    public void unarchivePlantConversation(String supabaseId) {
        requireEnabled();
        Map<String, Object> patch = new LinkedHashMap<>();
        patch.put("archived_at", null);
        withRetry(() -> client.patch()
                .uri(b -> b.path("/rest/v1/plant_conversation").queryParam("id", "eq." + supabaseId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "return=minimal")
                .body(patch)
                .retrieve()
                .toBodilessEntity());
    }

    /** Rename / re-describe. */
    public void updatePlantConversation(String supabaseId, String name, String description, Boolean isEditable) {
        requireEnabled();
        Map<String, Object> patch = new LinkedHashMap<>();
        if (name != null) patch.put("name", name);
        if (description != null) patch.put("description", description);
        if (isEditable != null) patch.put("is_editable", isEditable);
        if (patch.isEmpty()) return;
        withRetry(() -> client.patch()
                .uri(b -> b.path("/rest/v1/plant_conversation").queryParam("id", "eq." + supabaseId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "return=minimal")
                .body(patch)
                .retrieve()
                .toBodilessEntity());
    }

    // ── Reference-data failover snapshots ─────────────────────────────────────

    /**
     * Upserts a read-only reference dataset (LOTO points / work areas / locations) into
     * public.reference_snapshot so the PWA can fall back to Supabase when the hub is down. Keyed by
     * {@code key}; the whole dataset is stored as one jsonb payload. Service-role write (bypasses RLS).
     */
    public void upsertReferenceSnapshot(String key, Object payload, String contentHash) {
        requireEnabled();
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("payload", payload);
        row.put("content_hash", contentHash);
        row.put("updated_at", LocalDateTime.now(ZoneOffset.UTC).atOffset(ZoneOffset.UTC).toString());
        withRetry(() -> client.post()
                .uri("/rest/v1/reference_snapshot")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "resolution=merge-duplicates,return=minimal") // upsert on primary key
                .body(row)
                .retrieve()
                .toBodilessEntity());
    }

    // ── Metadata mirror ──────────────────────────────────────────────────────

    /**
     * Builds the {@code raw_user_meta_data} mirror for a hub User. Supabase stores these purely as a
     * mirror — it is NOT the source of truth for roles / isActive / permissionLevel.
     */
    public static Map<String, Object> metadataFor(User user) {
        Map<String, Object> md = new LinkedHashMap<>();
        putIfNotNull(md, "name", user.getName());
        putIfNotNull(md, "first_name", user.getFirstName());
        putIfNotNull(md, "last_name", user.getLastName());
        putIfNotNull(md, "email", user.getEmail());
        putIfNotNull(md, "phone", user.getPhone());
        putIfNotNull(md, "company", user.getCompany());
        md.put("roles", user.getRoles());
        md.put("is_active", Boolean.TRUE.equals(user.getIsActive()));
        putIfNotNull(md, "permission_level", user.getPermissionLevel());
        putIfNotNull(md, "hub_user_id", user.getId());
        putIfNotNull(md, "pwa_user_uuid", user.getPwaUserUuid());
        return md;
    }

    private static void putIfNotNull(Map<String, Object> m, String k, Object v) {
        if (v != null) m.put(k, v);
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private void requireEnabled() {
        if (!enabled) {
            throw new SupabaseUnavailableException("Supabase admin client is not configured", null);
        }
    }

    /** Runs a call, retrying twice on 5xx / connection errors with exponential backoff (250ms, 500ms). */
    private <T> T withRetry(Supplier<T> call) {
        RuntimeException lastTransient = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                return call.get();
            } catch (HttpClientErrorException e) {
                // 4xx — fail fast, no retry.
                throw new SupabaseClientException(e.getStatusCode().value(),
                        "Supabase 4xx: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            } catch (HttpServerErrorException | ResourceAccessException e) {
                lastTransient = e;
                if (attempt < 2) {
                    sleep(250L * (1L << attempt));
                }
            }
        }
        throw new SupabaseUnavailableException("Supabase unreachable after retries", lastTransient);
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    /** Parses a Postgres timestamptz (ISO-8601 with offset) into a UTC LocalDateTime. */
    static LocalDateTime parseTs(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return OffsetDateTime.parse(s).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(s);
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
