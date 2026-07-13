
package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.ZeroEnergyMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
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
    private final EquipmentRepo equipmentRepo;
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

    /** Resolve-on-read: current sentence from the live phrase + this row's equipment (stored fallback). */
    public String resolveMethod(ZeroEnergy entity) {
        return this.zeroEnergyMapper.resolveMethod(entity);
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
     * Per-point save (replaces the shared findOrCreate/updateShared dedup): each LOTO point owns
     * its own ZeroEnergy row. If this point's current row is not referenced by any OTHER point,
     * update it in place; otherwise fork a fresh private row so sibling points are never affected.
     * The mutate-vs-fork decision keys on countByZeroEnergyId, so it is order-independent and safe
     * even before the one-time un-share migration runs. Wording propagation lives on the shared
     * phrase Value + resolve-on-read, not on sharing this row.
     *
     * @param lotoPoint the loaded point being saved (its current zeroEnergy is this point's own row)
     * @param idDto     the incoming zero-energy data (template id + slot-ordered equipment ids)
     */
    @Transactional
    public ZeroEnergy saveForPoint(LotoPoint lotoPoint, ZeroEnergyIdDto idDto) {
        if (idDto == null) {
            return null;
        }
        ZeroEnergy current = lotoPoint != null ? lotoPoint.getZeroEnergy() : null;

        if (current != null && current.getId() != null
                && lotoPointRepo.countByZeroEnergyId(current.getId()) <= 1) {
            // Update this point's own row in place.
            if (idDto.getZeroEnergyTemplateId() != null) {
                current.setZeroEnergyTemplate(valueService.findById(idDto.getZeroEnergyTemplateId()).orElse(null));
            }
            if (idDto.getTemplateEquipmentIds() != null && !idDto.getTemplateEquipmentIds().isEmpty()) {
                current.setNormalizedEquipmentIds(idDto.getTemplateEquipmentIds()); // sorted (legacy key)
                current.setOrderedEquipmentIds(idDto.getTemplateEquipmentIds());    // slot order (for resolution)
            }
            // Rebuild the cached snapshot from the row's now-updated state (display re-resolves anyway).
            current.setMethod(zeroEnergyMapper.resolveMethod(current));
            return zeroEnergyRepo.save(current);
        }

        // Shared (or none): fork a fresh private row for this point, leaving any shared row untouched.
        idDto.setId(null);
        return zeroEnergyRepo.save(zeroEnergyMapper.convertIdDtoToEntity(idDto));
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

        // Try to find existing ZeroEnergy with same template and equipment IDs.
        // Tolerate duplicate rows for the same key (take the lowest-id canonical) instead of
        // throwing NonUniqueResultException.
        Optional<ZeroEnergy> existing = zeroEnergyRepo.findByTemplateAndEquipmentIds(
                templateId,
                normalizedEquipmentIdsString
        ).stream().findFirst();

        if (existing.isPresent()) {
            // Reuse existing ZeroEnergy
            System.out.println("Reusing existing ZeroEnergy ID: " + existing.get().getId());
            ZeroEnergy existingEntity = existing.get();

            // Refresh the SLOT ORDER from the incoming DTO. Reordering equipment does not change
            // the sorted dedup key, so findOrCreate returns this same row; without this the reused
            // row keeps its old order and the reorder is lost on reload. Also rebuild the resolved
            // method to match the new order. (If this ZeroEnergy is shared across multiple LOTO
            // points wanting different orders, this is last-writer-wins - a known limitation.)
            existingEntity.setOrderedEquipmentIds(idDto.getTemplateEquipmentIds());
            ZeroEnergyIdDto refreshed = zeroEnergyMapper.convertToIdDto(existingEntity);
            ZeroEnergy rebuilt = zeroEnergyMapper.convertIdDtoToEntity(refreshed);
            existingEntity.setMethod(rebuilt.getMethod());
            return zeroEnergyRepo.save(existingEntity);
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

        // Try to find existing ZeroEnergy with same template and equipment IDs.
        // Tolerate duplicate rows for the same key (take the lowest-id canonical).
        Optional<ZeroEnergy> existing = zeroEnergyRepo.findByTemplateAndEquipmentIds(
                templateId,
                normalizedEquipmentIdsString
        ).stream().findFirst();

        if (existing.isPresent()) {
            // Reuse existing ZeroEnergy
            ZeroEnergy existingEntity = existing.get();

            // Refresh the slot order from the incoming DTO (reorder doesn't change the sorted
            // dedup key) and rebuild the method, so a reorder persists. See the IdDto overload.
            existingEntity.setOrderedEquipmentIds(dto.getTemplateEquipmentIds());
            ZeroEnergyIdDto refreshed = zeroEnergyMapper.convertToIdDto(existingEntity);
            ZeroEnergy rebuilt = zeroEnergyMapper.convertIdDtoToEntity(refreshed);
            existingEntity.setMethod(rebuilt.getMethod());
            return zeroEnergyRepo.save(existingEntity);
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

        // Position-preserving: exactly one output per source slot (real counterpart or a stub),
        // so placeholder i always maps to source i. Skipping misses would shift later slots.
        int slot = 0;
        for (Long equipmentId : sourceEquipmentIds) {
            slot++;
            try {
                counterpartEquipmentList.add(resolveCounterpartEquipment(equipmentId, sourceUnit, targetUnit, slot));
            } catch (Exception e) {
                System.out.println("Error looking up counterpart for equipment ID " + equipmentId + ": " + e.getMessage());
                counterpartEquipmentList.add(counterpartStub(null, slot));
            }
        }

        return counterpartEquipmentList;
    }

    /**
     * Resolves the counterpart equipment for one source equipment id. Prefers a direct
     * equipment-by-tag match (the unit-swapped source tag), falls back to routing through the
     * source equipment's LOTO point counterpart, and finally returns a slot-preserving stub
     * (id = negative sentinel, tag = the expected counterpart tag) when nothing matches.
     */
    private EquipmentDto resolveCounterpartEquipment(Long equipmentId, String sourceUnit, String targetUnit, int slot) {
        Equipment equipment = (equipmentId != null && equipmentId > 0)
                ? ngEquipmentService.findById(equipmentId).orElse(null)
                : null;
        String srcTag = equipment != null ? equipment.getTagNumber() : null;
        String wantTag = counterpartTag(srcTag, sourceUnit, targetUnit);

        // 1. Direct: find the counterpart equipment by its (unit-swapped) tag. Deterministic
        //    (lowest id) and independent of LOTO-point wiring.
        if (wantTag != null && !wantTag.isEmpty()) {
            List<Equipment> byTag = equipmentRepo.findAllActiveByTagNumberIgnoreCase(wantTag);
            if (byTag != null && !byTag.isEmpty()) {
                return ngEquipmentService.toDto(byTag.get(0));
            }
        }

        // 2. Fallback: source equipment -> its LOTO point -> counterpart LOTO point -> its equipment
        if (equipment != null) {
            LotoPoint sourceLotoPoint = pickLotoPointForEquipment(equipment);
            if (sourceLotoPoint != null) {
                LotoPoint counterpartLotoPoint = findCounterpartLotoPoint(sourceLotoPoint, targetUnit);
                Set<Equipment> cpSet = counterpartLotoPoint != null ? counterpartLotoPoint.getEquipmentList() : null;
                if (cpSet != null && !cpSet.isEmpty()) {
                    final String want = wantTag;
                    Equipment cpEq = cpSet.stream()
                            .filter(e -> want != null && want.equalsIgnoreCase(e.getTagNumber()))
                            .findFirst()
                            .orElseGet(() -> cpSet.iterator().next());
                    return ngEquipmentService.toDto(cpEq);
                }
            }
        }

        // 3. Miss: keep the slot with a stub carrying the expected tag so the user sees which
        //    counterparts still need to be created/linked. The negative id keeps JSON identity
        //    unique and is filtered out on save (never persists as a real equipment reference).
        return counterpartStub(wantTag != null ? wantTag : srcTag, slot);
    }

    /** Builds the unit-swapped counterpart tag, leaving shared/common tags (e.g. "00-...") unchanged. */
    private String counterpartTag(String srcTag, String sourceUnit, String targetUnit) {
        if (srcTag == null || srcTag.length() < 2) {
            return srcTag;
        }
        // Only swap the prefix when the tag actually carries the source unit; shared equipment
        // (00-...) or an already-target-unit tag has no distinct counterpart to fabricate.
        if (srcTag.startsWith(sourceUnit)) {
            return targetUnit + srcTag.substring(2);
        }
        return srcTag;
    }

    /** Picks the LOTO point whose tag matches the equipment's tag (deterministic), else the first. */
    private LotoPoint pickLotoPointForEquipment(Equipment equipment) {
        Set<LotoPoint> lps = equipment.getLotoPoints();
        if (lps == null || lps.isEmpty()) {
            return null;
        }
        String eqTag = equipment.getTagNumber();
        return lps.stream()
                .filter(lp -> eqTag != null && eqTag.equalsIgnoreCase(lp.getTagNumber()))
                .findFirst()
                .orElseGet(() -> lps.iterator().next());
    }

    /** A placeholder counterpart carrying the expected tag; negative id marks it non-persistable. */
    private EquipmentDto counterpartStub(String tag, int slot) {
        EquipmentDto stub = new EquipmentDto();
        stub.setId((long) -slot);
        stub.setTagNumber(tag);
        return stub;
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
        Optional<ZeroEnergy> duplicate = zeroEnergyRepo.findByTemplateAndEquipmentIds(newTemplateId, newEquipmentIds).stream().findFirst();
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
        // Slot order for placeholder resolution (sorted key above can't carry it)
        existing.setOrderedEquipmentIds(idDto.getTemplateEquipmentIds());

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
