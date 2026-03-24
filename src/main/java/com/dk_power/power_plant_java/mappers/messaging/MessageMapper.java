package com.dk_power.power_plant_java.mappers.messaging;

import com.dk_power.power_plant_java.dto.messaging.MessageDto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ConversationRepo conversationRepo;
    private final UserRepo userRepo;

    public MessageMapper(ModelMapper modelMapper, ConversationRepo conversationRepo, UserRepo userRepo) {
        this.modelMapper = modelMapper;
        this.conversationRepo = conversationRepo;
        this.userRepo = userRepo;
    }

    public MessageDto convertToDto(Message entity) {
        MessageDto dto = new MessageDto();
        dto.setId(entity.getId());
        dto.setConversationId(entity.getConversation() != null ? entity.getConversation().getId() : null);
        dto.setSenderId(entity.getSenderId());
        dto.setSenderName(resolveUserName(entity.getSenderId()));
        dto.setContent(entity.getContent());
        dto.setSentAt(entity.getSentAt());
        dto.setIsRead(entity.getIsRead());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());
        dto.setObjectType(entity.getObjectType());
        return dto;
    }

    public Message convertToEntity(MessageDto source) {
        Message entity = new Message();
        if (source.getId() != null) {
            entity.setId(source.getId());
        }
        if (source.getConversationId() != null) {
            Conversation conversation = conversationRepo.findById(source.getConversationId()).orElse(null);
            entity.setConversation(conversation);
        }
        entity.setSenderId(source.getSenderId());
        entity.setContent(source.getContent());
        entity.setSentAt(source.getSentAt());
        entity.setIsRead(source.getIsRead() != null ? source.getIsRead() : false);
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

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
