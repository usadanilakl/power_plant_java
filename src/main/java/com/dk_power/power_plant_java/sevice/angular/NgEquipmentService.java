package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentIdDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class NgEquipmentService implements NgCrudService<Equipment, EquipmentDto, EquipmentRepo, EquipmentMapper> {
    private final EquipmentRepo equipmentRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final EquipmentMapper equipmentMapper;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;

    public NgEquipmentService(EquipmentRepo equipmentRepo, SessionFactory sessionFactory, EntityManager entityManager, EquipmentMapper equipmentMapper, @Lazy NgFileService fileService, @Lazy NgLotoPointService lotoPointService) {
        this.equipmentRepo = equipmentRepo;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.equipmentMapper = equipmentMapper;
        this.fileService = fileService;
        this.lotoPointService = lotoPointService;
    }

    @Override
    public EquipmentRepo getRepo() {
        return this.equipmentRepo;
    }

    @Override
    public EquipmentMapper getMapper() {
        return this.equipmentMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public EquipmentDto getDto() {
        return new EquipmentDto();
    }

    @Override
    public Equipment getEntity() {
        return new Equipment();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Equipment> getEntityClass() {
        return Equipment.class;
    }

    public Optional<Equipment> findById(Long id) {
        return equipmentRepo.findById(id);
    }

    public Optional<EquipmentDto> findDtoById(Long id) {
        return findById(id).map(equipmentMapper::convertToDto);
    }

    public Page<EquipmentDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("tagNumber", searchString);
        searchCriteria.put("description", searchString);
        searchCriteria.put("location.name", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "tagNumber", "asc", false);
    }

    @Override
    public EquipmentDto toDto(Equipment entity) {
        return this.equipmentMapper.convertToDto(entity);
    }

    @Override
    public Equipment toEntity(EquipmentDto dto) {
        return this.equipmentMapper.convertToEntity(dto);
    }

    public String getMainImage(Long id) {
        Optional<Equipment> byId = findById(id);
        if (byId.isPresent()) {
            Equipment equipment = byId.get();
            FileObject mainFile = equipment.getMainFile();
            if (mainFile != null) {
                return mainFile.getFileLink();
            }
            throw new RuntimeException("No main image found for Equipment with id: " + id);
        }
        throw new RuntimeException("Equipment not found with id: " + id);
    }

    public List<String> getAllImages(Long id) {
        Optional<Equipment> byId = findById(id);
        if (byId.isPresent()) {
            Equipment equipment = byId.get();
            List<FileObject> files = equipment.getFiles();
            List<String> imageUrls = new ArrayList<>();
            for (FileObject file : files) {
                imageUrls.add(file.getFileLink());
            }
            if (imageUrls.isEmpty()) {
                throw new RuntimeException("No images found for Equipment with id: " + id);
            }
            return imageUrls;
        }
        throw new RuntimeException("Equipment not found with id: " + id);
    }

    public List<EquipmentDto> getByEquipmentType(String equipmentType) {
        return equipmentRepo.getByEqType_name(equipmentType).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public static String getTagNumberBase(String tagNumber) {
        if (tagNumber == null || tagNumber.isEmpty()) {
            return "";
        }

        // Remove all spaces and convert to uppercase
        String cleanedTag = tagNumber.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        List<String> systems = EquipmentDto.SYSTEMS;

        int index = 0;
        for (String system : systems) {
            int systemIndex = cleanedTag.indexOf(system);
            if (systemIndex >= 0) {
                index = systemIndex;
                break;
            }
        }

        if (index == 0) return tagNumber;
        return cleanedTag.substring(index, index + 6);
    }

    public Equipment idDtoToEntity(EquipmentIdDto equipmentDto) {
        return equipmentMapper.convertIdDtoToEntity(equipmentDto);
    }

    public Equipment processEquipment(EquipmentIdDto equipmentDto) {
        if (equipmentDto == null) {
            throw new IllegalArgumentException("EquipmentDto cannot be null");
        }
        Equipment equipment = idDtoToEntity(equipmentDto);
        if (equipmentDto.getId() != null && equipmentDto.getId() != 0) {
            return save(equipment);
        }
        FileObject mainFile = equipment.getMainFile();

        //This is temporary fix, need to change client side setup to reference files by id, not by link.
        if (mainFile == null) {
            String link = equipmentDto.getMainFile();
            int index = link.lastIndexOf('.');
            String extension = link.substring(index + 1);
            String newLink = link.replaceAll(extension, "pdf");
            FileDto byFileLink = fileService.findByFileLink(newLink);
            if (byFileLink != null) {
                mainFile = fileService.toEntity(byFileLink);
            }
        }
        if (mainFile != null) {
            mainFile = fileService.getEntityById(mainFile.getId());
            equipment.setMainFile(mainFile);
            Equipment saved = save(equipment);
            mainFile.addPoint(equipment);
            fileService.save(mainFile);
            return saved;
        }
        return null;

    }

    public EquipmentDto copyEquipment(Long eqId, Long fileId) {
        Equipment sourcePoint = findById(eqId).orElseThrow(() -> new RuntimeException("Equipment not found with id: " + eqId));
        Equipment processedEq = new Equipment();

        // Copy basic properties
        processedEq.setCoordinates(sourcePoint.getCoordinates());
        processedEq.setOriginalPictureSize(sourcePoint.getOriginalPictureSize());
        processedEq.setSystem(sourcePoint.getSystem());
        processedEq.setLocation(sourcePoint.getLocation());
        processedEq.setVendor(sourcePoint.getVendor());
        processedEq.setEqType(sourcePoint.getEqType());
        processedEq.setLotoPoints(new HashSet<>());

        // Process tag number and description
        String sourceTagNumber = sourcePoint.getTagNumber();
        String destinationTagNumber;
        String destDescription = "";

        if (sourceTagNumber.startsWith("01")) {
            destinationTagNumber = "02" + sourceTagNumber.substring(2);
            if (sourcePoint.getDescription() != null) {
                destDescription = processDescription(sourcePoint.getDescription(), "01", "02");
            }
        } else if (sourceTagNumber.startsWith("02")) {
            destinationTagNumber = "01" + sourceTagNumber.substring(2);
            if (sourcePoint.getDescription() != null) {
                destDescription = processDescription(sourcePoint.getDescription(), "02", "01");
            }
        } else {
            // If it doesn't start with 01 or 02, keep the original tag number
            destinationTagNumber = sourceTagNumber;
            destDescription = sourcePoint.getDescription();
        }

        processedEq.setTagNumber(destinationTagNumber);
        processedEq.setDescription(destDescription);

        // Set the main file
        FileObject mainFile = fileService.getEntityById(fileId);
        processedEq.setMainFile(mainFile);

        // Copy LOTO points
        Set<LotoPoint> lotoPoints = sourcePoint.getLotoPoints();
        if (lotoPoints != null) {
            for (LotoPoint lp : lotoPoints) {
                LotoPoint point = lotoPointService.copyPointFromOtherUnit(lp.getId());
                processedEq.getLotoPoints().add(point);
            }
        }

        Equipment savedEquipment = save(processedEq);

        // Add the equipment to the file's points
        mainFile.addPoint(savedEquipment);
        fileService.save(mainFile);

        return toDto(savedEquipment);

    }

    private String processDescription(String description, String fromUnit, String toUnit) {
        return Arrays.stream(description.split(" "))
                .map(e -> {
                    if (e.startsWith(fromUnit)) return toUnit + e.substring(2);
                    else return e;
                })
                .collect(Collectors.joining(" "))
                .replaceAll("Unit" + fromUnit.charAt(1), "Unit" + toUnit.charAt(1))
                .replaceAll("Unit " + fromUnit.charAt(1), "Unit " + toUnit.charAt(1))
                .replaceAll("U" + fromUnit.charAt(1), "U" + toUnit.charAt(1));
    }

    public List<EquipmentDto> getByTagNumber(String tagNumber) {
        List<Equipment> byTagNumber = equipmentRepo.findByTagNumber(tagNumber);
        return byTagNumber.stream().map(this::toDto).collect(Collectors.toList());

    }

    public List<FileDto> getRelatedFiles(Long id) {
        Equipment equipment = findById(id).orElseThrow(() -> new RuntimeException("Equipment not found with id: " + id));

        // Get all related equipment, including the original equipment
        Set<Equipment> relatedEquipment = new HashSet<>();
        relatedEquipment.add(equipment);
        relatedEquipment.addAll(equipment.getLotoPoints().stream()
                .flatMap(lotoPoint -> lotoPoint.getEquipmentList().stream())
                .collect(Collectors.toSet()));

        // Collect files from all related equipment
        Set<FileObject> relatedFiles = relatedEquipment.stream()
                .map(Equipment::getMainFile)
                .collect(Collectors.toSet());

        return relatedFiles.stream()
                .map(fileService::toDto)
                .collect(Collectors.toList());
    }

    public List<Equipment> getAllWithMultipleLotoPoints() {
        return this.equipmentRepo.findAllWithMultipleLotoPoints();
    }
}