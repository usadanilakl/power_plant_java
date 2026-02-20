package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NgWorkRequestService implements NgPermitService<WorkRequest, WorkRequestDto, WorkRequestRepo, WorkRequestMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final NgValueService valueService;
    private final com.dk_power.power_plant_java.sevice.email.EmailFacadeService emailFacadeService;
    private final com.dk_power.power_plant_java.sevice.angular.NgEmailCorrespondenceService emailCorrespondenceService;

    @Override
    public WorkRequestRepo getRepo() {
        return workRequestRepo;
    }

    @Override
    public WorkRequestMapper getMapper() {
        return workRequestMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public WorkRequestDto getDto() {
        return new WorkRequestDto();
    }

    @Override
    public WorkRequest getEntity() {
        return new WorkRequest();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<WorkRequest> getEntityClass() {
        return WorkRequest.class;
    }

    // ====================== CRUD ======================

    public List<WorkRequest> getAllByStatus(String status) {
        if (status == null || status.isEmpty()) throw new IllegalArgumentException("Status cannot be null or empty");
        return workRequestRepo.findByPermitStatus_NameIgnoreCase(status);
    }

    public List<WorkRequestDto> getAllDtosByStatus(String status) {
        return getAllByStatus(status).stream().map(workRequestMapper::convertToDto).toList();
    }

    public List<NgWorkRequestDto> getAllNgDtosByStatus(String status) {
        return getAllByStatus(status).stream().map(workRequestMapper::convertToNgDto).toList();
    }

    public NgWorkRequestDto getNgDtoById(Long id) {
        WorkRequest entity = getEntityById(id);
        return workRequestMapper.convertToNgDto(entity);
    }

    public NgWorkRequestDto saveFromDto(NgWorkRequestDto dto) {
        WorkRequest entity = workRequestMapper.convertNgDtoToEntity(dto);
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            entity.setPermitStatus(valueService.createValue("Permit Status", dto.getStatus()));
        }
        WorkRequest saved = save(entity);
        return workRequestMapper.convertToNgDto(saved);
    }

    // ====================== Export Support ======================

    public List<WorkRequest> getBySearchCriteria(SearchCriteria criteria) {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        boolean andLogicEnabled = criteria.getColumnFilterLogic() == null ||
                criteria.getColumnFilterLogic().values().stream().noneMatch("OR"::equalsIgnoreCase);
        Page<WorkRequest> results = complexSearchWithPagination(workRequestRepo, criteria, pageable, andLogicEnabled);
        return results.getContent();
    }

    public List<WorkRequest> getByIds(List<Long> ids) {
        return workRequestRepo.findAllById(ids);
    }

    // ====================== Unique Values ======================

    public Page<String> getUniqueValuesFiltered(
            WorkRequestRepo repo, String columnName, SearchCriteria searchCriteria,
            int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page, pageSize);
        return getFilteredUniqueValuesOfColumn(entityManager, repo, WorkRequest.class, columnName, searchCriteria, pageable, andLogic);
    }

    // ====================== Status Changes ======================

    public NgWorkRequestDto setStatus(Long id, String status) {
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status", status));
        try {
            if (entity.getSharepointId() != null) {
                wrAdapter.changeStatus(entity.getSharepointId(), status);
            }
        } catch (Exception e) {
            log.warn("[WorkRequest] Failed to update SharePoint status for id={}: {}", id, e.getMessage());
        }
        WorkRequest saved = save(entity);
        return workRequestMapper.convertToNgDto(saved);
    }

    public NgWorkRequestDto completeWorkRequest(Long id) {
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status", "Closed"));
        try {
            if (entity.getSharepointId() != null) {
                wrAdapter.archive(entity.getSharepointId());
            }
        } catch (Exception e) {
            log.warn("[WorkRequest] Failed to archive in SharePoint for id={}: {}", id, e.getMessage());
        }
        WorkRequest saved = save(entity);
        return workRequestMapper.convertToNgDto(saved);
    }

    // ====================== Action Methods (Request Details, Cancel) ======================

    /**
     * Sends email to work request submitter requesting additional information.
     * Updates status to "Pending More Info".
     */
    public NgWorkRequestDto requestMoreDetails(Long id, String additionalMessage) {
        WorkRequest entity = getEntityById(id);

        // Validate submitter email exists
        if (entity.getSubmitterEmail() == null || entity.getSubmitterEmail().isEmpty()) {
            throw new IllegalStateException("Cannot request details - no submitter email on record");
        }

        String subject = buildEmailSubject(entity);
        String body = buildRequestDetailsEmailBody(entity, additionalMessage);

        // Build email request
        com.dk_power.power_plant_java.dto.email.EmailRequest emailRequest =
                com.dk_power.power_plant_java.dto.email.EmailRequest.builder()
                        .to(entity.getSubmitterEmail())
                        .subject(subject)
                        .body(body)
                        .build();

        // Send email with metadata capture (draft-then-send for reply matching)
        com.dk_power.power_plant_java.sevice.email.ApiEmailService.SentEmailMetadata emailMetadata = null;
        try {
            emailMetadata = emailFacadeService.sendEmailWithMetadata(emailRequest);
            log.info("[WorkRequest] Request details email sent to {} for id={}", entity.getSubmitterEmail(), id);
        } catch (Exception e) {
            log.error("[WorkRequest] Failed to send request details email for id={}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to send request details email", e);
        }

        // Save outbound correspondence with Graph API metadata for reply matching
        try {
            emailCorrespondenceService.saveOutbound(
                "WorkRequest",
                id,
                subject,
                body,
                entity.getSubmitterEmail(),
                "Request Details",
                emailMetadata != null ? emailMetadata.getGraphMessageId() : null,
                emailMetadata != null ? emailMetadata.getInternetMessageId() : null,
                emailMetadata != null ? emailMetadata.getConversationId() : null,
                entity.getSharepointId()
            );
            log.debug("[WorkRequest] Saved outbound correspondence for id={} (metadata={})",
                    id, emailMetadata != null ? "captured" : "unavailable");
        } catch (Exception e) {
            log.error("[WorkRequest] Failed to save correspondence for id={}: {}", id, e.getMessage(), e);
            // Don't throw - email was sent successfully, just logging failed
        }

        // Update status to indicate pending more info
        entity.setPermitStatus(valueService.createValue("Permit Status", "Pending More Info"));
        WorkRequest saved = save(entity);

        return workRequestMapper.convertToNgDto(saved);
    }

    /**
     * Builds email subject with SharePoint ID or PWA UUID (for matching on reply).
     * Format: "Additional Information Required - Work Request [SP:abc123] - Boiler Feed Pump"
     * Fallback: "Additional Information Required - Work Request [PWA:uuid] - Boiler Feed Pump"
     */
    private String buildEmailSubject(WorkRequest entity) {
        StringBuilder sb = new StringBuilder("Additional Information Required - Work Request");
        if (entity.getSharepointId() != null && !entity.getSharepointId().isEmpty()) {
            sb.append(" [SP:").append(entity.getSharepointId()).append("]");
        } else if (entity.getLocalUuid() != null && !entity.getLocalUuid().isEmpty()) {
            sb.append(" [PWA:").append(entity.getLocalUuid()).append("]");
        }
        if (entity.getAffectedEquipment() != null && !entity.getAffectedEquipment().isEmpty()) {
            sb.append(" - ").append(entity.getAffectedEquipment());
        }
        return sb.toString();
    }

    /**
     * Builds email body for requesting more details.
     */
    private String buildRequestDetailsEmailBody(WorkRequest entity, String additionalMessage) {
        StringBuilder body = new StringBuilder();
        body.append("Additional information is required for your work request:\n\n");
        body.append("Work Scope: ").append(entity.getWorkScope()).append("\n");
        body.append("Date of Work: ").append(entity.getDateOfWorkToBePerformed()).append("\n");
        body.append("Location: ").append(entity.getLocation()).append("\n\n");

        if (additionalMessage != null && !additionalMessage.isEmpty()) {
            body.append("Specific Details Needed:\n").append(additionalMessage).append("\n\n");
        }

        body.append("Please provide the requested information by replying to this email.\n");
        body.append("\nThank you,\nJ Power USA Operations");

        return body.toString();
    }

    /**
     * Cancels a work request by updating status to "Cancelled".
     * Also updates SharePoint if synchronized.
     */
    public NgWorkRequestDto cancelWorkRequest(Long id) {
        WorkRequest entity = getEntityById(id);

        // Prevent cancelling already cancelled items
        if (entity.getPermitStatus() != null &&
                "Cancelled".equalsIgnoreCase(entity.getPermitStatus().getName())) {
            throw new IllegalStateException("Work request already cancelled");
        }

        // Update local H2 database
        entity.setPermitStatus(valueService.createValue("Permit Status", "Cancelled"));

        // Update SharePoint if synchronized
        if (entity.getSharepointId() != null) {
            try {
                wrAdapter.changeStatus(entity.getSharepointId(), "Cancelled");
                log.info("[WorkRequest] SharePoint status updated to Cancelled for id={}", id);
            } catch (Exception e) {
                log.warn("[WorkRequest] Failed to update SharePoint status for cancelled WR id={}: {}",
                        id, e.getMessage());
                // Don't fail the operation - H2 is source of truth, sync will retry later
            }
        }

        WorkRequest saved = save(entity);
        return workRequestMapper.convertToNgDto(saved);
    }

    // ====================== Legacy methods (used by old controllers) ======================

    /**
     * @deprecated Used by old WorkRequestController. Use setStatus(Long, String) instead.
     */
    public WorkRequestDto setStatus(String id, String status) {
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status", status));
        try {
            if (entity.getSharepointId() != null) {
                wrAdapter.changeStatus(entity.getSharepointId(), status);
            }
        } catch (Exception e) {
            log.warn("[WorkRequest] Failed to update SharePoint status: {}", e.getMessage());
        }
        return toDto(save(entity));
    }

    /**
     * @deprecated Used by old WorkRequestController.
     */
    public WorkRequestDto completeWorkRequestBySharepointId(String sharepointId) {
        WorkRequest entity = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId).orElse(null);
        if (entity == null) throw new IllegalArgumentException("Work request not found for sharepointId: " + sharepointId);
        entity.setPermitStatus(valueService.createValue("Permit Status", "Closed"));
        try {
            wrAdapter.archive(sharepointId);
        } catch (Exception e) {
            log.warn("[WorkRequest] Failed to archive in SharePoint: {}", e.getMessage());
        }
        return toDto(save(entity));
    }

    /**
     * @deprecated Used by old WorkRequestController.
     */
    public NgWorkRequestDto toNgWorkRequestDto(WorkRequestDto workRequestDto) {
        return workRequestMapper.toNgWorkRequestDto(workRequestDto);
    }

    /**
     * @deprecated Used by old WorkRequestController POST endpoint.
     */
    public List<WorkRequest> saveAllFromDto(List<NgWorkRequestDto> dtos) {
        List<WorkRequest> saved = new ArrayList<>();
        for (NgWorkRequestDto dto : dtos) {
            WorkRequest entity = workRequestMapper.convertNgDtoToEntity(dto);
            if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
                entity.setPermitStatus(valueService.createValue("Permit Status", dto.getStatus()));
            }
            saved.add(save(entity));
        }
        return saved;
    }

    /**
     * @deprecated Used by old PowerAutomateController.
     */
    public List<WorkRequestDto> getAndCombineLocalAndSharepointRequests() {
        List<WorkRequestDto> spRequests = wrAdapter.getAll();
        List<WorkRequest> localActive = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");
        List<WorkRequestDto> localDtos = localActive.stream().map(workRequestMapper::convertToDto).toList();

        Map<String, WorkRequestDto> combined = new LinkedHashMap<>();
        for (WorkRequestDto dto : localDtos) {
            if (dto.getSharepointId() != null) combined.put(dto.getSharepointId(), dto);
        }
        for (WorkRequestDto dto : spRequests) {
            if (dto.getSharepointId() != null && !combined.containsKey(dto.getSharepointId())) {
                combined.put(dto.getSharepointId(), dto);
            }
        }
        return new ArrayList<>(combined.values());
    }
}
