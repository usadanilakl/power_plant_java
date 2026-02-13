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
        WorkRequest entity = workRequestRepo.findBySharepointId(sharepointId).orElse(null);
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
