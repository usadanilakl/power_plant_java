package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointSummaryDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.base.FuzzySearchService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
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
                "location.name", "isoPos.name", "normPos.name"
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

    public Page<LotoPointDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("tagNumber", searchString);
        searchCriteria.put("description", searchString);
        searchCriteria.put("specificLocation", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
//        return complexSearch(sc).stream().map(this::toDto).toList();
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
    public LotoPoint processLotoPoint(LotoPointIdDto lotoPointDto) {
        System.out.println(lotoPointDto.getIsoPos() + " - Processing LotoPoint");
        LotoPoint entity = convertIdDtoToEntity(lotoPointDto);
        entity = lotoPointRepo.save(entity);
        System.out.println("entity.getIsoPos().getName() = " + entity.getIsoPos().getName());
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
                // Equipment is the owning side, so remove from its collection
                equipment.getLotoPoints().remove(lotoPoint);
                equipmentService.save(equipment);
                System.out.println("Removed LotoPoint from Equipment ID: " + equipmentId);
            }
        }

        // Add new equipment associations
        for (Long equipmentId : toAdd) {
            Equipment equipment = equipmentService.getEntityById(equipmentId);
            if (equipment != null) {
                // Equipment is the owning side with @JoinTable
                // Only need to update this side for persistence
                equipment.addLotoPoint(lotoPoint);
                equipmentService.save(equipment);
                System.out.println("Added LotoPoint to Equipment ID: " + equipmentId);
            }
        }

        // Flush changes to database and clear persistence context
        if (!toRemove.isEmpty() || !toAdd.isEmpty()) {
            entityManager.flush();
            entityManager.clear();
        }

        // Fetch with equipment list eagerly loaded (will reflect database state)
        return lotoPointRepo.findByIdWithEquipment(savedLpId);
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
                .zeroEnergyMethod(lp.getZeroEnergy() != null
                        ? lp.getZeroEnergy().getMethod()
                        : null)
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

}

