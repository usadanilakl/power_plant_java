package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;

    public CommentMapper(ModelMapper modelMapper,
                         @Lazy ValueService valueService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
    }

    public CommentDto convertToDto(Comment entity) {
        CommentDto dto = new CommentDto();

        dto.setId(entity.getId());
        dto.setContent(entity.getContent());
        dto.setEntityId(entity.getEntityId());
        dto.setEntityType(entity.getEntityType());
        dto.setNeedsAttention(entity.getNeedsAttention());
        dto.setIsResolved(entity.getIsResolved());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());
        dto.setObjectType(entity.getObjectType());

        if (entity.getCommentType() != null) {
            dto.setCommentType(valueService.getDtoById(entity.getCommentType().getId()));
        }

        return dto;
    }

    public Comment convertToEntity(CommentDto source) {
        Comment entity = new Comment();

        if (source.getId() != null) {
            entity.setId(source.getId());
        }

        entity.setContent(source.getContent());
        entity.setEntityId(source.getEntityId());
        entity.setEntityType(source.getEntityType());
        entity.setNeedsAttention(source.getNeedsAttention());
        entity.setIsResolved(source.getIsResolved());

        if (source.getCommentType() != null && source.getCommentType().getId() != null) {
            entity.setCommentType(valueService.getEntityById(source.getCommentType().getId()));
        } else {
            // Default to "General" comment type when none provided
            ValueDto generalType = valueService.getValueFromCategory("Comment Type", "General");
            if (generalType != null && generalType.getId() != null) {
                entity.setCommentType(valueService.getEntityById(generalType.getId()));
            }
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
