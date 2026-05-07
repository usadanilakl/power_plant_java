package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.CounterpartStandardPreviewDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import com.dk_power.power_plant_java.entities.loto.LotoStandardStatus;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.permits.LotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardApprovalEventRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class NgLotoStandardService implements NgCrudService<LotoStandard, LotoStandardDto, LotoStandardRepo, LotoStandardMapper> {
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoStandardMapper lotoStandardMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final NgLotoPointService ngLotoPointService;
    private final LotoStandardApprovalEventRepo approvalEventRepo;
    private final NgValueService ngValueService;
    private final UserRepo userRepo;

    public NgLotoStandardService(LotoStandardRepo lotoStandardRepo, LotoStandardMapper lotoStandardMapper, SessionFactory sessionFactory, EntityManager entityManager, NgLotoPointService ngLotoPointService, LotoStandardApprovalEventRepo approvalEventRepo, NgValueService ngValueService, UserRepo userRepo) {
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoStandardMapper = lotoStandardMapper;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.ngLotoPointService = ngLotoPointService;
        this.approvalEventRepo = approvalEventRepo;
        this.ngValueService = ngValueService;
        this.userRepo = userRepo;
    }

    @Override
    public LotoStandard getEntity() {
        return new LotoStandard();
    }

    @Override
    public LotoStandardDto getDto() {
        return new LotoStandardDto();
    }

    @Override
    public LotoStandardRepo getRepo() {
        return lotoStandardRepo;
    }

    @Override
    public LotoStandardMapper getMapper() {
        return lotoStandardMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LotoStandard toEntity(LotoStandardDto dto) {
        return lotoStandardMapper.convertToEntity(dto);
    }

    @Override
    public LotoStandardDto toDto(LotoStandard entity) {
        return lotoStandardMapper.convertToDto(entity);
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<LotoStandard> getEntityClass() {
        return LotoStandard.class;
    }

    @Override
    public List<LotoStandardDto> getAllDtos() {
        return lotoStandardRepo.findAll().stream().map(lotoStandardMapper::convertToDto).toList();
    }

    /**
     * Get LOTO standards by search criteria for export.
     * Uses the complex search without pagination to get all matching results.
     */
    public List<LotoStandard> getBySearchCriteria(SearchCriteria criteria) {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        boolean andLogicEnabled = criteria.getColumnFilterLogic() == null ||
                !criteria.getColumnFilterLogic().values().stream().anyMatch("OR"::equalsIgnoreCase);
        Page<LotoStandard> results = complexSearchWithPagination(lotoStandardRepo, criteria, pageable, andLogicEnabled);
        return results.getContent();
    }

    /**
     * Get LOTO standards by list of IDs for export.
     */
    public List<LotoStandard> getByIds(List<Long> ids) {
        return lotoStandardRepo.findAllById(ids);
    }

    public LotoStandardDto createStandard(LotoStandardIdDto standard) {
        LotoStandard standardEntity = lotoStandardMapper.convertIdDtoToEntity(standard);
        // Initialize workflow state for new standards
        if (standardEntity.getDevelopmentStatus() == null) {
            standardEntity.setDevelopmentStatus(getOrCreateStatus(LotoStandardStatus.DRAFT));
        }
        if (standardEntity.getCurrentVersion() == null) {
            standardEntity.setCurrentVersion(1);
        }
        lotoStandardRepo.save(standardEntity);
        return lotoStandardMapper.convertToDto(standardEntity);
    }


    @Transactional
    public LotoStandardDto addLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            // Check if the LotoPoint is already in the standard
            if (!standard.getLotoPoints().contains(lotoPoint)) {
                invalidateIfApproved(standard, "LOTO point added: id=" + lotoPointId);
                standard.addLotoPoint(lotoPoint);
                lotoPoint.addLotoStandard(standard);

                // Update lotoPointOrder to place new point at the end
                Map<String, Integer> orderMap = standard.getLotoPointOrder();
                int maxOrder = orderMap.values().stream().mapToInt(Integer::intValue).max().orElse(0);
                orderMap.put(lotoPoint.getId().toString(), maxOrder + 1);
                standard.setLotoPointOrder(orderMap);
            }

            LotoStandard savedStandard = save(standard);
            return toDto(savedStandard);
        } catch (Exception e) {
            throw new RuntimeException("Error adding LotoPoint to LotoStandard: " + e.getMessage(), e);
        }
    }

    @Transactional
    public LotoStandardDto removeLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            // Check if the LotoPoint is already in the standard
            if (standard.getLotoPoints().contains(lotoPoint)) {
                invalidateIfApproved(standard, "LOTO point removed: id=" + lotoPointId);
                standard.removeLotoPoint(lotoPoint);
                lotoPoint.removeStandard(standard);
            }

            LotoStandard savedStandard = save(standard);
            return toDto(savedStandard);
        } catch (Exception e) {
            throw new RuntimeException("Error removing LotoPoint from LotoStandard: " + e.getMessage(), e);
        }
    }

    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        LotoStandard standard = getEntityById(lotoStandardId);
        if (standard == null) {
            throw new EntityNotFoundException("LotoStandard not found");
        }
        List<LotoPoint> points = standard.getLotoPoints();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(ngLotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }

    public LotoStandardDto reorderLotoPoints(Long currentStandardId, List<Long> lotoPoints) {
        LotoStandard standard = getEntityById(currentStandardId);
        if (standard == null) {
            throw new EntityNotFoundException("LotoStandard not found");
        }
        invalidateIfApproved(standard, "LOTO points reordered");
        standard.reorderLotoPoints(lotoPoints);
        LotoStandard savedStandard = save(standard);
        return toDto(savedStandard);
    }

    /**
     * Generate a counterpart standard preview.
     * For each LOTO point in the source standard, finds or suggests a counterpart
     * point for the other unit (01 <-> 02).
     */
    @Transactional(readOnly = true)
    public CounterpartStandardPreviewDto generateCounterpartPreview(Long sourceStandardId) {
        LotoStandard source = getEntityById(sourceStandardId);
        if (source == null) {
            throw new EntityNotFoundException("LotoStandard not found with id: " + sourceStandardId);
        }

        List<LotoPoint> sourcePoints = source.getLotoPoints();
        if (sourcePoints == null || sourcePoints.isEmpty()) {
            throw new IllegalArgumentException("Source standard has no LOTO points");
        }

        String sourceUnit = detectSourceUnit(sourcePoints);
        String targetUnit = "01".equals(sourceUnit) ? "02" : "01";

        LotoPointRepo lotoPointRepo = (LotoPointRepo) ngLotoPointService.getRepo();

        List<CounterpartStandardPreviewDto.CounterpartItemDto> items = new ArrayList<>();

        for (int i = 0; i < sourcePoints.size(); i++) {
            LotoPoint sourcePoint = sourcePoints.get(i);
            LotoPointDto sourceDto = ngLotoPointService.toDto(sourcePoint);

            CounterpartStandardPreviewDto.CounterpartItemDto item = new CounterpartStandardPreviewDto.CounterpartItemDto();
            item.setSourcePoint(sourceDto);
            item.setSourceIndex(i);

            String tag = sourcePoint.getTagNumber();

            // Case 1: Tag doesn't start with 01 or 02 -> non-counterpart
            if (tag == null || (!tag.startsWith("01") && !tag.startsWith("02"))) {
                item.setCategory("non-counterpart");
                item.setCounterpartPoint(sourceDto);
                items.add(item);
                continue;
            }

            // Case 2: counterpartId is set -> confirmed
            if (sourcePoint.getCounterpartId() != null) {
                LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(sourcePoint.getCounterpartId());
                if (counterpart != null) {
                    item.setCategory("confirmed");
                    item.setCounterpartPoint(ngLotoPointService.toDto(counterpart));
                    items.add(item);
                    continue;
                }
                // counterpartId was set but entity not found - fall through to tag search
            }

            // Case 3: Search by swapped tag number
            String destTag = targetUnit + tag.substring(2);
            List<LotoPoint> matches = lotoPointRepo.findByTagNumber(destTag);

            if (matches != null && !matches.isEmpty()) {
                item.setCategory("suggested");
                item.setCounterpartPoint(ngLotoPointService.toDto(matches.get(0)));
                if (matches.size() > 1) {
                    item.setHasMultipleMatches(true);
                    item.setAllMatches(matches.stream()
                            .map(ngLotoPointService::toDto)
                            .toList());
                }
                items.add(item);
            } else {
                // Case 4: No counterpart found -> original
                item.setCategory("original");
                item.setCounterpartPoint(sourceDto);
                items.add(item);
            }
        }

        CounterpartStandardPreviewDto preview = new CounterpartStandardPreviewDto();
        preview.setSourceStandard(toDto(source));
        preview.setSourceUnit(sourceUnit);
        preview.setTargetUnit(targetUnit);
        preview.setItems(items);

        return preview;
    }

    private String detectSourceUnit(List<LotoPoint> points) {
        for (LotoPoint p : points) {
            if (p.getTagNumber() != null) {
                if (p.getTagNumber().startsWith("01")) return "01";
                if (p.getTagNumber().startsWith("02")) return "02";
            }
        }
        return "01";
    }

    /**
     * Find all LOTO standards with pagination
     */
    public Page<LotoStandardDto> findAllPaginated(Pageable pageable) {
        Page<LotoStandard> entityPage = lotoStandardRepo.findAll(pageable);
        return entityPage.map(lotoStandardMapper::convertToDto);
    }

    /**
     * Update existing LOTO standard
     */
    @Transactional
    public LotoStandardDto updateStandard(LotoStandardIdDto standardIdDto) {
        if (standardIdDto.getId() == null) {
            throw new IllegalArgumentException("ID is required for update");
        }

        LotoStandard existing = getEntityById(standardIdDto.getId());
        if (existing == null) {
            throw new EntityNotFoundException("LotoStandard not found with id: " + standardIdDto.getId());
        }

        invalidateIfApproved(existing, "Standard fields edited");

        // Update fields on the existing managed entity instead of creating a new one
        if (standardIdDto.getName() != null && !standardIdDto.getName().isEmpty()) {
            existing.setName(standardIdDto.getName());
        }
        if (standardIdDto.getDescription() != null && !standardIdDto.getDescription().isEmpty()) {
            existing.setDescription(standardIdDto.getDescription());
        }

        // Update loto points
        if (standardIdDto.getLotoPoints() != null) {
            List<LotoPoint> newPoints = standardIdDto.getLotoPoints().stream()
                .filter(Objects::nonNull)
                .map(ngLotoPointService::getEntityById)
                .toList();
            existing.setLotoPoints(newPoints);
        }

        // Update groups - replace the collection with a new HashSet
        if (standardIdDto.getGroups() != null) {
            Set<com.dk_power.power_plant_java.entities.categories.Value> newGroups = standardIdDto.getGroups().stream()
                .filter(Objects::nonNull)
                .map(id -> {
                    return entityManager.find(com.dk_power.power_plant_java.entities.categories.Value.class, id);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));

            existing.setGroups(newGroups);
        }

        // The entity is already managed, changes will be flushed automatically
        entityManager.flush();
        return lotoStandardMapper.convertToDto(existing);
    }

    /**
     * Delete LOTO standard by ID
     */
    public void deleteById(String id) {
        Long longId = Long.parseLong(id);
        lotoStandardRepo.deleteById(longId);
    }

    /**
     * Complex search with criteria
     */
    public Page<LotoStandardDto> complexSearch(
            SearchCriteria criteria,
            int page,
            int pageSize,
            String sortColumn,
            String sortDirection,
            boolean useAndLogic) {

        Pageable pageable = createPageable(page, pageSize, sortColumn, sortDirection);

        Page<LotoStandard> results;

        if (criteria.getType() == SearchCriteria.SearchType.GLOBAL && criteria.getQuery() != null) {
            // Global search across multiple fields
            results = searchGlobally(criteria.getQuery(), pageable);
        } else if (criteria.getType() == SearchCriteria.SearchType.COLUMN && criteria.getFilters() != null) {
            // Column-specific search
            results = searchByFilters(criteria.getFilters(), pageable, useAndLogic);
        } else if (criteria.getType() == SearchCriteria.SearchType.SORT) {
            // Just sorting, no filtering
            results = lotoStandardRepo.findAll(pageable);
        } else {
            results = lotoStandardRepo.findAll(pageable);
        }

        return results.map(lotoStandardMapper::convertToDto);
    }

    /**
     * Global search across name and description
     */
    private Page<LotoStandard> searchGlobally(String query, Pageable pageable) {
        List<LotoStandard> all = lotoStandardRepo.findAll();
        String lowerQuery = query.toLowerCase();

        List<LotoStandard> filtered = all.stream()
                .filter(standard ->
                    (standard.getName() != null && standard.getName().toLowerCase().contains(lowerQuery)) ||
                    (standard.getDescription() != null && standard.getDescription().toLowerCase().contains(lowerQuery))
                )
                .collect(Collectors.toList());

        return paginateList(filtered, pageable);
    }

    /**
     * Search by column filters
     */
    private Page<LotoStandard> searchByFilters(Map<String, String> filters, Pageable pageable, boolean useAndLogic) {
        List<LotoStandard> all = lotoStandardRepo.findAll();

        List<LotoStandard> filtered = all.stream()
                .filter(standard -> matchesFilters(standard, filters, useAndLogic))
                .collect(Collectors.toList());

        return paginateList(filtered, pageable);
    }

    /**
     * Check if standard matches filters
     */
    private boolean matchesFilters(LotoStandard standard, Map<String, String> filters, boolean useAndLogic) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }

        for (Map.Entry<String, String> filter : filters.entrySet()) {
            String fieldName = filter.getKey();
            String filterValue = filter.getValue();

            if (filterValue == null || filterValue.isEmpty()) {
                continue;
            }

            boolean matches = matchesFilter(standard, fieldName, filterValue);

            if (useAndLogic && !matches) {
                return false; // AND logic: all must match
            } else if (!useAndLogic && matches) {
                return true; // OR logic: at least one must match
            }
        }

        return useAndLogic; // AND: all matched, OR: none matched
    }

    /**
     * Check if a single field matches the filter
     */
    private boolean matchesFilter(LotoStandard standard, String fieldName, String filterValue) {
        String lowerFilter = filterValue.toLowerCase();

        switch (fieldName) {
            case "name":
                return standard.getName() != null &&
                       standard.getName().toLowerCase().contains(lowerFilter);
            case "description":
                return standard.getDescription() != null &&
                       standard.getDescription().toLowerCase().contains(lowerFilter);
            case "id":
                return standard.getId() != null &&
                       standard.getId().toString().contains(lowerFilter);
            default:
                return false;
        }
    }

    /**
     * Get unique values for a column with filtering
     */
    public Page<String> getFilteredUniqueValuesOfColumn(
            String column,
            SearchCriteria searchCriteria,
            int page,
            int pageSize,
            boolean andLogicEnabled) {

        List<LotoStandard> all = lotoStandardRepo.findAll();

        // Apply filters if present
        if (searchCriteria.getFilters() != null && !searchCriteria.getFilters().isEmpty()) {
            all = all.stream()
                    .filter(standard -> matchesFilters(standard, searchCriteria.getFilters(), andLogicEnabled))
                    .collect(Collectors.toList());
        }

        // Extract unique values for the specified column
        Set<String> uniqueValues = new HashSet<>();
        for (LotoStandard standard : all) {
            String value = getFieldValue(standard, column);
            if (value != null && !value.isEmpty()) {
                uniqueValues.add(value);
            }
        }

        // Convert to sorted list
        List<String> sortedValues = uniqueValues.stream()
                .sorted()
                .collect(Collectors.toList());

        // Paginate
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return paginateStringList(sortedValues, pageable);
    }

    /**
     * Get field value by column name
     */
    private String getFieldValue(LotoStandard standard, String fieldName) {
        switch (fieldName) {
            case "name":
                return standard.getName();
            case "description":
                return standard.getDescription();
            case "id":
                return standard.getId() != null ? standard.getId().toString() : null;
            default:
                return null;
        }
    }

    /**
     * Get grouped LOTO standards
     */
    public Map<String, List<LotoStandardDto>> getGroupedLotoStandards(String groupBy) {
        List<LotoStandard> all = lotoStandardRepo.findAll();
        Map<String, List<LotoStandardDto>> grouped = new LinkedHashMap<>();

        for (LotoStandard standard : all) {
            String groupKey = getGroupKey(standard, groupBy);
            grouped.computeIfAbsent(groupKey, k -> new ArrayList<>())
                   .add(lotoStandardMapper.convertToDto(standard));
        }

        return grouped;
    }

    /**
     * Get group key based on groupBy field
     */
    private String getGroupKey(LotoStandard standard, String groupBy) {
        switch (groupBy.toLowerCase()) {
            case "name":
                return standard.getName() != null ? standard.getName() : "Unknown";
            default:
                return "All";
        }
    }

    /**
     * Helper: Create pageable with sorting
     */
    private Pageable createPageable(int page, int pageSize, String sortColumn, String sortDirection) {
        org.springframework.data.domain.Sort.Direction direction =
            sortDirection.equalsIgnoreCase("desc")
                ? org.springframework.data.domain.Sort.Direction.DESC
                : org.springframework.data.domain.Sort.Direction.ASC;

        return PageRequest.of(page, pageSize, org.springframework.data.domain.Sort.by(direction, sortColumn));
    }

    /**
     * Helper: Paginate a list
     */
    private Page<LotoStandard> paginateList(List<LotoStandard> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), list.size());

        if (start > list.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, list.size());
        }

        List<LotoStandard> subList = list.subList(start, end);
        return new PageImpl<>(subList, pageable, list.size());
    }

    /**
     * Helper: Paginate a string list
     */
    private Page<String> paginateStringList(List<String> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), list.size());

        if (start > list.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, list.size());
        }

        List<String> subList = list.subList(start, end);
        return new PageImpl<>(subList, pageable, list.size());
    }

    // ── Development workflow ─────────────────────────────────────────────────

    /** Submit a DRAFT standard for second-person verification. Any qualified user. */
    @Transactional
    public LotoStandardDto submitForVerification(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.QUALIFIED);
        String from = transition(s, LotoStandardStatus.PENDING_VERIFICATION);
        String user = currentUserName();
        s.setSubmittedForVerificationBy(user);
        s.setSubmittedForVerificationAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.SUBMITTED_FOR_VERIFICATION, user, from, LotoStandardStatus.PENDING_VERIFICATION, notes);
        return toDto(save(s));
    }

    /** Second-person verify. Verifier must be qualified AND not the standard's creator. */
    @Transactional
    public LotoStandardDto verify(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.QUALIFIED);
        String user = currentUserName();
        if (user.equalsIgnoreCase(s.getCreatedBy())) {
            throw new IllegalStateException("Verifier must be a different qualified person than the creator");
        }
        if (user.equalsIgnoreCase(s.getSubmittedForVerificationBy())) {
            throw new IllegalStateException("Verifier must be a different qualified person than the submitter");
        }
        String from = transition(s, LotoStandardStatus.VERIFIED);
        s.setVerifiedBy(user);
        s.setVerifiedAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.VERIFIED, user, from, LotoStandardStatus.VERIFIED, notes);
        return toDto(save(s));
    }

    /** Mark walkdown complete. Any qualified user. */
    @Transactional
    public LotoStandardDto markWalkdownComplete(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.QUALIFIED);
        String from = transition(s, LotoStandardStatus.WALKDOWN_COMPLETE);
        String user = currentUserName();
        s.setWalkdownBy(user);
        s.setWalkdownAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.WALKDOWN_COMPLETE, user, from, LotoStandardStatus.WALKDOWN_COMPLETE, notes);
        return toDto(save(s));
    }

    /** Mark ready for testing — first-time hang gate. Any qualified user. */
    @Transactional
    public LotoStandardDto markReadyForTesting(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.QUALIFIED);
        String from = transition(s, LotoStandardStatus.READY_FOR_TESTING);
        String user = currentUserName();
        s.setReadyForTestingBy(user);
        s.setReadyForTestingAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.READY_FOR_TESTING, user, from, LotoStandardStatus.READY_FOR_TESTING, notes);
        return toDto(save(s));
    }

    /** Final approval. Manager-only. Records APPROVED or REAPPROVED depending on history. */
    @Transactional
    public LotoStandardDto approve(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.MANAGER);
        String from = transition(s, LotoStandardStatus.APPROVED);
        String user = currentUserName();
        s.setManagerApprovedBy(user);
        s.setManagerApprovedAt(LocalDateTime.now());
        boolean isReapproval = approvalEventRepo.findByStandard_IdOrderByEventAtAsc(s.getId()).stream()
                .anyMatch(e -> e.getEventType() == LotoStandardApprovalEvent.Type.APPROVED);
        LotoStandardApprovalEvent.Type type = isReapproval
                ? LotoStandardApprovalEvent.Type.REAPPROVED
                : LotoStandardApprovalEvent.Type.APPROVED;
        recordEvent(s, type, user, from, LotoStandardStatus.APPROVED, notes);
        return toDto(save(s));
    }

    /** Step back to DRAFT (e.g., reviewer rejects). Any qualified user. Clears attribution. */
    @Transactional
    public LotoStandardDto sendBackToDraft(Long standardId, String reason) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.QUALIFIED);
        String from = transition(s, LotoStandardStatus.DRAFT);
        s.clearWorkflowAttribution();
        recordEvent(s, LotoStandardApprovalEvent.Type.INVALIDATED, currentUserName(), from, LotoStandardStatus.DRAFT, reason);
        return toDto(save(s));
    }

    /** Returns approval-event history for a standard, oldest first. */
    @Transactional(readOnly = true)
    public List<LotoStandardApprovalEvent> getApprovalHistory(Long standardId) {
        return approvalEventRepo.findByStandard_IdOrderByEventAtAsc(standardId);
    }

    /**
     * Replace the per-point prerequisites map on the standard. Treated as a content
     * mutation, so an APPROVED standard gets flipped to NEW_PENDING_REAPPROVAL.
     */
    @Transactional
    public LotoStandardDto updateStandardPrerequisites(Long standardId,
                                                       java.util.Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> prerequisites) {
        LotoStandard s = requireStandard(standardId);
        s.setPointPrerequisites(prerequisites != null ? prerequisites : new java.util.HashMap<>());
        invalidateIfApproved(s, "Point prerequisites edited");
        return toDto(save(s));
    }

    /**
     * Update the procedural prose fields on the standard. Treated as a content mutation.
     * Pass null on any field to leave it unchanged; pass empty string to clear it.
     */
    @Transactional
    public LotoStandardDto updateStandardProceduralText(Long standardId,
                                                        String prerequisitesText,
                                                        String hazardControlMethodsText,
                                                        String installProcedureText,
                                                        String removalProcedureText) {
        LotoStandard s = requireStandard(standardId);
        boolean changed = false;
        if (prerequisitesText != null && !prerequisitesText.equals(s.getPrerequisitesText())) {
            s.setPrerequisitesText(prerequisitesText); changed = true;
        }
        if (hazardControlMethodsText != null && !hazardControlMethodsText.equals(s.getHazardControlMethodsText())) {
            s.setHazardControlMethodsText(hazardControlMethodsText); changed = true;
        }
        if (installProcedureText != null && !installProcedureText.equals(s.getInstallProcedureText())) {
            s.setInstallProcedureText(installProcedureText); changed = true;
        }
        if (removalProcedureText != null && !removalProcedureText.equals(s.getRemovalProcedureText())) {
            s.setRemovalProcedureText(removalProcedureText); changed = true;
        }
        if (changed) invalidateIfApproved(s, "Procedural text edited");
        return toDto(save(s));
    }

    // ── Workflow helpers ─────────────────────────────────────────────────────

    /** Apply a workflow transition or throw if not allowed. Returns the prior status name (may be null). */
    private String transition(LotoStandard s, String target) {
        String current = s.getDevelopmentStatus() != null ? s.getDevelopmentStatus().getName() : null;
        if (!LotoStandardStatus.allowedTargets(current).contains(target)) {
            throw new IllegalStateException("Invalid status transition: " + current + " -> " + target);
        }
        s.setDevelopmentStatus(getOrCreateStatus(target));
        return current;
    }

    /**
     * If the standard is currently APPROVED, flip it to NEW_PENDING_REAPPROVAL,
     * clear approval attribution, bump the version, and log an INVALIDATED event.
     * Called from every content-mutation path.
     */
    private void invalidateIfApproved(LotoStandard s, String reason) {
        if (s.getDevelopmentStatus() == null) return;
        if (!LotoStandardStatus.APPROVED.equals(s.getDevelopmentStatus().getName())) return;
        s.setDevelopmentStatus(getOrCreateStatus(LotoStandardStatus.NEW_PENDING_REAPPROVAL));
        s.setCurrentVersion((s.getCurrentVersion() == null ? 1 : s.getCurrentVersion()) + 1);
        s.clearWorkflowAttribution();
        recordEvent(s, LotoStandardApprovalEvent.Type.INVALIDATED, currentUserName(),
                LotoStandardStatus.APPROVED, LotoStandardStatus.NEW_PENDING_REAPPROVAL, reason);
    }

    private LotoStandard requireStandard(Long id) {
        if (id == null) throw new IllegalArgumentException("Standard id required");
        LotoStandard s = lotoStandardRepo.findById(id).orElse(null);
        if (s == null) throw new EntityNotFoundException("LotoStandard not found: " + id);
        return s;
    }

    private Value getOrCreateStatus(String statusName) {
        return ngValueService.createValue(LotoStandardStatus.CATEGORY, statusName);
    }

    private void recordEvent(LotoStandard s, LotoStandardApprovalEvent.Type type, String user,
                             String from, String to, String notes) {
        LotoStandardApprovalEvent e = new LotoStandardApprovalEvent();
        e.setStandard(s);
        e.setStandardVersion(s.getCurrentVersion());
        e.setEventType(type);
        e.setPerformedBy(user);
        e.setEventAt(LocalDateTime.now());
        e.setFromStatus(from);
        e.setToStatus(to);
        e.setNotes(notes);
        approvalEventRepo.save(e);
    }

    private void requireRole(LotoRole role) {
        String username = currentUserName();
        if ("unknown".equals(username) || "anonymous".equalsIgnoreCase(username)) {
            throw new SecurityException("Authentication required");
        }
        User user = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(username);
        if (user == null) {
            throw new SecurityException("User not found: " + username);
        }
        if (!user.hasLotoRole(role)) {
            throw new SecurityException("Requires LOTO role: " + role.roleName());
        }
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
