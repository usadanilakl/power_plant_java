package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.mappers.CommentMapper;
import com.dk_power.power_plant_java.repository.base_repositories.CommentRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NgCommentService implements NgCrudService<Comment, CommentDto, CommentRepo, CommentMapper> {
    private final CommentRepo commentRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final CommentMapper commentMapper;

    @Override
    public CommentRepo getRepo() {
        return this.commentRepo;
    }

    @Override
    public CommentMapper getMapper() {
        return this.commentMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public CommentDto getDto() {
        return new CommentDto();
    }

    @Override
    public Comment getEntity() {
        return new Comment();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Comment> getEntityClass() {
        return Comment.class;
    }

    @Override
    public CommentDto toDto(Comment entity) {
        return this.commentMapper.convertToDto(entity);
    }

    @Override
    public Comment toEntity(CommentDto dto) {
        return this.commentMapper.convertToEntity(dto);
    }

    public List<CommentDto> getCommentsForEntity(String entityType, Long entityId) {
        return commentRepo.findByEntityTypeAndEntityIdOrderByDateCreatedDesc(entityType, entityId)
                .stream()
                .map(commentMapper::convertToDto)
                .toList();
    }
}
