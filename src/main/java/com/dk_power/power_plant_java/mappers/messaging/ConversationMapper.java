package com.dk_power.power_plant_java.mappers.messaging;

import com.dk_power.power_plant_java.dto.messaging.ConversationDto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.messaging.MessagingUserContextService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class ConversationMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final UserRepo userRepo;
    private final MessagingUserContextService messagingUserContextService;

    public ConversationMapper(
        ModelMapper modelMapper,
        UserRepo userRepo,
        MessagingUserContextService messagingUserContextService
    ) {
        this.modelMapper = modelMapper;
        this.userRepo = userRepo;
        this.messagingUserContextService = messagingUserContextService;
    }

    public ConversationDto convertToDto(Conversation entity) {
        ConversationDto dto = new ConversationDto();
        dto.setId(entity.getId());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setInitiatorId(entity.getInitiatorId());
        dto.setResponderId(entity.getResponderId());
        dto.setInitiatorName(resolveUserName(entity.getInitiatorId()));
        dto.setResponderName(resolveUserName(entity.getResponderId()));
        dto.setSubject(entity.getSubject());
        dto.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        dto.setLastMessageAt(entity.getLastMessageAt());
        dto.setInitiatorUnreadCount(entity.getInitiatorUnreadCount());
        dto.setResponderUnreadCount(entity.getResponderUnreadCount());
        dto.setCurrentUserUnreadCount(resolveCurrentUserUnreadCount(entity));
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());
        dto.setObjectType(entity.getObjectType());
        return dto;
    }

    public Conversation convertToEntity(ConversationDto source) {
        Conversation entity = new Conversation();
        if (source.getId() != null) {
            entity.setId(source.getId());
        }
        entity.setEntityType(source.getEntityType());
        entity.setEntityId(source.getEntityId());
        entity.setInitiatorId(source.getInitiatorId());
        entity.setResponderId(source.getResponderId());
        entity.setSubject(source.getSubject());
        if (source.getStatus() != null && !source.getStatus().isBlank()) {
            entity.setStatus(Conversation.Status.valueOf(source.getStatus()));
        }
        entity.setLastMessageAt(source.getLastMessageAt());
        entity.setInitiatorUnreadCount(source.getInitiatorUnreadCount() != null ? source.getInitiatorUnreadCount() : 0);
        entity.setResponderUnreadCount(source.getResponderUnreadCount() != null ? source.getResponderUnreadCount() : 0);
        return entity;
    }

    private String resolveUserName(Long userId) {
        if (userId == null) {
            return null;
        }
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return user.getUsername();
    }

    private Integer resolveCurrentUserUnreadCount(Conversation entity) {
        Long currentUserId = messagingUserContextService.getCurrentUserId();
        if (currentUserId == null) {
            return 0;
        }
        if (currentUserId.equals(entity.getInitiatorId())) {
            return entity.getInitiatorUnreadCount();
        }
        if (currentUserId.equals(entity.getResponderId())) {
            return entity.getResponderUnreadCount();
        }
        return 0;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
