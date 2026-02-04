
package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.ZeroEnergyMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.ZeroEnergyRepo;
import com.dk_power.power_plant_java.sevice.angular.base.FuzzySearchService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
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
@RequiredArgsConstructor
@Transactional
public class NgZeroEnergyService implements NgCrudService<ZeroEnergy, ZeroEnergyDto, ZeroEnergyRepo, ZeroEnergyMapper> {
    private final ZeroEnergyRepo zeroEnergyRepo;
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ZeroEnergyMapper zeroEnergyMapper;
    private final FuzzySearchService fuzzySearchService;
    private final ValueService valueService;
    @Lazy
    private final NgEquipmentService ngEquipmentService;

    @Override
    public ZeroEnergyRepo getRepo() {
        return this.zeroEnergyRepo;
    }

    @Override
    public ZeroEnergyMapper getMapper() {
        return this.zeroEnergyMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public ZeroEnergyDto getDto() {
        return new ZeroEnergyDto();
    }

    @Override
    public ZeroEnergy getEntity() {
        return new ZeroEnergy();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<ZeroEnergy> getEntityClass() {
        return ZeroEnergy.class;
    }

    public Optional<ZeroEnergy> findById(Long id) {
        return zeroEnergyRepo.findById(id);
    }

    public Optional<ZeroEnergyDto> findDtoById(Long id) {
        return findById(id).map(zeroEnergyMapper::convertToDto);
    }

    public Page<ZeroEnergyDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("method", searchString);
        searchCriteria.put("resolvedMethod", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "method", "asc", false);
    }

    @Override
    public ZeroEnergyDto toDto(ZeroEnergy entity) {
        return this.zeroEnergyMapper.convertToDto(entity);
    }

    @Override
    public ZeroEnergy toEntity(ZeroEnergyDto dto) {
        return this.zeroEnergyMapper.convertToEntity(dto);
    }

    public ZeroEnergy convertIdDtoToEntity(ZeroEnergyIdDto zeroEnergyIdDto) {
        return getMapper().convertIdDtoToEntity(zeroEnergyIdDto);
    }

    /**
     * @deprecated Use findOrCreate(ZeroEnergyIdDto) instead for automatic deduplication
     */
    @Deprecated
    @Transactional
    public ZeroEnergy processZeroEnergy(ZeroEnergyIdDto zeroEnergyIdDto) {
        System.out.println("Processing ZeroEnergy - DEPRECATED, use findOrCreate instead");
        // Redirect to findOrCreate for deduplication
        return findOrCreate(zeroEnergyIdDto);
    }

    /**
     * Finds an existing ZeroEnergy with the same template and equipment IDs,
     * or creates a new one if no match exists.
     *
     * This overload accepts ZeroEnergyIdDto (with ID references) from the client.
     *
     * @param idDto The ZeroEnergy data with ID references from the client
     * @return Existing or newly created ZeroEnergy entity
     */
    @Transactional
    public ZeroEnergy findOrCreate(ZeroEnergyIdDto idDto) {
        if (idDto == null) {
            return null;
        }

        // Extract and normalize the key fields
        Long templateId = idDto.getZeroEnergyTemplateId();
        Set<Long> equipmentIds = normalizeEquipmentIds(idDto.getTemplateEquipmentIds());
        String normalizedEquipmentIdsString = sortAndJoinIds(equipmentIds);

        // Try to find existing ZeroEnergy with same template and equipment IDs
        Optional<ZeroEnergy> existing = zeroEnergyRepo.findByTemplateAndEquipmentIds(
                templateId,
                normalizedEquipmentIdsString
        );

        if (existing.isPresent()) {
            // Reuse existing ZeroEnergy
            System.out.println("Reusing existing ZeroEnergy ID: " + existing.get().getId());
            ZeroEnergy existingEntity = existing.get();

            // Check if method needs to be generated (for legacy records)
            if (existingEntity.getMethod() == null || existingEntity.getMethod().isEmpty()) {
                System.out.println("Generating method for existing ZeroEnergy ID: " + existingEntity.getId());
                // Convert to IdDto and back to regenerate the method
                ZeroEnergyIdDto tempDto = zeroEnergyMapper.convertToIdDto(existingEntity);
                ZeroEnergy updated = zeroEnergyMapper.convertIdDtoToEntity(tempDto);
                return zeroEnergyRepo.save(updated);
            }

            return existingEntity;
        }

        // Create new ZeroEnergy
        System.out.println("Creating new ZeroEnergy with template ID: " + templateId + " and equipment IDs: " + normalizedEquipmentIdsString);
        idDto.setId(null);
        ZeroEnergy newZeroEnergy = zeroEnergyMapper.convertIdDtoToEntity(idDto);
        return zeroEnergyRepo.save(newZeroEnergy);
    }

    public ZeroEnergyIdDto toIdDto(ZeroEnergy zeroEnergy) {
        return this.zeroEnergyMapper.convertToIdDto(zeroEnergy);
    }

    public List<String> getUniqueValuesOfColumn(String column) {
        return this.getUniqueValuesOfColumn(zeroEnergyRepo, column);
    }

    public Page<ZeroEnergyDto> getFilteredUniqueValuesOfColumn(
            String column, String filter, int page, int pageSize) {

        Pageable pageable = PageRequest.of(page - 1, pageSize);
        Page<ZeroEnergy> entities = this.getFilteredUniqueValuesOfColumn(
                zeroEnergyRepo, column, filter, pageable);

        // Convert preserving pagination metadata
        List<ZeroEnergyDto> dtos = entities.getContent().stream()
                .map(zeroEnergyMapper::convertToDto)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }

    public Page<String> getFilteredUniqueValuesOfColumn2(String columnName, SearchCriteria searchCriteria, int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(entityManager, zeroEnergyRepo, ZeroEnergy.class, columnName, searchCriteria, pageable, andLogic);
    }

//    public Page<String> getFilteredUniqueValuesOfColumn(
//            String columnName, Map<String, String> filters, int page, int pageSize, boolean andLogic) {
//        Pageable pageable = PageRequest.of(page - 1, pageSize);
//
//        // Extract only the filters you actually use (null-safe)
//        String method = filters.get("method");
//        String resolvedMethod = filters.get("resolvedMethod");
//        String templateLotoPointId = filters.get("templateLotoPointId");
//        String zeroEnergyTemplateId = filters.get("zeroEnergyTemplateId");
//
//        return switch (columnName.toLowerCase()) {
//            case "method" -> zeroEnergyRepo.findDistinctMethod(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "resolvedmethod" -> zeroEnergyRepo.findDistinctResolvedMethod(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "templatelotopointid" -> zeroEnergyRepo.findDistinctTemplateLotoPointId(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "zeroenergyttemplateid" -> zeroEnergyRepo.findDistinctZeroEnergyTemplateId(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            default -> new PageImpl<>(new ArrayList<>(), pageable, 0);
//        };
//    }
//
//    public Page<ZeroEnergyDto> complexSearch(SearchCriteria searchCriteria, int page, int size, String sortBy, String sortDirection, boolean andLogic) {
//        Pageable pageable = PageRequest.of(page - 1, size);
//        Page<ZeroEnergy> entities = complexSearch(searchCriteria, pageable, sortBy, sortDirection, andLogic);
//
//        List<ZeroEnergyDto> dtos = entities.getContent().stream()
//                .map(zeroEnergyMapper::convertToDto)
//                .filter(Objects::nonNull)
//                .collect(Collectors.toList());
//
//        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
//    }

    private String[] splitIntoWords(String text, int maxWords) {
        String[] words = new String[maxWords];
        if (text != null) {
            String[] textWords = text.split("\\s+");
            System.arraycopy(textWords, 0, words, 0, Math.min(textWords.length, maxWords));
        }
        return words;
    }

    /**
     * Finds an existing ZeroEnergy with the same template and equipment IDs,
     * or creates a new one if no match exists.
     *
     * This implements the deduplication pattern - identical zero energy methods
     * are stored once and shared across multiple LOTO points.
     *
     * Algorithm:
     * 1. Extract and normalize template ID and equipment IDs from DTO
     * 2. Search for existing ZeroEnergy with matching signature
     * 3. If found, return it (reuse)
     * 4. If not found, create and save new one
     *
     * @param dto The ZeroEnergy data from the client
     * @return Existing or newly created ZeroEnergy entity
     */
    @Transactional
    public ZeroEnergy findOrCreate(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        // Extract and normalize the key fields
        Long templateId = (dto.getZeroEnergyTemplate() != null)
                ? dto.getZeroEnergyTemplate().getId()
                : null;

        Set<Long> equipmentIds = normalizeEquipmentIds(dto.getTemplateEquipmentIds());
        String normalizedEquipmentIdsString = sortAndJoinIds(equipmentIds);

        // Try to find existing ZeroEnergy with same template and equipment IDs
        Optional<ZeroEnergy> existing = zeroEnergyRepo.findByTemplateAndEquipmentIds(
                templateId,
                normalizedEquipmentIdsString
        );

        if (existing.isPresent()) {
            // Reuse existing ZeroEnergy
            ZeroEnergy existingEntity = existing.get();

            // Check if method needs to be generated (for legacy records)
            if (existingEntity.getMethod() == null || existingEntity.getMethod().isEmpty()) {
                System.out.println("Generating method for existing ZeroEnergy ID: " + existingEntity.getId());
                // Convert to IdDto and back to regenerate the method
                ZeroEnergyIdDto tempDto = zeroEnergyMapper.convertToIdDto(existingEntity);
                ZeroEnergy updated = zeroEnergyMapper.convertIdDtoToEntity(tempDto);
                return zeroEnergyRepo.save(updated);
            }

            return existingEntity;
        }

        // Create new ZeroEnergy
        ZeroEnergy newZeroEnergy = zeroEnergyMapper.convertToEntity(dto);
        return zeroEnergyRepo.save(newZeroEnergy);
    }

    /**
     * Normalizes equipment IDs by removing nulls, zeros, and duplicates.
     */
    private Set<Long> normalizeEquipmentIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }

