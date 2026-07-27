package com.dk_power.power_plant_java.sevice.messaging.plant;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatAck;
import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatMessage;
import com.dk_power.power_plant_java.entities.messaging.plant.PlantConversation;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantChatAckRepo;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantChatMessageRepo;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantConversationRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

/**
 * Hub-side audit poller for Plant Chat. Runs while the hub is up; polls Supabase for new
 * conversations, messages, and acks since the last mirrored row and writes them to H2 for the
 * hub search UI + long-term audit.
 *
 * <p>Design (Option C): chat is Supabase-authoritative. Neither desktops nor PWA read chat from
 * the hub — this mirror exists only for audit + admin search. See
 * {@code project/features/users/communication/plant-chat.md}.
 *
 * <p>Realtime vs polling: went with polling because
 * <ol>
 *   <li>audit doesn't need sub-second latency (30 s is fine),</li>
 *   <li>polling has no WebSocket state to keep alive or reconnect,</li>
 *   <li>zero new dependencies (uses the same Spring {@link RestClient} shape as
 *       {@code SupabaseAdminClient}),</li>
 *   <li>idempotent by {@code externalUuid}/Supabase row id, so repeat polls are safe.</li>
 * </ol>
 * If the audit ever needs to be real-time, swap in a Realtime WebSocket subscriber — the
 * downstream upsert methods are already idempotent.
 *
 * <p>Only runs on hub deployments AND when Supabase is configured — checked via {@link SyncConfig}.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "supabase.url")
public class PlantChatAuditPollingService {

    /** Poll everything as one page at a time. Chat volume is low; 500 is overkill and safe. */
    private static final int PAGE_SIZE = 500;
    /** Look back this far on cold start when H2 is empty (first ever poll). */
    private static final Duration COLD_START_BACKFILL = Duration.ofDays(30);

    private final SyncConfig syncConfig;
    private final PlantConversationRepo conversationRepo;
    private final PlantChatMessageRepo messageRepo;
    private final PlantChatAckRepo ackRepo;
    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;
    private final RestClient client;
    private final boolean enabled;

    public PlantChatAuditPollingService(
            SyncConfig syncConfig,
            PlantConversationRepo conversationRepo,
            PlantChatMessageRepo messageRepo,
            PlantChatAckRepo ackRepo,
            UserRepo userRepo,
            ObjectMapper objectMapper,
            @Value("${supabase.url:}") String url,
            @Value("${supabase.service.role.key:}") String serviceKey,
            @Value("${supabase.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${supabase.read-timeout-ms:8000}") int readTimeoutMs) {

        this.syncConfig = syncConfig;
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.ackRepo = ackRepo;
        this.userRepo = userRepo;
        this.objectMapper = objectMapper;

        String trimmedUrl = url == null ? "" : url.trim().replaceAll("/+$", "");
        String trimmedKey = serviceKey == null ? "" : serviceKey.trim();
        this.enabled = !trimmedUrl.isBlank() && !trimmedKey.isBlank();

        java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.client = RestClient.builder()
                .baseUrl(trimmedUrl.isBlank() ? "http://localhost:0" : trimmedUrl)
                .requestFactory(factory)
                .defaultHeader("apikey", trimmedKey)
                .defaultHeader("Authorization", "Bearer " + trimmedKey)
                .build();
    }

    @PostConstruct
    void logStartup() {
        if (!enabled) {
            log.info("[PlantChatAudit] Disabled (supabase.url or service role key not set).");
        } else {
            log.info("[PlantChatAudit] Enabled — will poll every 30s while hub is up.");
        }
    }

    /**
     * Run every 30 s while hub is up. Order matters: conversations → messages → acks so
     * FK-like references stay resolvable in H2 even without formal foreign keys.
     */
    @Scheduled(fixedDelayString = "${plant-chat.audit.interval-ms:30000}",
               initialDelayString = "${plant-chat.audit.initial-delay-ms:15000}")
    public void poll() {
        pollOnce();
    }

    /**
     * Trigger a poll cycle out-of-band. Called by the admin controller right after a
     * SupabaseAdminClient write (create/rename/archive conversation) so the H2 mirror — and the
     * admin UI reading from it — reflects the change immediately instead of waiting up to 30 s for
     * the next scheduled tick.
     *
     * <p>Safe to call anywhere: honours the same enabled/hub-mode gates as the scheduled path and
     * uses the same idempotent-by-supabase-id upsert logic.
     */
    public void pollOnce() {
        if (!enabled) return;
        if (!syncConfig.isHubMode()) return;
        try {
            int convs = pollConversations();
            int msgs = pollMessages();
            int acks = pollAcks();
            if (convs + msgs + acks > 0) {
                log.info("[PlantChatAudit] Mirrored: conversations={} messages={} acks={}", convs, msgs, acks);
            }
        } catch (Exception e) {
            // Never propagate — the poller is best-effort. Log and try again next tick.
            log.warn("[PlantChatAudit] Poll cycle failed: {}", e.getMessage());
        }
    }

    // ── Conversations ───────────────────────────────────────────────────────

    private int pollConversations() {
        // Conversations are small in number (a handful per plant). Walk them all and upsert;
        // the change-detection short-circuit inside upsertConversation makes repeat polls cheap.
        String path = "/rest/v1/plant_conversation?select=*&order=updated_at.asc&limit=" + PAGE_SIZE;
        JsonNode rows = get(path);
        int mirrored = 0;
        for (JsonNode row : rows) {
            if (upsertConversation(row)) mirrored++;
        }
        return mirrored;
    }

    @Transactional
    protected boolean upsertConversation(JsonNode row) {
        String supabaseId = asText(row, "id");
        if (supabaseId == null) return false;

        PlantConversation existing = conversationRepo.findFirstBySupabaseId(supabaseId).orElse(null);
        LocalDateTime supUpdated = parseTimestamp(asText(row, "updated_at"));
        if (existing != null && supUpdated != null && supUpdated.equals(existing.getUpdatedAtSupabase())) {
            return false; // unchanged
        }

        PlantConversation c = existing != null ? existing : PlantConversation.builder()
                .supabaseId(supabaseId)
                .build();
        c.setName(asText(row, "name"));
        c.setDescription(asText(row, "description"));
        c.setEntityType(asText(row, "entity_type"));
        c.setEntityId(asLong(row, "entity_id"));
        Boolean editable = asBool(row, "is_editable");
        c.setIsEditable(editable != null ? editable : Boolean.FALSE);
        String creator = asText(row, "created_by");
        c.setCreatedBySupabaseUuid(creator);
        c.setCreatedByHubUserId(resolveHubUserId(creator));
        c.setCreatedAtSupabase(parseTimestamp(asText(row, "created_at")));
        c.setUpdatedAtSupabase(supUpdated);
        c.setArchivedAtSupabase(parseTimestamp(asText(row, "archived_at")));
        conversationRepo.save(c);
        return true;
    }

    // ── Messages ────────────────────────────────────────────────────────────

    private int pollMessages() {
        LocalDateTime cp = maxOr(messageRepo::maxSentAtSupabase);
        String path = "/rest/v1/plant_chat_message"
                + "?select=*&order=sent_at.asc&limit=" + PAGE_SIZE
                + "&sent_at=gt." + urlIso(cp);
        JsonNode rows = get(path);
        int mirrored = 0;
        for (JsonNode row : rows) {
            if (upsertMessage(row)) mirrored++;
        }
        return mirrored;
    }

    @Transactional
    protected boolean upsertMessage(JsonNode row) {
        String supabaseId = asText(row, "id");
        if (supabaseId == null) return false;
        if (messageRepo.findFirstBySupabaseId(supabaseId).isPresent()) return false;

        String sender = asText(row, "sender_id");
        PlantChatMessage m = PlantChatMessage.builder()
                .supabaseId(supabaseId)
                .conversationSupabaseId(asText(row, "conversation_id"))
                .senderSupabaseUuid(sender)
                .senderHubUserId(resolveHubUserId(sender))
                .senderDisplayName(asText(row, "sender_display_name"))
                .content(asText(row, "content"))
                .isImportant(orFalse(asBool(row, "is_important")))
                .requiresAck(orFalse(asBool(row, "requires_ack")))
                .sentAtSupabase(parseTimestamp(asText(row, "sent_at")))
                .editedAtSupabase(parseTimestamp(asText(row, "edited_at")))
                .deletedAtSupabase(parseTimestamp(asText(row, "deleted_at")))
                .build();
        messageRepo.save(m);
        return true;
    }

    // ── Acks ────────────────────────────────────────────────────────────────

    private int pollAcks() {
        LocalDateTime cp = maxOr(ackRepo::maxAckedAtSupabase);
        String path = "/rest/v1/plant_chat_ack"
                + "?select=*&order=acked_at.asc&limit=" + PAGE_SIZE
                + "&acked_at=gt." + urlIso(cp);
        JsonNode rows = get(path);
        int mirrored = 0;
        for (JsonNode row : rows) {
            if (upsertAck(row)) mirrored++;
        }
        return mirrored;
    }

    @Transactional
    protected boolean upsertAck(JsonNode row) {
        String messageId = asText(row, "message_id");
        String userUuid = asText(row, "user_id");
        if (messageId == null || userUuid == null) return false;
        String externalUuid = messageId + "|" + userUuid;
        if (ackRepo.findFirstByExternalUuid(externalUuid).isPresent()) return false;

        PlantChatAck a = PlantChatAck.builder()
                .externalUuid(externalUuid)
                .messageSupabaseId(messageId)
                .userSupabaseUuid(userUuid)
                .userHubUserId(resolveHubUserId(userUuid))
                .ackedAtSupabase(parseTimestamp(asText(row, "acked_at")))
                .build();
        ackRepo.save(a);
        return true;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** Resolve a Supabase user UUID to a hub {@code User.id}, or null if there is no link yet. */
    private Long resolveHubUserId(String supabaseUuid) {
        if (supabaseUuid == null) return null;
        User u = userRepo.findFirstBySupabaseUuidOrderByIdAsc(supabaseUuid);
        return u != null ? u.getId() : null;
    }

    private JsonNode get(String path) {
        String body = client.get()
                .uri(path)
                .header("Accept", "application/json")
                .retrieve()
                .body(String.class);
        if (body == null || body.isBlank()) return objectMapper.createArrayNode();
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            log.warn("[PlantChatAudit] Non-JSON body from {}: {}", path, e.getMessage());
            return objectMapper.createArrayNode();
        }
    }

    /** Look up the max timestamp in H2; fall back to a wide cold-start window when empty. */
    private LocalDateTime maxOr(java.util.function.Supplier<LocalDateTime> maxLookup) {
        LocalDateTime m = maxLookup.get();
        return m != null ? m : LocalDateTime.now(ZoneOffset.UTC).minus(COLD_START_BACKFILL);
    }

    private static String urlIso(LocalDateTime t) {
        // PostgREST expects `?col=gt.<iso>` — URL-safe ISO with offset for unambiguous compare.
        return OffsetDateTime.of(t, ZoneOffset.UTC).toString().replace("+", "%2B");
    }

    private static LocalDateTime parseTimestamp(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return OffsetDateTime.parse(iso).atZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(iso);
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private static String asText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText(null);
    }

    private static Long asLong(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asLong();
    }

    private static Boolean asBool(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asBoolean();
    }

    private static boolean orFalse(Boolean b) {
        return b != null && b;
    }
}
