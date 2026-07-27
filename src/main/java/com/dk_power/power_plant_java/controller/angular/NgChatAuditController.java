package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient;
import com.dk_power.power_plant_java.sevice.messaging.plant.PlantChatAuditPollingService;
import com.dk_power.power_plant_java.sevice.messaging.plant.PlantChatAuditService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import org.springframework.beans.factory.ObjectProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Admin-only browse/search over the hub-local Plant Chat audit mirror + Supabase-backed CRUD for
 * conversations (create/rename/archive). Reads are fast (they hit H2); writes go through
 * {@link SupabaseAdminClient} and are picked up by the audit poller within the next 30 s.
 *
 * <p>Locked down via URL matcher in {@code SecurityConfigSpring} (see the {@code /ng/chat-audit/**}
 * rule added alongside this controller). See
 * {@code project/features/users/communication/plant-chat.md}.
 */
@RestController
@RequestMapping("/ng/chat-audit")
@RequiredArgsConstructor
@Slf4j
public class NgChatAuditController {

    private final PlantChatAuditService auditService;
    private final SupabaseAdminClient supabase;
    private final UserRepo userRepo;
    /**
     * Optional — {@code PlantChatAuditPollingService} is {@code @ConditionalOnProperty("supabase.url")}
     * so a hub without Supabase configured doesn't have this bean. Post-write "poll now" is a no-op
     * in that case (which is correct — nothing to sync from).
     */
    private final ObjectProvider<PlantChatAuditPollingService> pollerProvider;

    /** Poll the audit mirror synchronously so the follow-up read reflects the write we just made. */
    private void refreshMirrorNow() {
        PlantChatAuditPollingService poller = pollerProvider.getIfAvailable();
        if (poller != null) poller.pollOnce();
    }

    // ── Read (audit / search) ──────────────────────────────────────────────

    @GetMapping("/conversations")
    public ResponseEntity<NgApiResponse<List<PlantChatAuditService.ConversationView>>> conversations(
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(new NgApiResponse<>(
                auditService.listConversations(includeArchived), "Conversations listed"));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<NgApiResponse<Page<PlantChatAuditService.MessageView>>> search(
            @RequestParam(required = false) String conversationId,
            @RequestParam(required = false) String senderUuid,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<PlantChatAuditService.MessageView> results = auditService.search(
                conversationId, senderUuid, from, to, q, page, pageSize);
        return ResponseEntity.ok(new NgApiResponse<>(results, "Search complete"));
    }

    @GetMapping("/messages/{supabaseId}/acks")
    public ResponseEntity<NgApiResponse<List<PlantChatAuditService.AckView>>> acks(
            @PathVariable String supabaseId) {
        return ResponseEntity.ok(new NgApiResponse<>(
                auditService.acksFor(supabaseId), "Acks retrieved"));
    }

    // ── Write (admin CRUD via SupabaseAdminClient) ─────────────────────────

    public record CreateConversationRequest(
            String name, String description, Boolean isEditable, String entityType, Long entityId) {}

    @PostMapping("/conversations")
    public ResponseEntity<NgApiResponse<Map<String, String>>> createConversation(
            @RequestBody CreateConversationRequest request) {
        try {
            User me = currentHubUser();
            if (me == null || me.getSupabaseUuid() == null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null,
                        "Cannot create — signed-in admin has no linked Supabase user."));
            }
            if (request.name() == null || request.name().isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Name is required"));
            }
            String id = supabase.createPlantConversation(
                    request.name().trim(),
                    request.description(),
                    me.getSupabaseUuid(),
                    request.isEditable(),
                    request.entityType(),
                    request.entityId());
            refreshMirrorNow();
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("id", id != null ? id : ""), "Conversation created"));
        } catch (Exception e) {
            log.error("[ChatAudit] Create conversation failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    public record UpdateConversationRequest(String name, String description, Boolean isEditable) {}

    @PatchMapping("/conversations/{id}")
    public ResponseEntity<NgApiResponse<Void>> updateConversation(
            @PathVariable String id, @RequestBody UpdateConversationRequest request) {
        try {
            supabase.updatePlantConversation(id, request.name(), request.description(), request.isEditable());
            refreshMirrorNow();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Conversation updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/archive")
    public ResponseEntity<NgApiResponse<Void>> archiveConversation(@PathVariable String id) {
        try {
            supabase.archivePlantConversation(id);
            refreshMirrorNow();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Conversation archived"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/unarchive")
    public ResponseEntity<NgApiResponse<Void>> unarchiveConversation(@PathVariable String id) {
        try {
            supabase.unarchivePlantConversation(id);
            refreshMirrorNow();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Conversation unarchived"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private User currentHubUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            return userRepo.findById(cud.getId()).orElse(null);
        }
        String name = auth.getName();
        if (name == null) return null;
        User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
        return u != null ? u : userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
    }
}