        return ids.stream()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .collect(Collectors.toSet());
    }

    /**
     * Sorts equipment IDs and joins them as comma-separated string for comparison.
     * This ensures that [1,2,3] and [3,2,1] are treated as the same.
     */
    private String sortAndJoinIds(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }

        return ids.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    /**
     * Gets all ZeroEnergy items with their usage count.
     * Useful for admin UI to view and manage zero energy templates.
     *
     * @return List of ZeroEnergy DTOs
     */
    public List<ZeroEnergyDto> getAllWithUsageCount() {
        List<ZeroEnergy> allZeroEnergies = zeroEnergyRepo.findAll();
        return allZeroEnergies.stream()
                .map(zeroEnergyMapper::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Finds all unused ZeroEnergy items (not referenced by any LotoPoint).
     *
     * @return List of orphaned ZeroEnergy entities
     */
    public List<ZeroEnergy> findOrphans() {
        return zeroEnergyRepo.findOrphans();
    }

    /**
     * Deletes all unused ZeroEnergy items.
     * Should be called periodically or manually from admin UI.
     *
     * @return Number of items deleted
     */
    @Transactional
    public int cleanupOrphans() {
        return zeroEnergyRepo.deleteOrphans();
    }

    /**
     * Migrates all ZeroEnergy records to populate the method field.
     * This is needed for existing records that were created before the method field was persisted.
     *
     * @return Number of records updated
     */
    @Transactional
    public int migrateMethodFields() {
        List<ZeroEnergy> allZeroEnergies = zeroEnergyRepo.findAll();
        int updatedCount = 0;

        for (ZeroEnergy entity : allZeroEnergies) {
            if (entity.getMethod() == null || entity.getMethod().isEmpty()) {
                // Convert to IdDto and back to regenerate the method
                ZeroEnergyIdDto tempDto = zeroEnergyMapper.convertToIdDto(entity);
                ZeroEnergy updated = zeroEnergyMapper.convertIdDtoToEntity(tempDto);
                zeroEnergyRepo.save(updated);
                updatedCount++;
                System.out.println("Updated ZeroEnergy ID: " + entity.getId() + " with method: " + updated.getMethod());
            }
        }

        System.out.println("Migration complete. Updated " + updatedCount + " ZeroEnergy records.");
        return updatedCount;
    }

    /**
     * Looks up counterpart equipment DTOs for the other unit.
     *
     * Transfer logic for zeroEnergy templateEquipment:
     * For each source equipment ID:
     * 1. Find the equipment entity
     * 2. Get the first LOTO point from that equipment
     * 3. Find the LOTO point's counterpart for the other unit
     * 4. Get the first equipment from that counterpart's equipment list
     * 5. Return full EquipmentDto
     *
     * @param sourceEquipmentIds List of equipment IDs from the source unit
     * @param sourceUnit The source unit prefix ("01" or "02")
     * @return List of counterpart EquipmentDto for the target unit
     */
    public List<EquipmentDto> lookupCounterpartEquipment(List<Long> sourceEquipmentIds, String sourceUnit) {
        if (sourceEquipmentIds == null || sourceEquipmentIds.isEmpty()) {
            return new ArrayList<>();
        }

        String targetUnit = "01".equals(sourceUnit) ? "02" : "01";
        List<EquipmentDto> counterpartEquipmentList = new ArrayList<>();

        for (Long equipmentId : sourceEquipmentIds) {
            if (equipmentId == null || equipmentId <= 0) {
                continue;
            }

            try {
                // Step 1: Find the equipment entity
                Optional<Equipment> equipmentOpt = ngEquipmentService.findById(equipmentId);
                if (equipmentOpt.isEmpty()) {
                    System.out.println("Equipment not found for ID: " + equipmentId);
                    continue;
                }
                Equipment equipment = equipmentOpt.get();

                // Step 2: Get the first LOTO point from the equipment
                Set<LotoPoint> lotoPoints = equipment.getLotoPoints();
                if (lotoPoints == null || lotoPoints.isEmpty()) {
                    System.out.println("No LOTO points found for equipment ID: " + equipmentId);
                    continue;
                }
                LotoPoint sourceLotoPoint = lotoPoints.iterator().next();

                // Step 3: Find the counterpart LOTO point for the other unit
                LotoPoint counterpartLotoPoint = findCounterpartLotoPoint(sourceLotoPoint, targetUnit);
                if (counterpartLotoPoint == null) {
                    System.out.println("No counterpart LOTO point found for: " + sourceLotoPoint.getTagNumber());
                    continue;
                }

                // Step 4: Get the first equipment from the counterpart's equipment list
                Set<Equipment> counterpartEquipmentSet = counterpartLotoPoint.getEquipmentList();
                if (counterpartEquipmentSet == null || counterpartEquipmentSet.isEmpty()) {
                    System.out.println("No equipment found for counterpart LOTO point: " + counterpartLotoPoint.getTagNumber());
                    continue;
                }
                Equipment counterpartEquipment = counterpartEquipmentSet.iterator().next();

                // Step 5: Convert to DTO and add to list
                EquipmentDto counterpartDto = ngEquipmentService.toDto(counterpartEquipment);
                counterpartEquipmentList.add(counterpartDto);
                System.out.println("Mapped equipment " + equipmentId + " -> " + counterpartEquipment.getId());

            } catch (Exception e) {
                System.out.println("Error looking up counterpart for equipment ID " + equipmentId + ": " + e.getMessage());
            }
        }

        return counterpartEquipmentList;
    }

    /**
     * Finds the counterpart LOTO point for the target unit.
     * First checks counterpartId, then searches by tag number pattern.
     */
    private LotoPoint findCounterpartLotoPoint(LotoPoint sourceLotoPoint, String targetUnit) {
        // First, check if counterpartId is set
        if (sourceLotoPoint.getCounterpartId() != null) {
            // Use entity manager to load the counterpart
            LotoPoint counterpart = entityManager.find(LotoPoint.class, sourceLotoPoint.getCounterpartId());
            if (counterpart != null) {
                return counterpart;
            }
        }

        // If no counterpartId, search by tag number pattern
        String sourceTag = sourceLotoPoint.getTagNumber();
        if (sourceTag == null || sourceTag.length() < 2) {
            return null;
        }

        // Convert tag: 01XXX -> 02XXX or 02XXX -> 01XXX
        String counterpartTag = targetUnit + sourceTag.substring(2);

        // Use a native query to find by tag number
        try {
            List<LotoPoint> results = entityManager
                .createQuery("SELECT lp FROM LotoPoint lp WHERE lp.tagNumber = :tagNumber", LotoPoint.class)
                .setParameter("tagNumber", counterpartTag)
                .getResultList();

            if (!results.isEmpty()) {
                return results.get(0);
            }
        } catch (Exception e) {
            System.out.println("Error searching for counterpart by tag number: " + e.getMessage());
        }

        return null;
    }

    /**
     * Returns the number of LotoPoints referencing the given ZeroEnergy.
     */
    public long getUsageCount(Long zeroEnergyId) {
        if (zeroEnergyId == null) {
            return 0;
        }
        return lotoPointRepo.countByZeroEnergyId(zeroEnergyId);
    }

    /**
     * Updates a shared ZeroEnergy record in-place. All LotoPoints referencing
     * this record will see the updated template/equipment/method.
     *
     * If the new combination matches another existing ZeroEnergy, merges by
     * reassigning all referencing LotoPoints to the match and deleting this record.
     *
     * @param idDto The updated ZeroEnergy data (must have a valid ID)
     * @return The updated (or merged) ZeroEnergy entity
     */
    @Transactional
    public ZeroEnergy updateShared(ZeroEnergyIdDto idDto) {
        ZeroEnergy existing = getEntityById(idDto.getId());

        Long newTemplateId = idDto.getZeroEnergyTemplateId();
        String newEquipmentIds = sortAndJoinIds(normalizeEquipmentIds(idDto.getTemplateEquipmentIds()));

        // Check if this new combination already exists as a different record
        Optional<ZeroEnergy> duplicate = zeroEnergyRepo.findByTemplateAndEquipmentIds(newTemplateId, newEquipmentIds);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(existing.getId())) {
            // Merge: move all LotoPoints from existing to duplicate, then delete existing
            lotoPointRepo.reassignZeroEnergy(existing.getId(), duplicate.get().getId());
            zeroEnergyRepo.deleteById(existing.getId());
            return duplicate.get();
        }

        // Update in-place
        if (newTemplateId != null) {
            existing.setZeroEnergyTemplate(valueService.findById(newTemplateId).orElse(null));
        }
        existing.setNormalizedEquipmentIds(idDto.getTemplateEquipmentIds());

        // Rebuild method string via mapper (parses template JSON and substitutes equipment tags)
        ZeroEnergy rebuilt = zeroEnergyMapper.convertIdDtoToEntity(idDto);
        existing.setMethod(rebuilt.getMethod());

        return zeroEnergyRepo.save(existing);
    }

    /**
     * Creates a counterpart ZeroEnergy with equipment IDs mapped to the target unit.
     *
     * @param sourceZeroEnergyIdDto The source ZeroEnergy ID DTO
     * @param sourceUnit The source unit prefix ("01" or "02")
     * @return The created counterpart ZeroEnergy entity, or null if source is null
     */
    @Transactional
    public ZeroEnergy createCounterpartZeroEnergy(ZeroEnergyIdDto sourceZeroEnergyIdDto, String sourceUnit) {
        if (sourceZeroEnergyIdDto == null) {
            return null;
        }

        // Look up counterpart equipment
        List<Long> sourceEquipmentIds = sourceZeroEnergyIdDto.getTemplateEquipmentIds();
        List<EquipmentDto> counterpartEquipment = lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit);

        // Extract IDs from DTOs
        List<Long> counterpartEquipmentIds = counterpartEquipment.stream()
                .map(EquipmentDto::getId)
                .collect(Collectors.toList());

        // Create new ZeroEnergy with counterpart equipment IDs
        ZeroEnergyIdDto counterpartIdDto = new ZeroEnergyIdDto();
        counterpartIdDto.setZeroEnergyTemplateId(sourceZeroEnergyIdDto.getZeroEnergyTemplateId());
        counterpartIdDto.setTemplateEquipmentIds(counterpartEquipmentIds);
        // Don't copy the ID - this is a new entity

        return findOrCreate(counterpartIdDto);
    }
}
