package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.permits.LotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public NgLotoStandardService(LotoStandardRepo lotoStandardRepo, LotoStandardMapper lotoStandardMapper, SessionFactory sessionFactory, EntityManager entityManager, NgLotoPointService ngLotoPointService) {
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoStandardMapper = lotoStandardMapper;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.ngLotoPointService = ngLotoPointService;
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

    public LotoStandardDto createStandard(LotoStandardIdDto standard) {
        LotoStandard standardEntity = lotoStandardMapper.convertIdDtoToEntity(standard);
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
                standard.addLotoPoint(lotoPoint);
                lotoPoint.addLotoStandard(standard);
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
        standard.reorderLotoPoints(lotoPoints);
        LotoStandard savedStandard = save(standard);
        return toDto(savedStandard);
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
    public LotoStandardDto updateStandard(LotoStandardIdDto standardIdDto) {
        if (standardIdDto.getId() == null) {
            throw new IllegalArgumentException("ID is required for update");
        }

        LotoStandard existing = getEntityById(standardIdDto.getId());
        if (existing == null) {
            throw new EntityNotFoundException("LotoStandard not found with id: " + standardIdDto.getId());
        }

        LotoStandard updated = lotoStandardMapper.convertIdDtoToEntity(standardIdDto);
        LotoStandard saved = lotoStandardRepo.save(updated);
        return lotoStandardMapper.convertToDto(saved);
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
}
