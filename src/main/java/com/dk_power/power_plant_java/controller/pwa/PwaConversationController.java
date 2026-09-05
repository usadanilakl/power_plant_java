package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.messaging.ConversationDto;
import com.dk_power.power_plant_java.dto.messaging.MessageDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgConversationService;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgMessageService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/secured/conversations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaConversationController {

    private final NgConversationService conversationService;
    private final NgMessageService messageService;
    private final UserRepo userRepo;
    private final WorkRequestRepo workRequestRepo;

    @GetMapping("/my")
    public ResponseEntity<?> getMyConversations() {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            List<ConversationDto> conversations = conversationService.getMyConversations();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(conversations, "Conversations retrieved"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get conversations for user {}", user.getEmail(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            // PWA: verify user is participant (initiator or responder) — not just any authenticated user
            if (!conversationService.canAccessForPwa(id, user.getId())) {
                return ResponseEntity.status(403).body(new NgApiResponse<>(null, "Access denied"));
            }
            List<MessageDto> messages = messageService.getMessagesForConversation(id);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(messages, "Messages retrieved"));
        } catch (IllegalArgumentException e) {
            log.warn("[PWA Conversations] Access denied for user {} to conversation {}", user.getEmail(), id);
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get messages for conversation {}", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/start")
    public ResponseEntity<?> startConversation(@RequestBody ConversationDto dto) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            // PWA: verify user owns the entity they're starting a conversation about
            if ("WorkRequest".equals(dto.getEntityType()) && dto.getEntityId() != null) {
                WorkRequest wr = workRequestRepo.findById(dto.getEntityId()).orElse(null);
                if (wr == null || !user.getEmail().equalsIgnoreCase(wr.getSubmitterEmail())) {
                    return ResponseEntity.status(403).body(new NgApiResponse<>(null, "Access denied"));
                }
            }

            ConversationDto created = conversationService.startConversation(dto);
            log.info("[PWA Conversations] User {} started conversation: {}", user.getEmail(), created.getSubject());
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Conversation started"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to start conversation", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<?> sendMessage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            if (!conversationService.canAccessForPwa(id, user.getId())) {
                return ResponseEntity.status(403).body(new NgApiResponse<>(null, "Access denied"));
            }

            String content = body.get("content");
            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "content is required"));
            }

            MessageDto dto = new MessageDto();
            dto.setConversationId(id);
            dto.setContent(content);

            MessageDto sent = messageService.sendMessage(dto);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(sent, "Message sent"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to send message to conversation {}", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/mark-read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            if (!conversationService.canAccessForPwa(id, user.getId())) {
                return ResponseEntity.status(403).body(new NgApiResponse<>(null, "Access denied"));
            }
            conversationService.markRead(id);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Marked as read"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to mark conversation {} as read", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            List<ConversationDto> conversations = conversationService.getMyConversations();
            int total = conversations.stream()
                .mapToInt(c -> c.getCurrentUserUnreadCount() != null ? c.getCurrentUserUnreadCount() : 0)
                .sum();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(total, "Unread count retrieved"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get unread count", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/for-entity/{entityType}/{entityId}")
    public ResponseEntity<?> getForEntity(@PathVariable String entityType, @PathVariable Long entityId) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            // PWA: only return conversations where THIS user is initiator or responder
            // (not open conversations visible to all operators — those are desktop-only)
            // WO Q&A threads are INCLUSIVE (visible to everyone who can see the WO); WR/other threads stay STRICT
            // (participant-only) to prevent cross-contractor enumeration.
            List<ConversationDto> conversations =
                NgConversationService.WORK_ORDER_ENTITY_TYPE.equals(entityType)
                    ? conversationService.getConversationsForEntityInclusiveUser(entityType, entityId, user.getId())
                    : conversationService.getConversationsForEntityStrictUser(entityType, entityId, user.getId());
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(conversations, "Conversations retrieved"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get conversations for {} #{}", entityType, entityId, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Start a conversation about a Work Request using sharepointId (which the PWA has).
     * Server resolves the WR entity ID. No specific responder — any operator can see and reply.
     */
    /** Active users {id, name} for the WO Q&A directed-recipients picker (plant-accessible). */
    @GetMapping("/directable-users")
    public ResponseEntity<?> getDirectableUsers() {
        User user = getCurrentUser();
        if (user == null) return unauthorized();
        try {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(conversationService.getDirectableUsers(), "Directable users retrieved"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get directable users", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** The WO Q&A inbox: all OPEN Maximo-WO conversations (inclusive), newest first, each flagged directedToMe. */
    @GetMapping("/wo-open")
    public ResponseEntity<?> getOpenWorkOrderQuestions() {
        User user = getCurrentUser();
        if (user == null) return unauthorized();
        try {
            List<ConversationDto> list = conversationService.getOpenWorkOrderQuestions(user.getId());
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(list, "Open WO questions retrieved"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to get open WO questions", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/start-from-wr")
    public ResponseEntity<?> startConversationFromWorkRequest(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return unauthorized();

        try {
            String sharepointId = body.get("sharepointId");
            String message = body.get("message");
            String subject = body.get("subject");

            if (sharepointId == null || sharepointId.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "sharepointId is required"));
            }
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "message is required"));
            }

            WorkRequest wr = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId).orElse(null);
            if (wr == null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Work Request not found for sharepointId: " + sharepointId));
            }
            if (!user.getEmail().equalsIgnoreCase(wr.getSubmitterEmail())) {
                return ResponseEntity.status(403).body(new NgApiResponse<>(null, "Access denied"));
            }

            ConversationDto dto = new ConversationDto();
            dto.setEntityType("WorkRequest");
            dto.setEntityId(wr.getId());
            // responderId left null — open conversation, visible to all operators
            dto.setSubject(subject != null && !subject.isBlank() ? subject.trim() : "RE: WR " + (wr.getPermitNumber() != null ? wr.getPermitNumber() : sharepointId));
            dto.setInitialMessageContent(message.trim());

            ConversationDto created = conversationService.startConversation(dto);
            log.info("[PWA Conversations] User {} started WR conversation (sharepointId={})", user.getEmail(), sharepointId);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Conversation started"));
        } catch (Exception e) {
            log.error("[PWA Conversations] Failed to start WR conversation", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
    }
}
