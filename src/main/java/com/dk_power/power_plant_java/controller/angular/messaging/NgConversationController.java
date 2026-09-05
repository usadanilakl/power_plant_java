package com.dk_power.power_plant_java.controller.angular.messaging;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.messaging.ConversationDto;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/conversations")
@RequiredArgsConstructor
@Slf4j
public class NgConversationController {

    private final NgConversationService service;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<List<ConversationDto>>> getForEntity(
        @PathVariable String entityType,
        @PathVariable Long entityId
    ) {
        try {
            List<ConversationDto> dtos = service.getConversationsForEntity(entityType, entityId);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dtos, "Conversations retrieved successfully"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to get conversations for {} #{}", entityType, entityId, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<NgApiResponse<List<ConversationDto>>> getMyConversations() {
        try {
            List<ConversationDto> dtos = service.getMyConversations();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dtos, "My conversations retrieved successfully"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to get current user's conversations", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Active users {id, name} for the WO Q&A directed-recipients picker (plant-accessible). */
    @GetMapping("/directable-users")
    public ResponseEntity<NgApiResponse<List<java.util.Map<String, Object>>>> getDirectableUsers() {
        try {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(service.getDirectableUsers(), "Directable users retrieved"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to get directable users", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** The WO Q&A inbox: all OPEN Maximo-WO conversations (inclusive), newest first, each flagged directedToMe. */
    @GetMapping("/wo-open")
    public ResponseEntity<NgApiResponse<List<ConversationDto>>> getOpenWorkOrderQuestions() {
        try {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(service.getOpenWorkOrderQuestions(), "Open WO questions retrieved"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to get open WO questions", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<ConversationDto>> startConversation(@RequestBody ConversationDto dto) {
        try {
            ConversationDto created = service.startConversation(dto);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Conversation started successfully", LocalDateTime.now()));
        } catch (Exception e) {
            log.error("[Conversation] Failed to start conversation", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/mark-read")
    public ResponseEntity<NgApiResponse<Void>> markRead(@PathVariable Long id) {
        try {
            service.markRead(id);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Conversation marked as read"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to mark conversation {} as read", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<NgApiResponse<ConversationDto>> closeConversation(@PathVariable Long id) {
        try {
            ConversationDto dto = service.closeConversation(id);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Conversation closed"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to close conversation {}", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteConversation(@PathVariable Long id) {
        try {
            service.softDeleteConversation(id);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Conversation deleted"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to delete conversation {}", id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{entityType}/{entityId}/unread-count")
    public ResponseEntity<NgApiResponse<Long>> getUnreadCount(
        @PathVariable String entityType,
        @PathVariable Long entityId
    ) {
        try {
            long count = service.getUnreadCountForEntity(entityType, entityId);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(count, "Unread count retrieved successfully"));
        } catch (Exception e) {
            log.error("[Conversation] Failed to get unread count for {} #{}", entityType, entityId, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<ConversationDto>>> search(
        @RequestBody SearchCriteria criteria,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int pageSize
    ) {
        try {
            Page<ConversationDto> results = service.searchConversations(criteria, page, pageSize);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(results, "Search completed successfully"));
        } catch (SecurityException e) {
            log.warn("[Conversation] Unauthorized search attempt", e);
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[Conversation] Search failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
