package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.base_dtos.EmailCorrespondenceDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.mappers.EmailCorrespondenceMapper;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
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

/**
 * Service for EmailCorrespondence entity.
 * Provides CRUD operations and correspondence-specific functionality.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgEmailCorrespondenceService
    implements NgCrudService<EmailCorrespondence, EmailCorrespondenceDto, EmailCorrespondenceRepo, EmailCorrespondenceMapper> {

    private final EmailCorrespondenceRepo repo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final EmailCorrespondenceMapper mapper;
    private final ValueService valueService;

    @Override
    public EmailCorrespondenceRepo getRepo() {
        return this.repo;
    }

    @Override
    public EmailCorrespondenceMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public EmailCorrespondenceDto getDto() {
        return new EmailCorrespondenceDto();
    }

    @Override
    public EmailCorrespondence getEntity() {
        return new EmailCorrespondence();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<EmailCorrespondence> getEntityClass() {
        return EmailCorrespondence.class;
    }

    @Override
    public EmailCorrespondenceDto toDto(EmailCorrespondence entity) {
        return this.mapper.convertToDto(entity);
    }

    @Override
    public EmailCorrespondence toEntity(EmailCorrespondenceDto dto) {
        return this.mapper.convertToEntity(dto);
    }

    @Override
    public List<String> getGlobalSearchColumns() {
        return List.of("subject", "bodyContent", "sender", "recipient", "entityType");
    }

    /**
     * Get all correspondence for a specific entity (polymorphic query)
     */
    public List<EmailCorrespondenceDto> getCorrespondenceForEntity(String entityType, Long entityId) {
        return repo.findByEntityTypeAndEntityIdOrderBySentDateTimeDesc(entityType, entityId)
            .stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Count unread responses for an entity
     */
    public long countUnreadForEntity(String entityType, Long entityId) {
        return repo.countUnreadForEntity(entityType, entityId);
    }

    /**
     * Mark correspondence as read
     */
    public void markAsRead(Long correspondenceId) {
        EmailCorrespondence entity = getEntityById(correspondenceId);
        entity.setIsRead(true);
        repo.save(entity);
    }

    /**
     * Save outbound correspondence when system sends an email
     */
    public EmailCorrespondence saveOutbound(String entityType, Long entityId,
                                            String subject, String body,
                                            String recipient, String correspondenceTypeName) {
        return saveOutbound(entityType, entityId, subject, body, recipient, correspondenceTypeName,
                null, null, null);
    }

    /**
     * Save outbound correspondence with Graph API metadata for reply matching.
     */
    public EmailCorrespondence saveOutbound(String entityType, Long entityId,
                                            String subject, String body,
                                            String recipient, String correspondenceTypeName,
                                            String graphMessageId, String internetMessageId,
                                            String conversationId) {
        EmailCorrespondence correspondence = new EmailCorrespondence();
        correspondence.setEntityType(entityType);
        correspondence.setEntityId(entityId);
        correspondence.setDirection(EmailCorrespondence.Direction.OUTBOUND);
        correspondence.setSubject(subject);
        correspondence.setBodyContent(body);
        correspondence.setSender("operations@jpowerusa.com"); // from config
        correspondence.setRecipient(recipient);
        correspondence.setSentDateTime(LocalDateTime.now());
        correspondence.setIsRead(true); // Outbound always "read"
        correspondence.setGraphMessageId(graphMessageId);
        correspondence.setInternetMessageId(internetMessageId);
        correspondence.setConversationId(conversationId);

        // Set correspondence type
        ValueDto type = valueService.getValueFromCategory("Correspondence Type", correspondenceTypeName);
        if (type != null && type.getId() != null) {
            correspondence.setCorrespondenceType(valueService.getEntityById(type.getId()));
        }

        return repo.save(correspondence);
    }

    public List<String> getUniqueValuesOfColumn(String column) {
        return this.getUniqueValuesOfColumn(repo, column);
    }

    public Page<String> getFilteredUniqueValuesOfColumn2(
            String columnName, SearchCriteria searchCriteria, int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(
                entityManager, repo, EmailCorrespondence.class, columnName, searchCriteria, pageable, andLogic);
    }
}
