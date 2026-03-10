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
import org.springframework.beans.factory.annotation.Value;
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
    @Value("${email.graph.from}")
    private String defaultSenderEmail;

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
     * Get all correspondence for a specific entity (polymorphic query).
     * For WorkRequest, also includes correspondence linked via linkedSharepointId
     * to ensure dedup-resilient retrieval.
     */
    public List<EmailCorrespondenceDto> getCorrespondenceForEntity(String entityType, Long entityId) {
        List<EmailCorrespondence> byEntityId =
            repo.findByEntityTypeAndEntityIdOrderBySentDateTimeDesc(entityType, entityId);

        // For WorkRequest, also query by linkedSharepointId for dedup resilience
        if ("WorkRequest".equals(entityType)) {
            String sharepointId = lookupSharepointId(entityId);
            if (sharepointId != null) {
                List<EmailCorrespondence> bySpId =
                    repo.findByLinkedSharepointIdOrderBySentDateTimeDesc(sharepointId);
                // Union and deduplicate by id
                java.util.Map<Long, EmailCorrespondence> merged = new java.util.LinkedHashMap<>();
                for (EmailCorrespondence ec : byEntityId) {
                    merged.put(ec.getId(), ec);
                }
                for (EmailCorrespondence ec : bySpId) {
                    merged.put(ec.getId(), ec);
                }
                return merged.values().stream()
                    .sorted((a, b) -> {
                        if (a.getSentDateTime() == null && b.getSentDateTime() == null) return 0;
                        if (a.getSentDateTime() == null) return 1;
                        if (b.getSentDateTime() == null) return -1;
                        return b.getSentDateTime().compareTo(a.getSentDateTime());
                    })
                    .map(mapper::convertToDto)
                    .toList();
            }
        }

        return byEntityId.stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Look up the sharepointId for a WorkRequest by its H2 entity ID.
     */
    @SuppressWarnings("unchecked")
    private String lookupSharepointId(Long workRequestId) {
        try {
            List<String> rows = entityManager.createNativeQuery(
                "SELECT sharepoint_id FROM work_request WHERE id = :id AND deleted = false")
                .setParameter("id", workRequestId)
                .getResultList();
            if (!rows.isEmpty()) {
                return rows.get(0);
            }
        } catch (Exception e) {
            // Silently fall back to entityId-only query
        }
        return null;
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
                null, null, null, null);
    }

    /**
     * Save outbound correspondence with Graph API metadata and stable SharePoint link.
     */
    public EmailCorrespondence saveOutbound(String entityType, Long entityId,
                                            String subject, String body,
                                            String recipient, String correspondenceTypeName,
                                            String graphMessageId, String internetMessageId,
                                            String conversationId,
                                            String linkedSharepointId) {
        EmailCorrespondence correspondence = new EmailCorrespondence();
        correspondence.setEntityType(entityType);
        correspondence.setEntityId(entityId);
        correspondence.setDirection(EmailCorrespondence.Direction.OUTBOUND);
        correspondence.setSubject(subject);
        correspondence.setBodyContent(body);
        correspondence.setSender(defaultSenderEmail);
        correspondence.setRecipient(recipient);
        correspondence.setSentDateTime(LocalDateTime.now());
        correspondence.setIsRead(true); // Outbound always "read"
        correspondence.setGraphMessageId(graphMessageId);
        correspondence.setInternetMessageId(internetMessageId);
        correspondence.setConversationId(conversationId);
        correspondence.setLinkedSharepointId(linkedSharepointId);

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
