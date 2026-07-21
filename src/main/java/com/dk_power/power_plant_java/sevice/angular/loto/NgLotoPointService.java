package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.*;
import com.dk_power.power_plant_java.util.TagNumberDetector;
import com.dk_power.power_plant_java.util.TagNumberDetector.DetectedTag;
import com.dk_power.power_plant_java.util.TagNumberDetector.TagMatchType;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.base.FuzzySearchService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import org.springframework.beans.factory.ObjectProvider;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
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
public class NgLotoPointService implements NgCrudService<LotoPoint, LotoPointDto, LotoPointRepo, LotoPointMapper> {
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final LotoPointMapper lotoPointMapper;
    private final NgEquipmentService equipmentService;
    private final FuzzySearchService fuzzySearchService;
    private final TagNumberDetector tagNumberDetector;
    private final ObjectProvider<WorkAreaGitHubPublisher> gitHubPublisherProvider;
    private final LotoStandardPendingChangeCaptureService pendingChangeCaptureService;
    private final FieldChangeTracker fieldChangeTracker;
    // ObjectProvider (not direct injection) for the two dependencies used only
    // by the picture-attach flow. Direct injection triggered a Spring
    // constructor cycle:
    //     NgValueService -> NgLotoPointService -> NgFileService -> NgValueService
    // NgValueService already depends on NgLotoPointService and NgFileService
    // already depends on NgValueService (both existing edges); adding a direct
    // NgLotoPointService -> NgFileService edge closes the loop. ObjectProvider
    // gives us a proxy that resolves the actual bean on first .getObject()
    // call, breaking the constructor-time chain without forcing every dep on
    // this file to become lazy. Matches the WorkAreaGitHubPublisher pattern a
    // few lines above.
    //
    // @Lazy on a Lombok-generated constructor field is a no-op — Lombok does
    // NOT forward the annotation to the generated constructor parameter, so
    // it does not defer resolution. That was the previous (broken) attempt.
    private final ObjectProvider<com.dk_power.power_plant_java.sevice.angular.file.NgFileService> ngFileServiceProvider;
    private final ObjectProvider<com.dk_power.power_plant_java.sevice.angular.NgValueService> ngValueServiceProvider;


    @Override
    public LotoPointRepo getRepo() {
        return this.lotoPointRepo;
    }

