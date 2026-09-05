package com.dk_power.power_plant_java.sevice.angular.messaging;

import com.dk_power.power_plant_java.dto.messaging.MessageDto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.mappers.messaging.MessageMapper;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoQaWorklogService;
import com.dk_power.power_plant_java.sevice.messaging.MessagingUserContextService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NgMessageService implements NgCrudService<Message, MessageDto, MessageRepo, MessageMapper> {

    private final MessageRepo repo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final MessageMapper mapper;
    private final NgConversationService ngConversationService;
    private final MessagingUserContextService messagingUserContextService;
    /** Optional — Maximo-configured nodes only; plain messaging works without it. */
    private final ObjectProvider<MaximoQaWorklogService> qaWorklog;

    @Override
    public MessageRepo getRepo() {
        return repo;
    }

    @Override
    public MessageMapper getMapper() {
        return mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public MessageDto getDto() {
        return new MessageDto();
    }

    @Override
    public Message getEntity() {
        return new Message();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<Message> getEntityClass() {
        return Message.class;
    }

    @Override
    public MessageDto toDto(Message entity) {
        return mapper.convertToDto(entity);
    }

    @Override
    public Message toEntity(MessageDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public List<String> getGlobalSearchColumns() {
        return List.of("content");
    }

    public List<MessageDto> getMessagesForConversation(Long conversationId) {
        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        ngConversationService.getAccessibleConversation(conversationId, currentUserId);
        return repo.findByConversationIdOrderBySentAtAsc(conversationId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    public MessageDto sendMessage(MessageDto dto) {
        if (dto.getConversationId() == null) {
            throw new IllegalArgumentException("conversationId is required");
        }
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new IllegalArgumentException("content is required");
        }

        Long currentUserId = messagingUserContextService.getCurrentUserIdRequired();
        Conversation conversation = ngConversationService.getAccessibleConversation(dto.getConversationId(), currentUserId);
        if (conversation.getStatus() == Conversation.Status.CLOSED) {
            throw new IllegalStateException("Cannot send a message to a closed conversation");
        }

        LocalDateTime now = LocalDateTime.now();
        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderId(currentUserId);
        message.setContent(dto.getContent().trim());
        message.setSentAt(now);
        message.setIsRead(false);

        if (currentUserId.equals(conversation.getInitiatorId())) {
            conversation.setResponderUnreadCount((conversation.getResponderUnreadCount() != null ? conversation.getResponderUnreadCount() : 0) + 1);
        } else {
            conversation.setInitiatorUnreadCount((conversation.getInitiatorUnreadCount() != null ? conversation.getInitiatorUnreadCount() : 0) + 1);
        }
        conversation.setLastMessageAt(now);
        ngConversationService.save(conversation);

        Message saved = repo.save(message);

        // Mirror an answer on a WO Q&A thread to the WO's Maximo worklog (system of record) after commit — best-effort.
        if (NgConversationService.WORK_ORDER_ENTITY_TYPE.equals(conversation.getEntityType())) {
            final Long authorId = currentUserId;
            final Long messageId = saved.getId();
            final String content = saved.getContent();
            NgConversationService.runAfterCommit(() -> qaWorklog.ifAvailable(s -> s.writeAnswer(conversation, authorId, content, messageId)));
        }

        return mapper.convertToDto(saved);
    }
}
