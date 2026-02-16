package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.base_dtos.EmailCorrespondenceDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * Mapper for EmailCorrespondence entity.
 * Handles conversion between entity and DTO, including Value relationships.
 */
@Component
public class EmailCorrespondenceMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;

    public EmailCorrespondenceMapper(ModelMapper modelMapper,
                                     @Lazy ValueService valueService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
    }

    public EmailCorrespondenceDto convertToDto(EmailCorrespondence entity) {
        EmailCorrespondenceDto dto = new EmailCorrespondenceDto();

        dto.setId(entity.getId());
        dto.setEntityId(entity.getEntityId());
        dto.setEntityType(entity.getEntityType());
        dto.setDirection(entity.getDirection() != null ? entity.getDirection().name() : null);
        dto.setSubject(entity.getSubject());
        dto.setBodyContent(entity.getBodyContent());
        dto.setSender(entity.getSender());
        dto.setRecipient(entity.getRecipient());
        dto.setSentDateTime(entity.getSentDateTime());
        dto.setInternetMessageId(entity.getInternetMessageId());
        dto.setConversationId(entity.getConversationId());
        dto.setGraphMessageId(entity.getGraphMessageId());
        dto.setIsRead(entity.getIsRead());
        dto.setNeedsAttention(entity.getNeedsAttention());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());
        dto.setObjectType(entity.getObjectType());

        if (entity.getCorrespondenceType() != null) {
            dto.setCorrespondenceType(valueService.getDtoById(entity.getCorrespondenceType().getId()));
        }

        return dto;
    }

    public EmailCorrespondence convertToEntity(EmailCorrespondenceDto source) {
        EmailCorrespondence entity = new EmailCorrespondence();

        if (source.getId() != null) {
            entity.setId(source.getId());
        }

        entity.setEntityId(source.getEntityId());
        entity.setEntityType(source.getEntityType());

        if (source.getDirection() != null) {
            entity.setDirection(EmailCorrespondence.Direction.valueOf(source.getDirection()));
        }

        entity.setSubject(source.getSubject());
        entity.setBodyContent(source.getBodyContent());
        entity.setSender(source.getSender());
        entity.setRecipient(source.getRecipient());
        entity.setSentDateTime(source.getSentDateTime());
        entity.setInternetMessageId(source.getInternetMessageId());
        entity.setConversationId(source.getConversationId());
        entity.setGraphMessageId(source.getGraphMessageId());
        entity.setIsRead(source.getIsRead());
        entity.setNeedsAttention(source.getNeedsAttention());

        if (source.getCorrespondenceType() != null && source.getCorrespondenceType().getId() != null) {
            entity.setCorrespondenceType(valueService.getEntityById(source.getCorrespondenceType().getId()));
        } else {
            // Default to "General" correspondence type when none provided
            ValueDto generalType = valueService.getValueFromCategory("Correspondence Type", "General");
            if (generalType != null && generalType.getId() != null) {
                entity.setCorrespondenceType(valueService.getEntityById(generalType.getId()));
            }
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