    @Override
    public LotoPointMapper getMapper() {
        return this.lotoPointMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoPointDto getDto() {
        return new LotoPointDto();
    }

    @Override
    public LotoPoint getEntity() {
        return new LotoPoint();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<LotoPoint> getEntityClass() {
        return LotoPoint.class;
    }

    /**
     * Define columns to search for global search in LotoPoint entity.
     * Supports nested paths like "location.name".
     */
    @Override
    public List<String> getGlobalSearchColumns() {
        return Arrays.asList(
                "tagNumber", "description", "specificLocation", "unit", "system",
                "location.name", "isoPos.name", "normPos.name", "eqType.name"
        );
    }

    /**
     * Override to use eager loading for equipment list
     */
    @Override
    public LotoPoint getEntityById(Long id) {
        return lotoPointRepo.findByIdWithEquipment(id);
    }

    public Optional<LotoPoint> findById(Long id) {
        // Use eager loading to fetch equipment list
        LotoPoint lotoPoint = lotoPointRepo.findByIdWithEquipment(id);
        return Optional.ofNullable(lotoPoint);
    }

    public Optional<LotoPointDto> findDtoById(Long id) {
        return findById(id).map(lotoPointMapper::convertToDto);
    }

    public List<LotoPointDto> findByModelFileId(Long fileId) {
        return lotoPointRepo.findByModelFile_Id(fileId).stream()
                .map(lotoPointMapper::convertToDto)
                .toList();
    }

    /**
     * Set or clear the modelFile FK on multiple LOTO points in one transaction.
     * Lightweight — only touches the modelFile field, no equipment/ZE processing.
     */
    @Transactional
    public void setModelFileOnPoints(List<Long> lotoPointIds, long modelFileId) {
        com.dk_power.power_plant_java.entities.files.FileObject modelFile =
                modelFileId > 0
                        ? entityManager.find(com.dk_power.power_plant_java.entities.files.FileObject.class, modelFileId)
                        : null;
        for (Long lpId : lotoPointIds) {
            lotoPointRepo.findById(lpId).ifPresent(lp -> {
                lp.setModelFile(modelFile);
                lotoPointRepo.save(lp);
            });
        }
    }

    public Page<LotoPointDto> complexSearch(String searchString, int page, int size) {
        // Use GLOBAL search with OR logic for cross-field token matching.
        // Each token can match in any column (e.g., "condensate" in system + "pump" in description).
        SearchCriteria sc = new SearchCriteria();
        sc.setType(SearchCriteria.SearchType.GLOBAL);
        sc.setQuery(searchString);
        sc.setGlobalFilterLogic("OR");
        return complexSearch(sc, page, size, "tagNumber", "asc", false);
    }

    @Override
    public LotoPointDto toDto(LotoPoint entity) {
        return this.lotoPointMapper.convertToDto(entity);
    }

    @Override
    public LotoPoint toEntity(LotoPointDto dto) {
        return this.lotoPointMapper.convertToEntity(dto);
    }

    public List<String> getRelatedImages(Long id) {
        Optional<LotoPoint> byId = findById(id);
        if (byId.isPresent()) {
            LotoPoint lotoPoint = byId.get();
            Set<Equipment> equipmentList = lotoPoint.getEquipmentList();
            List<String> imageUrls = new ArrayList<>();
            for (Equipment equipment : equipmentList) {
                FileObject file = equipment.getMainFile();
                if (file != null) {
                    imageUrls.add(file.getFileLink());
                }
            }
//            if(imageUrls.isEmpty()){
//                throw new RuntimeException("No related images found for LotoPoint with id: " + id);
//            }
//            System.out.println("Related images found for LotoPoint with id: " + id + " - " + imageUrls.size() + " images found. URLs: " + imageUrls);
            return imageUrls;
        }
        throw new RuntimeException("LotoPoint not found with id: " + id);
    }

    public LotoPoint convertIdDtoToEntity(LotoPointIdDto lotoPoint) {
        return getMapper().convertIdDtoToEntity(lotoPoint);
    }

    public String generateTagNumber(String system) {
        throw new RuntimeException("Method is not implemented");
    }

    public List<LotoPoint> getPoinsWithFile() {
        return lotoPointRepo.findByEquipmentListNotNull();
    }

    /**
     * Get LOTO points by search criteria for export.
     * Uses the complex search without pagination to get all matching results.
     */
    public List<LotoPoint> getBySearchCriteria(SearchCriteria criteria) {
        // Get all matching records (large page size to get all)
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        boolean andLogicEnabled = criteria.getColumnFilterLogic() == null ||
                !criteria.getColumnFilterLogic().values().stream().anyMatch("OR"::equalsIgnoreCase);
        Page<LotoPoint> results = complexSearchWithPagination(lotoPointRepo, criteria, pageable, andLogicEnabled);
        return results.getContent();
    }

    /**
     * Get LOTO points by list of IDs for export.
     */
    public List<LotoPoint> getByIds(List<Long> ids) {
        return lotoPointRepo.findAllById(ids);
    }

    @Transactional
    public void markAsLabeled(List<Long> ids) {
        List<LotoPoint> points = lotoPointRepo.findAllById(ids);
        for (LotoPoint point : points) {
            point.setIsLabeled(true);
        }
        lotoPointRepo.saveAll(points);
    }

    @Transactional
    public LotoPoint processLotoPoint(LotoPointIdDto lotoPointDto) {
        // Snapshot the pre-edit state of any existing point so the
        // pending-review capture service can compute a field-level diff
        // against the post-save entity (see loto-procedure.md §3.3).
        java.util.Map<String, String> beforeFields = null;
        boolean dtoHasAssignedId = lotoPointDto != null && lotoPointDto.getId() != null && lotoPointDto.getId() != 0;
        boolean existingPointFound = false;
        if (lotoPointDto != null && lotoPointDto.getId() != null && lotoPointDto.getId() != 0) {
            LotoPoint existing = lotoPointRepo.findById(lotoPointDto.getId()).orElse(null);
            if (existing != null) {
                existingPointFound = true;
                beforeFields = pendingChangeCaptureService.snapshotPointFields(existing);
                // Detach so the snapshot survives the merge below — otherwise
                // Hibernate returns the same managed instance with new values
                // when we re-read via findById after save.
                entityManager.detach(existing);
            }
        }

        LotoPoint entity = convertIdDtoToEntity(lotoPointDto);
        entity = lotoPointRepo.save(entity);
        if (dtoHasAssignedId && !existingPointFound) {
            fieldChangeTracker.ensureCreateHistoryIfMissing(entity);
        }
        Long savedLpId = entity.getId();

        // Get the new equipment IDs from the DTO
        Set<Long> newEquipmentIds = (lotoPointDto.getEquipmentIdList() != null)
                ? new HashSet<>(lotoPointDto.getEquipmentIdList())
                : new HashSet<>();

        System.out.println("New Equipment IDs: " + newEquipmentIds);

        // Get the currently associated equipment
        LotoPoint lotoPoint = lotoPointRepo.findById(savedLpId).orElse(null);
        if (lotoPoint == null) {
            throw new RuntimeException("LotoPoint not found with id: " + savedLpId);
        }

        Set<Equipment> currentEquipment = (lotoPoint.getEquipmentList() != null)
                ? new HashSet<>(lotoPoint.getEquipmentList())
                : new HashSet<>();

        Set<Long> currentEquipmentIds = currentEquipment.stream()
                .map(Equipment::getId)
                .collect(Collectors.toSet());

        System.out.println("Current Equipment IDs: " + currentEquipmentIds);

        // Find equipment to remove (in current but not in new)
        Set<Long> toRemove = new HashSet<>(currentEquipmentIds);
        toRemove.removeAll(newEquipmentIds);

        // Find equipment to add (in new but not in current)
        Set<Long> toAdd = new HashSet<>(newEquipmentIds);
        toAdd.removeAll(currentEquipmentIds);

        System.out.println("Equipment to remove: " + toRemove);
        System.out.println("Equipment to add: " + toAdd);

        // Remove old equipment associations
        for (Long equipmentId : toRemove) {
            Equipment equipment = equipmentService.getEntityById(equipmentId);
            if (equipment != null) {
                Set<Long> beforeLotoPointIds = lotoPointIds(equipment);
                // Equipment is the owning side, so remove from its collection
                equipment.getLotoPoints().remove(lotoPoint);
                equipmentService.save(equipment);
                fieldChangeTracker.trackRelationshipUpdateInCurrentTx(
                        equipment,
                        "lotoPoints",
                        beforeLotoPointIds,
                        lotoPointIds(equipment),
                        "ManyToMany");
                System.out.println("Removed LotoPoint from Equipment ID: " + equipmentId);
            }
        }

        // Add new equipment associations
        for (Long equipmentId : toAdd) {
            Equipment equipment = equipmentService.getEntityById(equipmentId);
            if (equipment != null) {
                Set<Long> beforeLotoPointIds = lotoPointIds(equipment);
                // Equipment is the owning side with @JoinTable
                // Only need to update this side for persistence
                equipment.addLotoPoint(lotoPoint);
                equipmentService.save(equipment);
                fieldChangeTracker.trackRelationshipUpdateInCurrentTx(
                        equipment,
                        "lotoPoints",
                        beforeLotoPointIds,
                        lotoPointIds(equipment),
                        "ManyToMany");
                System.out.println("Added LotoPoint to Equipment ID: " + equipmentId);
            }
        }

        // Flush changes to database and clear persistence context
        if (!toRemove.isEmpty() || !toAdd.isEmpty()) {
            entityManager.flush();
            entityManager.clear();
        }

        // Fetch with equipment list eagerly loaded (will reflect database state)
        LotoPoint result = lotoPointRepo.findByIdWithEquipment(savedLpId);

        // Capture any field-level edits as pending-change rows on every APPROVED
        // standard that contains this point. The capture service skips standards
        // that aren't APPROVED, so this is a no-op for new/draft standards.
        java.util.Map<String, String> afterFields = pendingChangeCaptureService.snapshotPointFields(result);
        pendingChangeCaptureService.capturePointEditAcrossStandards(savedLpId, afterFields, beforeFields);

        // Publish loto points to GitHub Pages for PWA equipment picker
        WorkAreaGitHubPublisher publisher = gitHubPublisherProvider.getIfAvailable();
        if (publisher != null) {
            publisher.publishLotoPoints();
        }

        return result;
    }

    private Set<Long> lotoPointIds(Equipment equipment) {
        if (equipment == null || equipment.getLotoPoints() == null) {
            return new LinkedHashSet<>();
        }
        return equipment.getLotoPoints().stream()
                .filter(Objects::nonNull)
                .map(LotoPoint::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<Long> pictureIds(LotoPoint point) {
        if (point == null || point.getPictures() == null) {
            return new LinkedHashSet<>();
        }
        return point.getPictures().stream()
                .filter(Objects::nonNull)
                .map(FileObject::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public LotoPoint copyPointFromOtherUnit(Long id) {
        LotoPoint sourcePoint = getEntityById(id);
        String sourceTagNumber = sourcePoint.getTagNumber();
        String destinationTagNumber = "";
        String destDescription = "";
        String specificLocation = "";

        if (sourceTagNumber.startsWith("01")) {
            destinationTagNumber = "02" + sourceTagNumber.substring(2);
            destDescription = processDescription(sourcePoint.getDescription(), "01", "02");
            specificLocation = processDescription(sourcePoint.getSpecificLocation(), "01", "02");
        } else if (sourceTagNumber.startsWith("02")) {
            destinationTagNumber = "01" + sourceTagNumber.substring(2);
            destDescription = processDescription(sourcePoint.getDescription(), "02", "01");
            specificLocation = processDescription(sourcePoint.getSpecificLocation(), "02", "01");
        } else {
            // If it doesn't start with 01 or 02, keep the original data
            return sourcePoint;
        }

        if (!destinationTagNumber.isEmpty()) {
            List<LotoPoint> existingPoints = lotoPointRepo.findByTagNumber(destinationTagNumber);

            if (existingPoints != null && !existingPoints.isEmpty()) {
                // If points with the destination tag number exist, modify the first one
                LotoPoint existingPoint = existingPoints.get(0);
                existingPoint.setDescription(destDescription);
                existingPoint.setSpecificLocation(specificLocation);
                existingPoint.setIsoPos(sourcePoint.getIsoPos());
                existingPoint.setNormPos(sourcePoint.getNormPos());
                return lotoPointRepo.save(existingPoint);
            } else {
                // If no points with the destination tag number exist, create a new one
                LotoPoint newLotoPoint = new LotoPoint();
                newLotoPoint.setTagNumber(destinationTagNumber);
                newLotoPoint.setDescription(destDescription);
                newLotoPoint.setSpecificLocation(specificLocation);
                newLotoPoint.setIsoPos(sourcePoint.getIsoPos());
                newLotoPoint.setNormPos(sourcePoint.getNormPos());
                return lotoPointRepo.save(newLotoPoint);
            }
        }

        // If destinationTagNumber is empty, return null or throw an exception
        return null; // or throw new RuntimeException("Unable to copy LotoPoint");
    }

    private String processDescription(String text, String fromUnit, String toUnit) {
        if (text == null) return null;
        return Arrays.stream(text.split(" "))
                .map(e -> {
                    if (e.startsWith(fromUnit)) return toUnit + e.substring(2);
                    else return e;
                })
                .collect(Collectors.joining(" "))
                .replaceAll("Unit" + fromUnit.charAt(1), "Unit" + toUnit.charAt(1))
                .replaceAll("Unit " + fromUnit.charAt(1), "Unit " + toUnit.charAt(1))
                .replaceAll("U" + fromUnit.charAt(1), "U" + toUnit.charAt(1));
    }

    /**
     * Find the unit counterpart for a given LOTO point.
     * Returns a map with:
     * - "counterpart": LotoPointDto (existing or suggested)
     * - "isNew": boolean indicating if counterpart needs to be created
     * - "isLinked": boolean indicating if counterpartId is already set
     * - "sourceUnit": the source unit prefix (01 or 02)
     * - "targetUnit": the target unit prefix (02 or 01)
     *
     * Lookup order:
     * 1. Check if counterpartId is set -> fetch by ID
     * 2. If not, search by tag pattern
     * 3. If not found, generate suggestion
     */
    public Map<String, Object> findUnitCounterpart(Long id) {
        LotoPoint sourcePoint = getEntityById(id);
        if (sourcePoint == null) {
            return null;
        }

        String sourceTag = sourcePoint.getTagNumber();
        if (sourceTag == null || (!sourceTag.startsWith("01") && !sourceTag.startsWith("02"))) {
            return null; // Not a unit-specific point
        }

        String fromUnit = sourceTag.startsWith("01") ? "01" : "02";
        String toUnit = fromUnit.equals("01") ? "02" : "01";
        String destTag = toUnit + sourceTag.substring(2);

        Map<String, Object> result = new HashMap<>();
        result.put("sourceUnit", fromUnit);
        result.put("targetUnit", toUnit);

        // First, check if counterpartId is already set
        if (sourcePoint.getCounterpartId() != null) {
            LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(sourcePoint.getCounterpartId());
            if (counterpart != null) {
                result.put("counterpart", toDto(counterpart));
                result.put("isNew", false);
                result.put("isLinked", true);
                return result;
            }
        }

        // If counterpartId not set or invalid, search by tag pattern
        List<LotoPoint> existingPoints = lotoPointRepo.findByTagNumber(destTag);

        if (existingPoints != null && !existingPoints.isEmpty()) {
            // Return existing counterpart (but not linked yet)
            result.put("counterpart", toDto(existingPoints.get(0)));
            result.put("isNew", false);
            result.put("isLinked", false);
        } else {
            // Generate suggested counterpart DTO (not saved)
            result.put("counterpart", generateCounterpartDto(sourcePoint, fromUnit, toUnit));
            result.put("isNew", true);
            result.put("isLinked", false);
        }

        return result;
    }

    /**
     * Link two LOTO points as counterparts (bidirectional).
     * Sets counterpartId on both points.
     */
    @Transactional
    public void linkCounterparts(Long point1Id, Long point2Id) {
        LotoPoint point1 = getEntityById(point1Id);
        LotoPoint point2 = getEntityById(point2Id);

        if (point1 == null || point2 == null) {
            throw new RuntimeException("One or both LOTO points not found");
        }

        point1.setCounterpartId(point2Id);
        point2.setCounterpartId(point1Id);

        lotoPointRepo.save(point1);
        lotoPointRepo.save(point2);
    }

    /**
     * Unlink counterpart relationship (bidirectional).
     * Removes counterpartId from both points.
     */
    @Transactional
    public void unlinkCounterparts(Long pointId) {
        LotoPoint point = getEntityById(pointId);
        if (point == null) {
            throw new RuntimeException("LOTO point not found");
        }

        Long counterpartId = point.getCounterpartId();
        if (counterpartId != null) {
            LotoPoint counterpart = getEntityById(counterpartId);
            if (counterpart != null) {
                counterpart.setCounterpartId(null);
                lotoPointRepo.save(counterpart);
            }
        }

        point.setCounterpartId(null);
        lotoPointRepo.save(point);
    }

    /**
     * Get counterpart by ID directly (for quick lookups when counterpartId is known).
     */
    public LotoPointDto getCounterpartById(Long counterpartId) {
        if (counterpartId == null) {
            return null;
        }
        LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(counterpartId);
        return counterpart != null ? toDto(counterpart) : null;
    }

    /**
     * Find counterpart by tag number (for new items being created).
     * Returns a map with counterpart info or null if not a unit-specific tag.
     */
    public Map<String, Object> findCounterpartByTagNumber(String tagNumber) {
        if (tagNumber == null || (!tagNumber.startsWith("01") && !tagNumber.startsWith("02"))) {
            return null; // Not a unit-specific tag
        }

        String fromUnit = tagNumber.startsWith("01") ? "01" : "02";
        String toUnit = fromUnit.equals("01") ? "02" : "01";
        String destTag = toUnit + tagNumber.substring(2);

        Map<String, Object> result = new HashMap<>();
        result.put("sourceUnit", fromUnit);
        result.put("targetUnit", toUnit);

        List<LotoPoint> existingPoints = lotoPointRepo.findByTagNumber(destTag);

        if (existingPoints != null && !existingPoints.isEmpty()) {
            // Return existing counterpart
            result.put("counterpart", toDto(existingPoints.get(0)));
            result.put("isNew", false);
        } else {
            // Generate empty counterpart DTO with just the tag number
            LotoPointDto suggested = new LotoPointDto();
            suggested.setTagNumber(destTag);
            result.put("counterpart", suggested);
            result.put("isNew", true);
        }

        return result;
    }

    /**
     * Look up counterpart LOTO points for ZeroEnergy transfer.
     *
     * Transfer logic:
     * For each source LOTO point ID:
     * 1. Find the LOTO point entity
     * 2. Find the LOTO point's counterpart for the other unit (via counterpartId or tag number)
     * 3. Return full LotoPointDto
     *
     * @param sourceLotoPointIds List of LOTO point IDs from the source unit
     * @param sourceUnit The source unit prefix ("01" or "02")
     * @return List of counterpart LotoPointDto for the target unit
     */
    public List<LotoPointDto> lookupCounterpartLotoPoints(List<Long> sourceLotoPointIds, String sourceUnit) {
        if (sourceLotoPointIds == null || sourceLotoPointIds.isEmpty()) {
            return new ArrayList<>();
        }

        String targetUnit = "01".equals(sourceUnit) ? "02" : "01";
        List<LotoPointDto> counterpartLotoPoints = new ArrayList<>();

        for (Long lotoPointId : sourceLotoPointIds) {
            if (lotoPointId == null || lotoPointId <= 0) {
                continue;
            }

            try {
                // Step 1: Find the source LOTO point
                Optional<LotoPoint> sourceLotoPointOpt = findById(lotoPointId);
                if (sourceLotoPointOpt.isEmpty()) {
                    System.out.println("LOTO point not found for ID: " + lotoPointId);
                    continue;
                }
                LotoPoint sourceLotoPoint = sourceLotoPointOpt.get();

                // Step 2: Find the counterpart LOTO point
                LotoPoint counterpartLotoPoint = findCounterpartLotoPointEntity(sourceLotoPoint, targetUnit);
                if (counterpartLotoPoint == null) {
                    System.out.println("No counterpart LOTO point found for: " + sourceLotoPoint.getTagNumber());
                    continue;
                }

                // Step 3: Convert to DTO and add to list
                LotoPointDto counterpartDto = toDto(counterpartLotoPoint);
                counterpartLotoPoints.add(counterpartDto);
                System.out.println("Mapped LOTO point " + lotoPointId + " -> " + counterpartLotoPoint.getId());

            } catch (Exception e) {
                System.out.println("Error looking up counterpart for LOTO point ID " + lotoPointId + ": " + e.getMessage());
            }
        }

        return counterpartLotoPoints;
    }

    /**
     * Finds the counterpart LOTO point entity for the target unit.
     * First checks counterpartId, then searches by tag number pattern.
     */
    private LotoPoint findCounterpartLotoPointEntity(LotoPoint sourceLotoPoint, String targetUnit) {
        // First, check if counterpartId is set
        if (sourceLotoPoint.getCounterpartId() != null) {
            LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(sourceLotoPoint.getCounterpartId());
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

        // Search by tag number
        List<LotoPoint> results = lotoPointRepo.findByTagNumber(counterpartTag);
        if (results != null && !results.isEmpty()) {
            return results.get(0);
        }

        return null;
    }

    /**
     * Generate a counterpart DTO from a source LotoPoint with transformed data.
     */
    private LotoPointDto generateCounterpartDto(LotoPoint source, String fromUnit, String toUnit) {
        LotoPointDto suggested = new LotoPointDto();
        suggested.setTagNumber(toUnit + source.getTagNumber().substring(2));
        suggested.setDescription(processDescription(source.getDescription(), fromUnit, toUnit));
        suggested.setSpecificLocation(processDescription(source.getSpecificLocation(), fromUnit, toUnit));

        // Copy non-transformed fields from source DTO
        LotoPointDto sourceDto = toDto(source);
        suggested.setIsoPos(sourceDto.getIsoPos());
        suggested.setNormPos(sourceDto.getNormPos());
        suggested.setZeroEnergy(sourceDto.getZeroEnergy());
        suggested.setEqType(sourceDto.getEqType());
        suggested.setLocation(sourceDto.getLocation());
        suggested.setUnit(toUnit.equals("01") ? "Unit 1" : "Unit 2");
        suggested.setSystem(sourceDto.getSystem());

        // Don't copy equipment associations - they are unit-specific
        return suggested;
    }

    public List<FileDto> getRelatedFiles(Long id) {
        Optional<LotoPoint> byId = findById(id);
        if (byId.isPresent()) {
            LotoPoint lotoPoint = byId.get();
            Set<Equipment> equipmentList = lotoPoint.getEquipmentList();
            List<FileDto> files = new ArrayList<>();
            for (Equipment equipment : equipmentList) {
                FileObject file = equipment.getMainFile();
                if (file != null) {
                    FileDto fileDto = new FileDto();
                    fileDto.setId(file.getId());
                    fileDto.setName(file.getName());
                    fileDto.setExtensions(file.getExtensionsArray());
                    fileDto.setFileLink(file.getFileLink());
                    files.add(fileDto);
                }
            }
//            if(imageUrls.isEmpty()){
//                throw new RuntimeException("No related images found for LotoPoint with id: " + id);
//            }
//            System.out.println("Related images found for LotoPoint with id: " + id + " - " + files.size() + " images found.");
            return files;
        }
        throw new RuntimeException("LotoPoint not found with id: " + id);
    }

    public LotoPointIdDto toIdDto(LotoPoint lotoPoint) {
        return this.lotoPointMapper.toIdDto(lotoPoint);
    }


    public List<String> getUniqueValuesOfColumn(String column) {
        return this.getUniqueValuesOfColumn(lotoPointRepo, column);
    }


    public Page<LotoPointDto> getFilteredUniqueValuesOfColumn(
            String column, String filter, int page, int pageSize) {

        Pageable pageable = PageRequest.of(page - 1, pageSize);
        Page<LotoPoint> entities = this.getFilteredUniqueValuesOfColumn(
                lotoPointRepo, column, filter, pageable);

        // Convert preserving pagination metadata
        List<LotoPointDto> dtos = entities.getContent().stream()
                .map(lotoPointMapper::convertToDto)
                .filter(Objects::nonNull)
                .distinct()  // Only if DTO equality is properly implemented
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }

//    public Page<LotoPointDto> getFilteredUniqueValuesOfColumn(
//            String column, Map<String,String> filters, int page, int pageSize, boolean andLogicEnabled) {
//
//        Pageable pageable = PageRequest.of(page - 1, pageSize);
//        Page<LotoPoint> entities = this.getFilteredUniqueValuesOfColumn(
//                lotoPointRepo, column, filters, pageable, andLogicEnabled);
//
//        // Convert preserving pagination metadata
//        List<LotoPointDto> dtos = entities.getContent().stream()
//                .map(lotoPointMapper::convertToDto)
//                .filter(Objects::nonNull)
//                .distinct()  // Only if DTO equality is properly implemented
//                .collect(Collectors.toList());
//
//        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
//    }
//public Page<String> getFilteredUniqueValuesOfColumn(
//        String column, Map<String,String> filters, int page, int pageSize, boolean andLogicEnabled) {
//
//    Pageable pageable = PageRequest.of(page - 1, 20000);
//
//    if(column.equals("isoPos")) {
//        column = column+".name";
//    }
//
//    Page<String> uniqueValues = this.getFilteredUniqueValuesOfColumn(
//            lotoPointRepo, column, filters, pageable, andLogicEnabled);
//
//    // The uniqueValues are already strings and distinct from the default method
//    // Just return them as-is with pagination metadata preserved
//    return new PageImpl<>(
//            uniqueValues.getContent(),
//            pageable,
//            uniqueValues.getTotalElements()
//    );
//}

    public Page<String> getFilteredUniqueValuesOfColumn2(String columnName, SearchCriteria searchCriterica, int page, int pageSize, boolean andLogic){
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(entityManager, lotoPointRepo, LotoPoint.class, columnName, searchCriterica, pageable, andLogic);
    }


    public Page<String> getFilteredUniqueValuesOfColumn(
            String columnName, Map<String, String> filters, int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        // Extract only the filters you actually use (null-safe)
        String unit = filters.get("unit");
        String tagged = filters.get("tagged");
        String tagNumber = filters.get("tagNumber");
        String description = filters.get("description");
        String specificLocation = filters.get("specificLocation");
        String standard = filters.get("standard");
        String generalLocation = filters.get("generalLocation");
        String equipment = filters.get("equipment");
        String extraInfo = filters.get("extraInfo");
        String type = filters.get("type");
        String system = filters.get("system");
        String normalPosition = filters.get("normalPosition");
        String isolatedPosition = filters.get("isolatedPosition");
        String fluid = filters.get("fluid");
        String size = filters.get("size");
        String electricalCheckStatus = filters.get("electricalCheckStatus");
        String redTagId = filters.get("redTagId");
        String oldId = filters.get("oldId");
        String conflictStatus = filters.get("conflictStatus");
        String conflictId = filters.get("conflictId");
        String isoPos = filters.get("isoPos");
        String normPos = filters.get("normPos");

        // Split description into words (max 5 words)
        String[] descriptionWords = splitIntoWords(description, 5);

        return switch (columnName.toLowerCase()) {
            case "unit" -> lotoPointRepo.findDistinctUnit(unit, tagged, tagNumber, description, specificLocation,
                    standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                    fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);

            case "tagnumber" ->
                    lotoPointRepo.findDistinctTagNumber(unit, tagged, tagNumber, description, specificLocation,
                            standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                            fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);

            case "isopos" -> lotoPointRepo.findDistinctIsoPos(unit, tagged, tagNumber, description, specificLocation,
                    standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                    fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);

            case "normpos" -> lotoPointRepo.findDistinctNormPos(unit, tagged, tagNumber, description, specificLocation,
                    standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                    fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);

            case "description" ->
                    lotoPointRepo.findDistinctDescription(unit, tagged, tagNumber, description, specificLocation,
                            standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                            fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);
            // case "description" -> lotoPointRepo.findDistinctDescription(unit, tagged, tagNumber, description,
            //         descriptionWords[0], descriptionWords[1], descriptionWords[2], descriptionWords[3], descriptionWords[4],
            //         specificLocation, standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
            //         fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);

            case "specificlocation" ->
                    lotoPointRepo.findDistinctSpecificLocation(unit, tagged, tagNumber, description, specificLocation,
                            standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
                            fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, isoPos, normPos, andLogic, pageable);
//
//        case "standard" -> lotoPointRepo.findDistinctStandard(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "generallocation" -> lotoPointRepo.findDistinctGeneralLocation(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "equipment" -> lotoPointRepo.findDistinctEquipment(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "extrainfo" -> lotoPointRepo.findDistinctExtraInfo(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "type" -> lotoPointRepo.findDistinctType(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "system" -> lotoPointRepo.findDistinctSystem(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "normalposition" -> lotoPointRepo.findDistinctNormalPosition(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "isolatedposition" -> lotoPointRepo.findDistinctIsolatedPosition(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "fluid" -> lotoPointRepo.findDistinctFluid(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "size" -> lotoPointRepo.findDistinctSize(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "electricalcheckstatus" -> lotoPointRepo.findDistinctElectricalCheckStatus(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "redtagid" -> lotoPointRepo.findDistinctRedTagId(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "oldid" -> lotoPointRepo.findDistinctOldId(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "conflictstatus" -> lotoPointRepo.findDistinctConflictStatus(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "conflictid" -> lotoPointRepo.findDistinctConflictId(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
//        case "tagged" -> lotoPointRepo.findDistinctTagged(unit, tagged, tagNumber, description, specificLocation,
//                standard, generalLocation, equipment, extraInfo, type, system, normalPosition, isolatedPosition,
//                fluid, size, electricalCheckStatus, redTagId, oldId, conflictStatus, conflictId, andLogic, pageable);
//
            default -> throw new IllegalArgumentException("Column not supported: " + columnName);
        };
    }


    private String[] splitIntoWords(String input, int maxWords) {
        String[] words = new String[maxWords];
        if (input == null || input.trim().isEmpty()) {
            return words; // Returns array of nulls
        }

        String[] tokens = input.trim().toLowerCase().split("\\s+");
        for (int i = 0; i < Math.min(tokens.length, maxWords); i++) {
            words[i] = tokens[i];
        }
        return words;
    }


    public Page<LotoPointDto> fuzziSearch(SearchCriteria criteria, int page, int pageSize, String sortColumn, String sortDirection, boolean b) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        Page<LotoPoint> search = fuzzySearchService.search(LotoPoint.class, criteria.getFilters(), pageable, lotoPointRepo);
        System.out.println("Found " + search.getSize() + " items");
        List<LotoPointDto> dtos = search.getContent().stream()
                .map(lotoPointMapper::convertToDto)
                .filter(Objects::nonNull)
                .distinct()  // Only if DTO equality is properly implemented
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, search.getTotalElements());
    }


    public void testFlexibleQueryInterface() {
        System.out.println("\n========== TEST: FlexibleQueryInterface ==========\n");

        Pageable pageable = PageRequest.of(0, 1000);

        // Test 1: Simple field search with multi-word tokens
        System.out.println("TEST 1: Simple field 'description', search 'pump st'");
        SearchCriteria criteria1 = new SearchCriteria();
        criteria1.setFilters(Map.of("description", "pmp st"));
        Page<LotoPoint> results1 = complexSearchWithPagination(lotoPointRepo, criteria1, pageable, true);
        System.out.println("Results: " + results1.getTotalElements() + " rows found");
        results1.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 2: Multiple field search with AND logic
        System.out.println("\nTEST 2: Multiple fields (AND logic), search 'pmp' in description, 'cnd' in tagNumber");
        SearchCriteria criteria2 = new SearchCriteria();
        criteria2.setFilters(Map.of(
                "description", "pmp",
                "tagNumber", "cnd"
        ));
        Page<LotoPoint> results2 = complexSearchWithPagination(lotoPointRepo, criteria2, pageable, true);
        System.out.println("Results: " + results2.getTotalElements() + " rows found");
        results2.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 3: Multiple field search with OR logic
        System.out.println("\nTEST 3: Multiple fields (OR logic), search 'pmp' in description OR 'cnd' in tagNumber");
        SearchCriteria criteria3 = new SearchCriteria();
        criteria3.setFilters(Map.of(
                "description", "pmp",
                "tagNumber", "cnd"
        ));
        Page<LotoPoint> results3 = complexSearchWithPagination(lotoPointRepo, criteria3, pageable, false);
        System.out.println("Results: " + results3.getTotalElements() + " rows found");
        results3.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 4: Extra spacing in search term
        System.out.println("\nTEST 4: Extra spacing 'pmp    st' (should normalize to 'pmp' AND 'st')");
        SearchCriteria criteria4 = new SearchCriteria();
        criteria4.setFilters(Map.of("description", "pmp    st"));
        Page<LotoPoint> results4 = complexSearchWithPagination(lotoPointRepo, criteria4, pageable, true);
        System.out.println("Results: " + results4.getTotalElements() + " rows found");
        results4.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 5: Single token search
        System.out.println("\nTEST 5: Single token 'pmp'");
        SearchCriteria criteria5 = new SearchCriteria();
        criteria5.setFilters(Map.of("description", "pmp"));
        Page<LotoPoint> results5 = complexSearchWithPagination(lotoPointRepo, criteria5, pageable, true);
        System.out.println("Results: " + results5.getTotalElements() + " rows found");
        results5.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 6: Nested path search
        System.out.println("\nTEST 6: Nested path 'isoPos.name' = 'Open' AND 'description' = 'pmp st'");
        SearchCriteria criteria6 = new SearchCriteria();
        criteria6.setFilters(Map.of(
                "isoPos.name", "Open",
                "description", "pmp st"
        ));
        Page<LotoPoint> results6 = complexSearchWithPagination(lotoPointRepo, criteria6, pageable, true);
        System.out.println("Results: " + results6.getTotalElements() + " rows found");
        results6.getContent().forEach(p -> {
            String isoName = p.getIsoPos() != null ? p.getIsoPos().getName() : "N/A";
            System.out.println("  - " + p.getDescription() + " | IsoPos: " + isoName + " | Tag: " + p.getTagNumber());
        });

        // Test 7: Empty filter (should return all)
        System.out.println("\nTEST 7: Empty filter (no search criteria)");
        SearchCriteria criteria7 = new SearchCriteria();
        criteria7.setFilters(new HashMap<>());
        Page<LotoPoint> results7 = complexSearchWithPagination(lotoPointRepo, criteria7, pageable, true);
        System.out.println("Results: " + results7.getTotalElements() + " rows found (should be all records)");

        // Test 8: Null filter value (should be skipped)
        System.out.println("\nTEST 8: Null filter value (should be ignored)");
        SearchCriteria criteria8 = new SearchCriteria();
        Map<String, String> filters8 = new HashMap<>();
        filters8.put("description", null);
        filters8.put("tagNumber", "cnd");
        criteria8.setFilters(filters8);
        Page<LotoPoint> results8 = complexSearchWithPagination(lotoPointRepo, criteria8, pageable, true);
        System.out.println("Results: " + results8.getTotalElements() + " rows found (only 'cnd' filter applied)");
        results8.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 9: Base criteria with main criteria (AND logic)
        System.out.println("\nTEST 9: Base criteria (isoPos.name='Open') + Main criteria (description='pmp')");
        SearchCriteria baseCriteria = new SearchCriteria();
        baseCriteria.setFilters(Map.of("isoPos.name", "Open"));
        SearchCriteria mainCriteria = new SearchCriteria();
        mainCriteria.setFilters(Map.of("description", "pmp"));
        Page<LotoPoint> results9 = complexSearchWithPagination(lotoPointRepo, mainCriteria, pageable, true, baseCriteria);
        System.out.println("Results: " + results9.getTotalElements() + " rows found");
        results9.getContent().forEach(p -> {
            String isoName = p.getIsoPos() != null ? p.getIsoPos().getName() : "N/A";
            System.out.println("  - " + p.getDescription() + " | IsoPos: " + isoName + " | Tag: " + p.getTagNumber());
        });

        // Test 10: Multiple tokens in multiple fields
        System.out.println("\nTEST 10: Multiple tokens in multiple fields (AND logic)");
        SearchCriteria criteria10 = new SearchCriteria();
        criteria10.setFilters(Map.of(
                "description", "pmp st",
                "tagNumber", "cnd 01"
        ));
        Page<LotoPoint> results10 = complexSearchWithPagination(lotoPointRepo, criteria10, pageable, true);
        System.out.println("Results: " + results10.getTotalElements() + " rows found");
        results10.getContent().forEach(p ->
                System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
        );

        // Test 11: Get unique values of column with filter
        System.out.println("\nTEST 11: Get unique values of 'description' column filtered by 'pmp'");
        try {
            Page<LotoPoint> uniqueDescriptions = getFilteredUniqueValuesOfColumn(
                    lotoPointRepo,
                    "tagNumber",
                    "00-DCS-CAB-00",
                    PageRequest.of(0, 20)
            );
            System.out.println("Unique values found: " + uniqueDescriptions.getTotalElements());
            uniqueDescriptions.getContent().forEach(desc ->
                    System.out.println("  - " + desc.getTagNumber())
            );
        } catch (Exception e) {
            System.err.println("Error in Test 11: " + e.getMessage());
        }


        // Test 12: Get unique values with multiple filters
//        System.out.println("\nTEST 12: Get unique 'isoPos.name' values with multiple filters (AND logic)");
//        try {
//            Map<String, String> filterMap = Map.of(
//                    "description", "pmp str",
//                    "tagNumber", "cnd"
//            );
//            Page<String> uniqueIsoPos = getFilteredUniqueValuesOfColumn(
//                    entityManager,
//                    lotoPointRepo,
//                    LotoPoint.class,
//                    "isoPos.name",
//                    filterMap,
//                    PageRequest.of(0, 20),
//                    true
//            );
//            System.out.println("Unique values found: " + uniqueIsoPos.getTotalElements());
//            uniqueIsoPos.getContent().forEach(isoPos ->
//                    System.out.println("  - " + isoPos)
//            );
//        } catch (Exception e) {
//            System.err.println("Error in Test 12: " + e.getMessage());
//        }

        System.out.println("\n========== END TESTS ==========\n");
    }

    /**
     * Get LOTO points grouped by specified criteria for left menu navigation
     * @param groupBy The grouping criteria: equipmentType, location, file, system, unit, zeroEnergyMethod
     * @return Map of group names to list of LOTO points
     */
    public Map<String, List<LotoPointDto>> getGroupedLotoPoints(String groupBy) {
        // Get all non-deleted LOTO points
        List<LotoPoint> allPoints = lotoPointRepo.findAll();

        // Convert to DTOs
        List<LotoPointDto> allDtos = allPoints.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        // Group by the specified criterion
        return switch (groupBy.toLowerCase()) {
            case "equipmenttype" -> groupByEquipmentType(allDtos);
            case "location" -> groupByLocation(allDtos);
            case "file" -> groupByFile(allDtos);
            case "system" -> groupBySystem(allDtos);
            case "unit" -> groupByUnit(allDtos);
            case "zeroenergymethod" -> groupByZeroEnergyMethod(allDtos);
            default -> throw new IllegalArgumentException("Invalid groupBy parameter: " + groupBy +
                    ". Valid values: equipmentType, location, file, system, unit, zeroEnergyMethod");
        };
    }

    private Map<String, List<LotoPointDto>> groupByEquipmentType(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp ->
                    Optional.ofNullable(lp.getEqType())
                            .map(type -> type.getName())
                            .orElse("Uncategorized")
                ));
    }

    private Map<String, List<LotoPointDto>> groupByLocation(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp ->
                    Optional.ofNullable(lp.getLocation())
                            .map(loc -> loc.getName())
                            .orElse("Uncategorized")
                ));
    }

    private Map<String, List<LotoPointDto>> groupByFile(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp -> {
                    // Get main file from equipment list
                    if (lp.getEquipmentList() != null && !lp.getEquipmentList().isEmpty()) {
                        return lp.getEquipmentList().stream()
                                .findFirst()
                                .map(eq -> Optional.ofNullable(eq.getMainFileObject())
                                        .map(file -> file.getName() != null && !file.getName().isEmpty()
                                                ? file.getName()
                                                : "File #" + file.getId())
                                        .orElse("No File"))
                                .orElse("No File");
                    }
                    return "No File";
                }));
    }

    private Map<String, List<LotoPointDto>> groupBySystem(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp ->
                    Optional.ofNullable(lp.getSystem())
                            .filter(s -> !s.isEmpty())
                            .orElse("Uncategorized")
                ));
    }

    private Map<String, List<LotoPointDto>> groupByUnit(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp ->
                    Optional.ofNullable(lp.getUnit())
                            .filter(u -> !u.isEmpty())
                            .orElse("Uncategorized")
                ));
    }

    private Map<String, List<LotoPointDto>> groupByZeroEnergyMethod(List<LotoPointDto> lotoPoints) {
        return lotoPoints.stream()
                .collect(Collectors.groupingBy(lp ->
                    Optional.ofNullable(lp.getZeroEnergy())
                            .map(ze -> Optional.ofNullable(ze.getMethod())
                                    .filter(m -> !m.isEmpty())
                                    .orElse("No Method"))
                            .orElse("No Zero Energy")
                ));
    }

    /**
     * Get lightweight summaries of all LOTO points for menu/cache
     * Returns only essential fields needed for grouping and display
     * Much faster than loading full DTOs with all relations
     */
    public List<LotoPointSummaryDto> getAllSummaries() {
        List<LotoPoint> allLotoPoints = lotoPointRepo.findAll();

        return allLotoPoints.stream()
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Safely deletes a LOTO point by handling relationships before soft delete.
     * - Deletes all associated equipment (via equipmentService.deleteEquipmentSafely)
     * - Handles counterpart relationship (delete or unlink based on deleteCounterpart flag)
     * - Soft deletes the LOTO point
     *
     * @param id The LOTO point ID to delete
     * @param deleteCounterpart If true, also deletes the counterpart LOTO point
     * @return The deleted LOTO point DTO
     */
    @Transactional
    public LotoPointDto deleteLotoPointSafely(Long id, boolean deleteCounterpart) {
        LotoPoint lotoPoint = findById(id)
                .orElseThrow(() -> new RuntimeException("LOTO point not found with id: " + id));

        // Convert to DTO BEFORE any modifications or deletions
        // This ensures we have a clean snapshot of the entity before hibernate session issues
        LotoPointDto resultDto = toDto(lotoPoint);

        // Handle counterpart relationship first
        Long counterpartId = lotoPoint.getCounterpartId();
        if (counterpartId != null) {
            if (deleteCounterpart) {
                // Recursively delete the counterpart (but don't delete its counterpart again)
                LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(counterpartId);
                if (counterpart != null) {
                    // Unlink first to prevent infinite recursion
                    counterpart.setCounterpartId(null);
                    lotoPointRepo.save(counterpart);
                    lotoPoint.setCounterpartId(null);
                    lotoPointRepo.save(lotoPoint);

                    // Delete the counterpart's equipment and the counterpart itself
                    deleteEquipmentAndPoint(counterpart);
                }
            } else {
                // Just unlink the counterpart
                unlinkCounterparts(id);
            }
        }

        // Delete equipment and the main point
        deleteEquipmentAndPoint(lotoPoint);

        return resultDto;
    }

    /**
     * Helper method to delete all equipment associated with a LOTO point and then soft delete the point.
     */
    private void deleteEquipmentAndPoint(LotoPoint lotoPoint) {
        // Get all equipment associated with this LOTO point
        Set<Equipment> equipmentList = lotoPoint.getEquipmentList();
        if (equipmentList != null && !equipmentList.isEmpty()) {
            // Create a copy to avoid ConcurrentModificationException
            List<Long> equipmentIds = equipmentList.stream()
                    .map(Equipment::getId)
                    .collect(Collectors.toList());

            // Delete each equipment safely
            for (Long equipmentId : equipmentIds) {
                try {
                    equipmentService.deleteEquipmentSafely(equipmentId);
                } catch (Exception e) {
                    System.err.println("Warning: Could not delete equipment " + equipmentId + ": " + e.getMessage());
                }
            }
        }

        // Refresh the entity to get updated state after equipment deletion
        entityManager.flush();
        entityManager.clear();
        lotoPoint = lotoPointRepo.findByIdWithEquipment(lotoPoint.getId());

        // Soft delete the LOTO point
        if (lotoPoint != null) {
            softDelete(lotoPoint);
        }
    }

    /**
     * Convert LotoPoint entity to lightweight SummaryDto
     */
    private LotoPointSummaryDto convertToSummaryDto(LotoPoint lp) {
        // Get first equipment for grouping fields
        Equipment firstEquipment = lp.getEquipmentList() != null && !lp.getEquipmentList().isEmpty()
                ? lp.getEquipmentList().iterator().next()
                : null;

        return LotoPointSummaryDto.builder()
                .id(lp.getId())
                .tagNumber(lp.getTagNumber())
                .description(lp.getDescription())
                .isVerified(lp.getIsVerified())
                .equipmentType(firstEquipment != null && firstEquipment.getEqType() != null
                        ? firstEquipment.getEqType().getName()
                        : "Unknown")
                .location(firstEquipment != null && firstEquipment.getLocation() != null
                        ? firstEquipment.getLocation().getName()
                        : "Unknown")
                .system(lp.getSystem() != null && !lp.getSystem().isEmpty()
                        ? lp.getSystem()
                        : "Unknown")
                .unit(lp.getUnit())
                // Resolve-on-read: rebuild from the live phrase + equipment (entity-direct read
                // that bypasses the mapper), so a phrase edit reaches the left-menu grouping.
                .zeroEnergyMethod(lotoPointMapper.resolveZeroEnergyMethod(lp.getZeroEnergy()))
                .fileName(firstEquipment != null && firstEquipment.getMainFile() != null
                        ? firstEquipment.getMainFile().getName()
                        : "Unknown")
                .equipmentIds(lp.getEquipmentList() != null
                        ? lp.getEquipmentList().stream()
                                .map(Equipment::getId)
                                .collect(Collectors.toList())
                        : new java.util.ArrayList<>())
                .build();
    }

    public BulkSearchResultDto bulkSearchByText(String rawText) {
        List<DetectedTag> detected = tagNumberDetector.detectTagNumbers(rawText);

        List<DetectedTag> fullTags = detected.stream()
                .filter(d -> d.matchType() == TagMatchType.FULL).toList();
        List<DetectedTag> partialTags = detected.stream()
                .filter(d -> d.matchType() == TagMatchType.PARTIAL).toList();

        List<BulkSearchMatchDto> exactMatches = new ArrayList<>();
        List<BulkSearchMatchDto> duplicateMatches = new ArrayList<>();
        List<BulkSearchMatchDto> partialMatches = new ArrayList<>();
        List<String> notFound = new ArrayList<>();

        // Batch query all FULL tags at once for efficiency
        Map<String, List<LotoPoint>> exactResultsByTag = Collections.emptyMap();
        if (!fullTags.isEmpty()) {
            Set<String> upperTags = fullTags.stream()
                    .map(d -> d.normalized().toUpperCase())
                    .collect(Collectors.toSet());
            List<LotoPoint> allExact = lotoPointRepo.findByTagNumberUpperIn(upperTags);
            exactResultsByTag = allExact.stream()
                    .collect(Collectors.groupingBy(lp -> lp.getTagNumber().toUpperCase()));
        }

        // Classify each FULL tag
        for (DetectedTag tag : fullTags) {
            String upper = tag.normalized().toUpperCase();
            List<LotoPoint> matches = exactResultsByTag.getOrDefault(upper, Collections.emptyList());

            if (matches.size() == 1) {
                exactMatches.add(new BulkSearchMatchDto(tag.normalized(), "FULL", toLightDtos(matches)));
            } else if (matches.size() > 1) {
                duplicateMatches.add(new BulkSearchMatchDto(tag.normalized(), "FULL", toLightDtos(matches)));
            } else {
                // No exact match - try partial (LIKE) as fallback
                List<LotoPoint> partialResults = lotoPointRepo.findByTagNumberContaining(tag.normalized());
                if (!partialResults.isEmpty()) {
                    partialMatches.add(new BulkSearchMatchDto(tag.normalized(), "FULL", toLightDtos(partialResults)));
                } else {
                    notFound.add(tag.normalized());
                }
            }
        }

        // Process PARTIAL tags with LIKE queries
        for (DetectedTag tag : partialTags) {
            List<LotoPoint> matches = lotoPointRepo.findByTagNumberContaining(tag.normalized());
            if (!matches.isEmpty()) {
                partialMatches.add(new BulkSearchMatchDto(tag.normalized(), "PARTIAL", toLightDtos(matches)));
            } else {
                notFound.add(tag.normalized());
            }
        }

        BulkSearchResultDto result = new BulkSearchResultDto();
        result.setSearchText(rawText);
        result.setExactMatches(exactMatches);
        result.setDuplicateMatches(duplicateMatches);
        result.setPartialMatches(partialMatches);
        result.setNotFound(notFound);
        result.setTotalDetectedTags(detected.size());
        return result;
    }

    private List<LotoPointDtoLight> toLightDtos(List<LotoPoint> points) {
        return points.stream().map(lp -> new LotoPointDtoLight(
                lp.getId(),
                lp.getUnit(),
                lp.getTagged(),
                lp.getTagNumber(),
                lp.getDescription(),
                lp.getSpecificLocation(),
                lp.getNormalPosition(),
                lp.getIsolatedPosition(),
                lp.getOldId(),
                lp.getObjectType()
        )).toList();
    }

    // ── Conflict detection methods ──

    /**
     * Get summary counts for all conflict types.
     */
    public ConflictSummaryDto getConflictSummary() {
        long duplicateCount = countDuplicateTagPoints();
        long noEquipment = lotoPointRepo.countWithEmptyEquipment();
        long noZeroEnergy = lotoPointRepo.countByZeroEnergyIsNull();
        long noCharacteristics = lotoPointRepo.countWithEmptyCharacteristics();
        long missingCounterpart = lotoPointRepo.countMissingCounterparts();

        return ConflictSummaryDto.builder()
                .duplicateTagCount(duplicateCount)
                .noEquipmentCount(noEquipment)
                .noZeroEnergyCount(noZeroEnergy)
                .noCharacteristicsCount(noCharacteristics)
                .missingCounterpartCount(missingCounterpart)
                .totalConflictCount(duplicateCount + noEquipment + noZeroEnergy + noCharacteristics + missingCounterpart)
                .build();
    }

    /**
     * Get paginated LOTO points for a specific conflict type.
     */
    public Page<LotoPointDto> getConflictsByType(String conflictType, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<LotoPoint> results = switch (conflictType.toUpperCase()) {
            case "NO_EQUIPMENT" -> lotoPointRepo.findWithEmptyEquipment(pageable);
            case "NO_ZERO_ENERGY" -> lotoPointRepo.findByZeroEnergyIsNull(pageable);
            case "NO_CHARACTERISTICS" -> lotoPointRepo.findWithEmptyCharacteristics(pageable);
            case "MISSING_COUNTERPART" -> lotoPointRepo.findMissingCounterparts(pageable);
            case "DUPLICATE_TAG" -> {
                // For duplicates, get the IDs of all points in duplicate groups, then paginate
                List<Long> duplicateIds = getDuplicatePointIds();
                if (duplicateIds.isEmpty()) {
                    yield Page.empty(pageable);
                }
                // Paginate manually from the ID list
                int start = Math.min(page * pageSize, duplicateIds.size());
                int end = Math.min(start + pageSize, duplicateIds.size());
                List<Long> pageIds = duplicateIds.subList(start, end);
                List<LotoPoint> points = lotoPointRepo.findAllById(pageIds);
                yield new PageImpl<>(points, pageable, duplicateIds.size());
            }
            default -> throw new IllegalArgumentException("Unknown conflict type: " + conflictType);
        };

        return results.map(this::toDto);
    }

    /**
     * Find duplicate tag groups. Normalizes tags by uppercasing and stripping dashes/spaces.
     * Returns groups of 2+ LOTO points sharing the same normalized tag.
     */
    public List<DuplicateGroupDto> getDuplicateTagGroups() {
        List<LotoPoint> allWithTags = lotoPointRepo.findAllWithTagNumber();

        // Normalize and group: strip dashes, spaces, underscores; uppercase
        Map<String, List<LotoPoint>> grouped = allWithTags.stream()
                .collect(Collectors.groupingBy(lp -> normalizeTagNumber(lp.getTagNumber())));

        // Keep only groups with 2+ members
        return grouped.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .map(e -> new DuplicateGroupDto(
                        e.getKey(),
                        e.getValue().stream().map(this::toDto).collect(Collectors.toList())
                ))
                .sorted(Comparator.comparing(DuplicateGroupDto::getNormalizedTag))
                .collect(Collectors.toList());
    }

    /**
     * Count total LOTO points that appear in duplicate groups.
     */
    private long countDuplicateTagPoints() {
        List<LotoPoint> allWithTags = lotoPointRepo.findAllWithTagNumber();
        Map<String, List<LotoPoint>> grouped = allWithTags.stream()
                .collect(Collectors.groupingBy(lp -> normalizeTagNumber(lp.getTagNumber())));
        return grouped.values().stream()
                .filter(list -> list.size() > 1)
                .mapToLong(List::size)
                .sum();
    }

    /**
     * Get IDs of all LOTO points in duplicate groups.
     */
    private List<Long> getDuplicatePointIds() {
        List<LotoPoint> allWithTags = lotoPointRepo.findAllWithTagNumber();
        Map<String, List<LotoPoint>> grouped = allWithTags.stream()
                .collect(Collectors.groupingBy(lp -> normalizeTagNumber(lp.getTagNumber())));
        return grouped.values().stream()
                .filter(list -> list.size() > 1)
                .flatMap(List::stream)
                .map(LotoPoint::getId)
                .collect(Collectors.toList());
    }

    /**
     * Normalize a tag number for duplicate detection.
     * Strips dashes, spaces, underscores and converts to uppercase.
     */
    private String normalizeTagNumber(String tagNumber) {
        if (tagNumber == null) return "";
        return tagNumber.toUpperCase()
                .replace("-", "")
                .replace(" ", "")
                .replace("_", "");
    }

    /**
     * Merge two duplicate LOTO points.
     * Transfers equipment, standards, and counterpart from removePoint to keepPoint.
     * Soft-deletes the removed point.
     */
    @Transactional
    public LotoPointDto mergeLotoPoints(Long keepId, Long removeId) {
        LotoPoint keepPoint = findById(keepId)
                .orElseThrow(() -> new RuntimeException("Keep point not found: " + keepId));
        LotoPoint removePoint = findById(removeId)
                .orElseThrow(() -> new RuntimeException("Remove point not found: " + removeId));

        // Transfer equipment associations from removePoint to keepPoint
        if (removePoint.getEquipmentList() != null) {
            for (Equipment equipment : new HashSet<>(removePoint.getEquipmentList())) {
                equipment.getLotoPoints().remove(removePoint);
                equipment.addLotoPoint(keepPoint);
                equipmentService.save(equipment);
            }
        }

        // Transfer LOTO standard associations
        if (removePoint.getLotoStandards() != null) {
            for (LotoStandard standard : new HashSet<>(removePoint.getLotoStandards())) {
                standard.getLotoPoints().remove(removePoint);
                if (!standard.getLotoPoints().contains(keepPoint)) {
                    standard.getLotoPoints().add(keepPoint);
                }
            }
        }

        // Transfer counterpart if keepPoint doesn't have one
        if (keepPoint.getCounterpartId() == null && removePoint.getCounterpartId() != null) {
            Long counterpartId = removePoint.getCounterpartId();
            keepPoint.setCounterpartId(counterpartId);
            // Update the counterpart to point to keepPoint
            LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(counterpartId);
            if (counterpart != null) {
                counterpart.setCounterpartId(keepId);
                lotoPointRepo.save(counterpart);
            }
        }

        // Transfer related LOTO point IDs
        if (removePoint.getRelatedLotoPointIds() != null && !removePoint.getRelatedLotoPointIds().isEmpty()) {
            Set<Long> keepRelated = keepPoint.getRelatedLotoPointIds();
            keepRelated.addAll(removePoint.getRelatedLotoPointIds());
            keepRelated.remove(removeId); // Don't reference the deleted point
            keepPoint.setRelatedLotoPointIds(keepRelated);
        }

        // Transfer zero energy if keepPoint doesn't have one
        if (keepPoint.getZeroEnergy() == null && removePoint.getZeroEnergy() != null) {
            keepPoint.setZeroEnergy(removePoint.getZeroEnergy());
            keepPoint.setZeroEnergyMethod(removePoint.getZeroEnergyMethod());
        }

        // Transfer characteristics if keepPoint doesn't have them
        if ((keepPoint.getCharacteristicsJson() == null || keepPoint.getCharacteristicsJson().isEmpty())
                && removePoint.getCharacteristicsJson() != null && !removePoint.getCharacteristicsJson().isEmpty()) {
            keepPoint.setCharacteristicsJson(removePoint.getCharacteristicsJson());
        }

        // Save keepPoint
        lotoPointRepo.save(keepPoint);

        // Unlink removePoint's counterpart before soft-deleting
        if (removePoint.getCounterpartId() != null) {
            removePoint.setCounterpartId(null);
            lotoPointRepo.save(removePoint);
        }

        // Soft delete the removed point
        softDelete(removePoint);

        // Flush and return fresh state
        entityManager.flush();
        entityManager.clear();
        LotoPoint result = lotoPointRepo.findByIdWithEquipment(keepId);
        return toDto(result);
    }

    /**
     * Batch merge: merge multiple duplicate points into one keeper.
     * Calls mergeLotoPoints for each removeId sequentially.
     */
    @Transactional
    public LotoPointDto mergeLotoPointsBatch(Long keepId, List<Long> removeIds) {
        LotoPointDto result = null;
        for (Long removeId : removeIds) {
            if (removeId != null && !removeId.equals(keepId)) {
                result = mergeLotoPoints(keepId, removeId);
            }
        }
        return result;
    }

    /*******************************************************************************
     * PICTURES — attach / detach FileObject rows (fileType.name="Picture") to
     * the LOTO point via the {@code loto_point_picture} M2M join. Bytes live on
     * the filesystem via NgFileService's existing upload pipeline; this method
     * just performs the upload-then-link chain so the caller does one round trip.
     ******************************************************************************/

    /** Category name for FileType Values (matches existing seeded values). */
    private static final String FILE_TYPE_CATEGORY = "File Type";
    /** Category name for Vendor Values (matches existing seeded values). */
    private static final String VENDOR_CATEGORY = "Vendor";
    /** FileType Value used for site photos attached to LOTO points. */
    private static final String PICTURE_FILE_TYPE = "Picture";
    /**
     * Vendor Value used for pictures. FileObject.getFileLink() requires a
     * vendor to compose the on-disk path; "Site" reflects "taken on-site by
     * our operators" rather than "supplied by an equipment manufacturer,"
     * which is what Vendor originally meant for P&ID drawings.
     */
    private static final String PICTURE_VENDOR = "Site";

    /**
     * Attach one or more pictures to the LOTO point. Each multipart file
     * goes through NgFileService's shared pipeline (SHA-256 dedup, on-disk
     * storage, SharePoint-ready path) as a FileObject with
     * fileType="Picture" + vendor="Site". After upload we stamp
     * LOTO-point metadata onto every new FileObject so the plant's file
     * library shows a meaningful name and the picture is associated with
     * the point's system for filtering later:
     *   - name    = LOTO point description, suffixed " (N)" when >1 in one
     *               batch so a multi-select upload produces distinct rows
     *   - system  = the LOTO point's systemValue (Value FK)
     *   - fileNumber left untouched — it doubles as the on-disk-path
     *     component, so overriding it would diverge the metadata from
     *     the file's physical location (per the fileNumber caveat we
     *     discussed).
     * <p>
     * Returns the refreshed LotoPointDto so the caller can render new
     * thumbnails without a follow-up GET.
     */
    @Transactional
    public LotoPointDto uploadPictures(Long lotoPointId,
                                       java.util.List<org.springframework.web.multipart.MultipartFile> files)
            throws java.io.IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one picture file is required");
        }
        LotoPoint point = lotoPointRepo.findById(lotoPointId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "LotoPoint not found: " + lotoPointId));

        // Resolve provider-backed beans once per call (see ObjectProvider
        // field docstring for why direct injection is not viable here).
        com.dk_power.power_plant_java.sevice.angular.NgValueService valueService =
                ngValueServiceProvider.getObject();
        com.dk_power.power_plant_java.sevice.angular.file.NgFileService fileService =
                ngFileServiceProvider.getObject();

        // Resolve-or-create the FileType and Vendor Values on first use — matches
        // NgValueService.createValue's get-or-create semantics, safe to call
        // every time.
        com.dk_power.power_plant_java.entities.categories.Value pictureType =
                valueService.createValue(FILE_TYPE_CATEGORY, PICTURE_FILE_TYPE);
        com.dk_power.power_plant_java.entities.categories.Value pictureVendor =
                valueService.createValue(VENDOR_CATEGORY, PICTURE_VENDOR);

        java.util.List<com.dk_power.power_plant_java.dto.files.FileDto> uploaded =
                fileService.processMultipleFiles(
                        files,
                        pictureType.getId(),
                        pictureVendor.getId(),
                        null // sharedFileName not used — we overwrite name below per-file
                );
        if (uploaded == null || uploaded.isEmpty()) {
            throw new IllegalStateException("Picture upload returned no FileObject");
        }

        // Metadata population: stamp LOTO-point context onto every new FileObject
        // so the plant file library sees "Descriptive Name" attached to the right
        // system, not the raw camera-supplied filename ("IMG_1234.jpg"). The tile
        // grid on the LOTO Point form doesn't rely on this — it just renders the
        // thumbnail — but the FILES page and P&ID library organize by name/system.
        String description = (point.getDescription() == null || point.getDescription().isBlank())
                ? "LOTO Point #" + point.getId()
                : point.getDescription();
        com.dk_power.power_plant_java.entities.categories.Value system = point.getSystemValue();
        boolean multi = uploaded.size() > 1;
        int idx = 1;
        for (com.dk_power.power_plant_java.dto.files.FileDto dto : uploaded) {
            FileObject fo = entityManager.find(FileObject.class, dto.getId());
            if (fo == null) continue;
            fo.setName(multi ? description + " (" + idx + ")" : description);
            if (system != null) fo.setSystem(system);
            entityManager.merge(fo);
            idx++;
        }

        // Capture the M2M state BEFORE mutating so we can emit an EXPLICIT relationship
        // FieldChange. A pure @ManyToMany collection change does not dirty the LotoPoint row, so
        // @PostUpdate / captureManyToManyCollections never fires for it — without this the join
        // change never syncs (and there is no FieldChange for drift to replay). Mirrors the
        // Equipment.lotoPoints emission above.
        Set<Long> beforePictureIds = pictureIds(point);
        for (com.dk_power.power_plant_java.dto.files.FileDto dto : uploaded) {
            FileObject managed = entityManager.getReference(FileObject.class, dto.getId());
            point.addPicture(managed);
        }
        LotoPoint saved = lotoPointRepo.save(point);
        fieldChangeTracker.trackRelationshipUpdateInCurrentTx(
                saved, "pictures", beforePictureIds, pictureIds(saved), "ManyToMany");
        return lotoPointMapper.convertToDto(saved);
    }

    /**
     * List every FileObject in the plant file library whose fileType is
     * "Picture" — the pool from which the "attach existing picture"
     * picker draws. Returns shallow FileDtos (id/name/link/extension only)
     * matching the shape the tile grid renders.
     */
    public java.util.List<com.dk_power.power_plant_java.dto.files.FileDto> listPictureLibrary() {
        com.dk_power.power_plant_java.entities.categories.Value pictureType =
                ngValueServiceProvider.getObject().createValue(FILE_TYPE_CATEGORY, PICTURE_FILE_TYPE);
        java.util.List<FileObject> files = entityManager.createQuery(
                "SELECT f FROM FileObject f WHERE f.fileType = :ft ORDER BY f.id DESC",
                FileObject.class
        ).setParameter("ft", pictureType).getResultList();
        java.util.List<com.dk_power.power_plant_java.dto.files.FileDto> dtos =
                new java.util.ArrayList<>(files.size());
        for (FileObject f : files) {
            com.dk_power.power_plant_java.dto.files.FileDto d =
                    new com.dk_power.power_plant_java.dto.files.FileDto();
            d.setId(f.getId());
            d.setName(f.getName());
            d.setFileLink(f.getFileLink());
            d.setExtension(f.getExtension());
            dtos.add(d);
        }
        return dtos;
    }

    /**
     * Link an EXISTING FileObject (already uploaded, already in the plant
     * file library) to this LOTO point. Same M2M join as uploadPictures,
     * but no upload — used by the "attach existing picture" picker where
     * the operator browses the picture library and picks one that was
     * uploaded from another point (or even from a walkdown session in the
     * future). Idempotent: attaching an already-linked file is a no-op.
     * The picker is expected to filter by fileType="Picture", but the
     * backend does not enforce that — attaching any FileObject is
     * technically permitted; the thumbnail simply won't render if it's
     * not an image, which is easier to explain than a hard 400 mismatch
     * error surfacing three UI layers up.
     */
    @Transactional
    public LotoPointDto linkPicture(Long lotoPointId, Long fileId) {
        if (fileId == null) throw new IllegalArgumentException("fileId is required");
        LotoPoint point = lotoPointRepo.findById(lotoPointId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "LotoPoint not found: " + lotoPointId));
        FileObject file = entityManager.find(FileObject.class, fileId);
        if (file == null) {
            throw new jakarta.persistence.EntityNotFoundException(
                    "FileObject not found: " + fileId);
        }
        Set<Long> beforePictureIds = pictureIds(point);
        point.addPicture(file);
        Set<Long> afterPictureIds = pictureIds(point);
        // Skip the M2M emission when nothing actually changed (the file was
        // already linked). save() is still called for safety, but avoiding
        // a phantom FieldChange keeps sync activity lean.
        LotoPoint saved = lotoPointRepo.save(point);
        if (!beforePictureIds.equals(afterPictureIds)) {
            fieldChangeTracker.trackRelationshipUpdateInCurrentTx(
                    saved, "pictures", beforePictureIds, afterPictureIds, "ManyToMany");
        }
        return lotoPointMapper.convertToDto(saved);
    }

    /**
     * Remove a picture from the LOTO point — unlinks the M2M join row only.
     * The FileObject itself is NOT deleted: it may be attached elsewhere, and
     * even when it isn't, deleting files needs its own SharePoint / disk
     * cleanup that lives in NgFileService. Idempotent — removing an already-
     * removed picture returns the DTO unchanged.
     */
    @Transactional
    public LotoPointDto removePicture(Long lotoPointId, Long fileId) {
        LotoPoint point = lotoPointRepo.findById(lotoPointId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "LotoPoint not found: " + lotoPointId));
        Set<Long> beforePictureIds = pictureIds(point);
        point.removePicture(fileId);
        LotoPoint saved = lotoPointRepo.save(point);
        // Explicit M2M emission — see uploadPicture (a pure collection change won't auto-capture).
        fieldChangeTracker.trackRelationshipUpdateInCurrentTx(
                saved, "pictures", beforePictureIds, pictureIds(saved), "ManyToMany");
        return lotoPointMapper.convertToDto(saved);
    }

}

