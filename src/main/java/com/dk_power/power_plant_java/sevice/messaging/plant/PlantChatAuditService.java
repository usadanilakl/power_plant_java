package com.dk_power.power_plant_java.sevice.messaging.plant;

import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatAck;
import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatMessage;
import com.dk_power.power_plant_java.entities.messaging.plant.PlantConversation;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantChatAckRepo;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantChatMessageRepo;
import com.dk_power.power_plant_java.repository.messaging.plant.PlantConversationRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Read-only queries over the hub-local audit mirror of Plant Chat. Powers the admin search UI at
 * {@code /admin/chat-audit}. See {@code project/features/users/communication/plant-chat.md}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlantChatAuditService {

    private final PlantConversationRepo conversationRepo;
    private final PlantChatMessageRepo messageRepo;
    private final PlantChatAckRepo ackRepo;
    private final UserRepo userRepo;

    public List<ConversationView> listConversations(boolean includeArchived) {
        List<PlantConversation> rows = conversationRepo.findAll();
        List<ConversationView> out = new ArrayList<>();
        for (PlantConversation c : rows) {
            if (!includeArchived && c.getArchivedAtSupabase() != null) continue;
            out.add(toConversationView(c));
        }
        out.sort(Comparator.comparing((ConversationView v) -> v.name == null ? "" : v.name.toLowerCase()));
        return out;
    }

    public Page<MessageView> search(String conversationSupabaseId, String senderSupabaseUuid,
                                    LocalDateTime from, LocalDateTime to, String q,
                                    int page, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(200, Math.max(1, pageSize)));
        String qClean = (q != null && !q.isBlank()) ? q.trim() : null;
        Page<PlantChatMessage> hits = messageRepo.search(
                blankToNull(conversationSupabaseId),
                blankToNull(senderSupabaseUuid),
                from, to, qClean, pageable);
        return hits.map(this::toMessageView);
    }

    public List<AckView> acksFor(String messageSupabaseId) {
        // Not paginated — an "acks for a message" list is short (≤ number of plant users).
        // Repo has no scalar query for this; walk the small filtered set via findAll + filter.
        return ackRepo.findAll().stream()
                .filter(a -> messageSupabaseId.equals(a.getMessageSupabaseId()))
                .sorted(Comparator.comparing(PlantChatAck::getAckedAtSupabase))
                .map(this::toAckView)
                .toList();
    }

    // ── View DTOs (public wire shape) ─────────────────────────────────────

    public static class ConversationView {
        public Long id;
        public String supabaseId;
        public String name;
        public String description;
        public String entityType;
        public Long entityId;
        public Boolean isEditable;
        public String createdBySupabaseUuid;
        public String createdByName;   // resolved from hub User when possible
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public LocalDateTime archivedAt;
    }

    public static class MessageView {
        public Long id;
        public String supabaseId;
        public String conversationSupabaseId;
        public String senderSupabaseUuid;
        public String senderDisplayName;
        public Long senderHubUserId;
        public String senderEmail;
        public String content;
        public Boolean isImportant;
        public Boolean requiresAck;
        public LocalDateTime sentAt;
        public LocalDateTime editedAt;
        public LocalDateTime deletedAt;
        public long ackCount;
    }

    public static class AckView {
        public String messageSupabaseId;
        public String userSupabaseUuid;
        public Long userHubUserId;
        public String userName;
        public String userEmail;
        public LocalDateTime ackedAt;
    }

    private ConversationView toConversationView(PlantConversation c) {
        ConversationView v = new ConversationView();
        v.id = c.getId();
        v.supabaseId = c.getSupabaseId();
        v.name = c.getName();
        v.description = c.getDescription();
        v.entityType = c.getEntityType();
        v.entityId = c.getEntityId();
        v.isEditable = c.getIsEditable();
        v.createdBySupabaseUuid = c.getCreatedBySupabaseUuid();
        v.createdAt = c.getCreatedAtSupabase();
        v.updatedAt = c.getUpdatedAtSupabase();
        v.archivedAt = c.getArchivedAtSupabase();
        if (c.getCreatedByHubUserId() != null) {
            userRepo.findById(c.getCreatedByHubUserId()).ifPresent(u -> v.createdByName = u.getName());
        }
        return v;
    }

    private MessageView toMessageView(PlantChatMessage m) {
        MessageView v = new MessageView();
        v.id = m.getId();
        v.supabaseId = m.getSupabaseId();
        v.conversationSupabaseId = m.getConversationSupabaseId();
        v.senderSupabaseUuid = m.getSenderSupabaseUuid();
        v.senderDisplayName = m.getSenderDisplayName();
        v.senderHubUserId = m.getSenderHubUserId();
        v.content = m.getContent();
        v.isImportant = m.getIsImportant();
        v.requiresAck = m.getRequiresAck();
        v.sentAt = m.getSentAtSupabase();
        v.editedAt = m.getEditedAtSupabase();
        v.deletedAt = m.getDeletedAtSupabase();
        v.ackCount = ackRepo.countByMessageSupabaseId(m.getSupabaseId());
        if (m.getSenderHubUserId() != null) {
            userRepo.findById(m.getSenderHubUserId()).ifPresent(u -> v.senderEmail = u.getEmail());
        }
        return v;
    }

    private AckView toAckView(PlantChatAck a) {
        AckView v = new AckView();
        v.messageSupabaseId = a.getMessageSupabaseId();
        v.userSupabaseUuid = a.getUserSupabaseUuid();
        v.userHubUserId = a.getUserHubUserId();
        v.ackedAt = a.getAckedAtSupabase();
        if (a.getUserHubUserId() != null) {
            userRepo.findById(a.getUserHubUserId()).ifPresent(u -> {
                v.userName = u.getName();
                v.userEmail = u.getEmail();
            });
        }
        return v;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
