package com.dk_power.power_plant_java.sevice.angular.messaging;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.messaging.ConversationDto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.messaging.ConversationMapper;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoQaWorklogService;
import com.dk_power.power_plant_java.sevice.messaging.MessagingUserContextService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class NgConversationService implements NgCrudService<Conversation, ConversationDto, ConversationRepo, ConversationMapper> {

    private final ConversationRepo repo;
    private final MessageRepo messageRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ConversationMapper mapper;
    private final MessagingUserContextService messagingUserContextService;
    private final com.dk_power.power_plant_java.repository.users.UserRepo userRepo;
    private final EmailFacadeService emailFacade;
    /** Optional — present only on Maximo-configured nodes; plain WR/JHA messaging works without it. */
    private final ObjectProvider<MaximoQaWorklogService> qaWorklog;

    /** Canonical entityType for a WO-scoped Q&A conversation (mirrors 'WorkRequest'). */
    public static final String WORK_ORDER_ENTITY_TYPE = "MaximoWorkOrder";

    /**
     * Active users {id, name} for the WO Q&A directed-recipients picker. Deliberately a plant-accessible list
     * (the /ng/users controller is admin-only): directing a question is a routing hint any operator can use.
     */
    public List<java.util.Map<String, Object>> getDirectableUsers() {
        return userRepo.findByIsActiveTrue().stream()
            .map(u -> {
                String name = (u.getName() != null && !u.getName().isBlank()) ? u.getName()
                    : ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
                if (name == null || name.isBlank()) name = (u.getEmail() != null && !u.getEmail().isBlank()) ? u.getEmail() : u.getUsername();
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("name", name);
                return m;
            })
            .sorted((a, b) -> String.valueOf(a.get("name")).compareToIgnoreCase(String.valueOf(b.get("name"))))
            .toList();
    }

    @Override
    public ConversationRepo getRepo() {
        return repo;
    }

    @Override
    public ConversationMapper getMapper() {
        return mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ConversationDto getDto() {
        return new ConversationDto();
    }

    @Override
    public Conversation getEntity() {
        return new Conversation();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<Conversation> getEntityClass() {
        return Conversation.class;
    }

    @Override
    public ConversationDto toDto(Conversation entity) {
        return mapper.convertToDto(entity);
    }

    @Override
    public Conversation toEntity(ConversationDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public List<String> getGlobalSearchColumns() {
        return List.of("entityType", "subject", "status");
    }

    public List<ConversationDto> getConversationsForEntity(String entityType, Long entityId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        return repo.findVisibleByEntityAndUserOrderByLastMessageAtDesc(entityType, entityId, currentUserId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Strict version for PWA: only conversations where user is initiator or responder.
     * Does NOT include open conversations (responderId IS NULL) to prevent cross-contractor access.
     */
    public List<ConversationDto> getConversationsForEntityStrictUser(String entityType, Long entityId, Long userId) {
        return repo.findByEntityAndParticipantOrderByLastMessageAtDesc(entityType, entityId, userId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Inclusive list with an explicit user id (initiator OR responder OR open/responderId IS NULL). Used by the PWA
     * for WO Q&A threads so open questions are visible to everyone who can see the WO — the exact opposite of the
     * strict method used for WR threads. (For an OPEN thread the userId is immaterial; the null-wildcard matches.)
     */
    public List<ConversationDto> getConversationsForEntityInclusiveUser(String entityType, Long entityId, Long userId) {
        return repo.findVisibleByEntityAndUserOrderByLastMessageAtDesc(entityType, entityId, userId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Strict participant check for PWA: user must be initiator or responder (not open wildcard).
     */
    public boolean isUserParticipant(Long conversationId, Long userId) {
        return repo.isUserParticipant(conversationId, userId);
    }

    /**
     * PWA access gate: a strict participant for any thread, PLUS anyone for a WO Q&A OPEN thread (inclusive by
     * design — everyone who can see the work order can read and reply). WR/other open threads stay participant-only
     * on the PWA to prevent cross-contractor enumeration.
     */
    public boolean canAccessForPwa(Long conversationId, Long userId) {
        if (repo.isUserParticipant(conversationId, userId)) return true;
        return repo.findById(conversationId)
            .map(c -> WORK_ORDER_ENTITY_TYPE.equals(c.getEntityType()) && c.getResponderId() == null)
            .orElse(false);
    }

    public List<ConversationDto> getMyConversations() {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        return repo.findVisibleByUserOrderByLastMessageAtDesc(currentUserId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * The WO Q&A inbox: every OPEN conversation anchored to a Maximo WO (inclusive — visible to all operators),
     * newest activity first. Each DTO is flagged {@code directedToMe} so the client can surface questions aimed at
     * the signed-in user first. A cheap local query over the already-synced Conversation table — never hits Maximo.
     */
    public List<ConversationDto> getOpenWorkOrderQuestions() {
        return getOpenWorkOrderQuestions(messagingUserContextService.getCurrentUserIdRequired());
    }

    /** Inbox with an explicit current-user id (the PWA passes its resolved id rather than relying on context). */
    public List<ConversationDto> getOpenWorkOrderQuestions(Long me) {
        return repo.findByEntityTypeAndStatusOrderByLastMessageAtDesc(WORK_ORDER_ENTITY_TYPE, Conversation.Status.OPEN)
            .stream()
            .map(c -> {
                ConversationDto d = mapper.convertToDto(c);
                d.setDirectedToMe(isDirectedTo(c.getDirectedUserIds(), me));
                return d;
            })
            .toList();
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /** True when {@code userId} appears in the comma-joined directed-user-id list. */
    private static boolean isDirectedTo(String directedCsv, Long userId) {
        if (directedCsv == null || directedCsv.isBlank() || userId == null) return false;
        String target = userId.toString();
        for (String part : directedCsv.split(",")) {
            if (part.trim().equals(target)) return true;
        }
        return false;
    }

    public ConversationDto startConversation(ConversationDto dto) {
        User initiator = messagingUserContextService.getCurrentUserRequired();
        validateStartConversation(dto);

        LocalDateTime now = LocalDateTime.now();

        Conversation conversation = new Conversation();
        conversation.setEntityType(dto.getEntityType().trim());
        conversation.setEntityId(dto.getEntityId());
        conversation.setInitiatorId(initiator.getId());
        conversation.setResponderId(dto.getResponderId()); // nullable — open conversation
        conversation.setSubject(dto.getSubject().trim());
        conversation.setStatus(Conversation.Status.OPEN);
        conversation.setLastMessageAt(now);
        conversation.setInitiatorUnreadCount(0);
        conversation.setResponderUnreadCount(dto.getResponderId() == null ? 0 : 1);
        // WO Q&A extension — null for every non-WO thread, so no behavior change to WR conversations.
        conversation.setMaximoWonum(blankToNull(dto.getMaximoWonum()));
        conversation.setMaximoHref(blankToNull(dto.getMaximoHref()));
        conversation.setDirectedUserIds(blankToNull(dto.getDirectedUserIds()));
        Conversation savedConversation = repo.save(conversation);

        Message firstMessage = new Message();
        firstMessage.setConversation(savedConversation);
        firstMessage.setSenderId(initiator.getId());
        firstMessage.setContent(dto.getInitialMessageContent().trim());
        firstMessage.setSentAt(now);
        firstMessage.setIsRead(false);
        Message savedMessage = messageRepo.save(firstMessage);

        // WO-thread side effects run AFTER commit (once), so nothing fires for a rolled-back conversation and the DB
        // transaction isn't held open during the external calls.
        if (WORK_ORDER_ENTITY_TYPE.equals(savedConversation.getEntityType())) {
            final String msg = dto.getInitialMessageContent().trim();
            final Long authorId = initiator.getId();
            final Long messageId = savedMessage.getId();
            // 1. Mirror the question to the WO's Maximo worklog (system of record) — best-effort.
            runAfterCommit(() -> qaWorklog.ifAvailable(s -> s.writeQuestion(savedConversation, authorId, msg, messageId)));
            // 2. Active push: email the directed recipients (routing hint), so it reaches them even outside the app.
            if (savedConversation.getDirectedUserIds() != null && !savedConversation.getDirectedUserIds().isBlank()) {
                runAfterCommit(() -> notifyDirected(savedConversation, msg));
            }
        }

        return mapper.convertToDto(savedConversation);
    }

    /** Run {@code r} after the current transaction commits (once); or immediately if no transaction is active. */
    static void runAfterCommit(Runnable r) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override public void afterCommit() { r.run(); }
                });
        } else {
            r.run();
        }
    }

    /** Best-effort email nudge to the directed recipients of a WO question (a routing hint — the thread stays public). */
    private void notifyDirected(Conversation c, String message) {
        try {
            List<Long> ids = parseDirectedIds(c.getDirectedUserIds());
            if (ids.isEmpty()) return;
            List<String> emails = userRepo.findAllById(ids).stream()
                .map(User::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .distinct()
                .toList();
            if (emails.isEmpty()) return;
            String wo = (c.getMaximoWonum() != null && !c.getMaximoWonum().isBlank()) ? c.getMaximoWonum() : ("WO #" + c.getEntityId());
            String subject = "You were asked about " + wo + ": " + c.getSubject();
            String body = "A question was directed to you on work order " + wo + ".\n\n"
                + "Subject: " + c.getSubject() + "\n"
                + "Question: " + message + "\n\n"
                + "Open the plant app → Maximo → WO Questions to read and answer. "
                + "Everyone who can see the work order can also see and answer this thread.";
            emailFacade.sendEmail(EmailRequest.builder()
                .to(String.join(",", emails))
                .subject(subject)
                .body(body)
                .build());
            log.info("[Conversation] Directed-question nudge emailed to {} recipient(s) for {}", emails.size(), wo);
        } catch (Exception e) {
            log.warn("[Conversation] Directed-question email notify failed: {}", e.getMessage());
        }
    }

    /** Parse the comma-joined directed-user-id string to a list of Longs (bad tokens skipped). */
    private static List<Long> parseDirectedIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        List<Long> out = new java.util.ArrayList<>();
        for (String part : csv.split(",")) {
            String t = part.trim();
            if (t.isEmpty()) continue;
            try { out.add(Long.valueOf(t)); } catch (NumberFormatException ignore) { /* skip */ }
        }
        return out;
    }

    public void markRead(Long conversationId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        Conversation conversation = getAccessibleConversation(conversationId, currentUserId);
        // Managed saves (not a bulk JPQL UPDATE) so each isRead flip fires @PostUpdate and emits
        // a FieldChange — read receipts then converge across the user's devices instead of
        // silently diverging. Only the actually-unread incoming messages are touched.
        for (Message m : messageRepo.findUnreadIncoming(conversationId, currentUserId)) {
            m.setIsRead(true);
            messageRepo.save(m);
        }

        if (currentUserId.equals(conversation.getInitiatorId())) {
            conversation.setInitiatorUnreadCount(0);
        } else {
            conversation.setResponderUnreadCount(0);
        }
        repo.save(conversation);
    }

    public long getUnreadCountForEntity(String entityType, Long entityId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        return repo.sumUnreadForEntityAndUser(entityType, entityId, currentUserId);
    }

    public ConversationDto closeConversation(Long conversationId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        Conversation conversation = getAccessibleConversation(conversationId, currentUserId);
        conversation.setStatus(Conversation.Status.CLOSED);
        repo.save(conversation);
        return mapper.convertToDto(conversation);
    }

    public void softDeleteConversation(Long conversationId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        Conversation conversation = getAccessibleConversation(conversationId, currentUserId);

        // Cascade: soft-delete all messages in this conversation
        List<Message> messages = messageRepo.findByConversationIdOrderBySentAtAsc(conversationId);
        for (Message msg : messages) {
            msg.setDeleted(true);
            entityManager.merge(msg);
        }

        conversation.setDeleted(true);
        entityManager.merge(conversation);
        entityManager.flush();
    }

    public Page<ConversationDto> searchConversations(SearchCriteria criteria, int page, int pageSize) {
        messagingUserContextService.requireAdmin();
        String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "lastMessageAt";
        String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection() : "desc";
        return complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
    }

    public Page<String> getFilteredUniqueValuesOfColumn2(
        String columnName, SearchCriteria searchCriteria, int page, int pageSize, boolean andLogic
    ) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(
            entityManager, repo, Conversation.class, columnName, searchCriteria, pageable, andLogic
        );
    }

    public Conversation getAccessibleConversation(Long conversationId, Long userId) {
        return repo.findVisibleByIdAndUser(conversationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found or not accessible"));
    }

    private void validateStartConversation(ConversationDto dto) {
        if (dto.getEntityType() == null || dto.getEntityType().isBlank()) {
            throw new IllegalArgumentException("entityType is required");
        }
        if (dto.getEntityId() == null) {
            throw new IllegalArgumentException("entityId is required");
        }
        if (dto.getSubject() == null || dto.getSubject().isBlank()) {
            throw new IllegalArgumentException("subject is required");
        }
        if (dto.getInitialMessageContent() == null || dto.getInitialMessageContent().isBlank()) {
            throw new IllegalArgumentException("initialMessageContent is required");
        }
    }
}
