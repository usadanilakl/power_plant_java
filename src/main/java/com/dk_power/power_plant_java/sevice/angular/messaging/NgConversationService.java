package com.dk_power.power_plant_java.sevice.angular.messaging;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.messaging.ConversationDto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.messaging.ConversationMapper;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.messaging.MessagingUserContextService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NgConversationService implements NgCrudService<Conversation, ConversationDto, ConversationRepo, ConversationMapper> {

    private final ConversationRepo repo;
    private final MessageRepo messageRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ConversationMapper mapper;
    private final MessagingUserContextService messagingUserContextService;

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
     * Strict participant check for PWA: user must be initiator or responder (not open wildcard).
     */
    public boolean isUserParticipant(Long conversationId, Long userId) {
        return repo.isUserParticipant(conversationId, userId);
    }

    public List<ConversationDto> getMyConversations() {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        return repo.findVisibleByUserOrderByLastMessageAtDesc(currentUserId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
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
        Conversation savedConversation = repo.save(conversation);

        Message firstMessage = new Message();
        firstMessage.setConversation(savedConversation);
        firstMessage.setSenderId(initiator.getId());
        firstMessage.setContent(dto.getInitialMessageContent().trim());
        firstMessage.setSentAt(now);
        firstMessage.setIsRead(false);
        messageRepo.save(firstMessage);

        return mapper.convertToDto(savedConversation);
    }

    public void markRead(Long conversationId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        Conversation conversation = getAccessibleConversation(conversationId, currentUserId);
        messageRepo.markIncomingMessagesAsRead(conversationId, currentUserId);

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
