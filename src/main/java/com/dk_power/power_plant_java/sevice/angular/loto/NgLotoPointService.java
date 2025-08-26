package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
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


    public Optional<LotoPoint> findById(Long id) {
        return lotoPointRepo.findById(id);
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

@Transactional
public LotoPoint processLotoPoint(LotoPointIdDto lotoPointDto) {
    System.out.println(lotoPointDto.getIsoPos() + " - Processing LotoPoint");
    LotoPoint entity = convertIdDtoToEntity(lotoPointDto);
    entity = lotoPointRepo.save(entity);
    System.out.println("entity.getIsoPos().getName() = " + entity.getIsoPos().getName());
    Long savedLpId = entity.getId();

    if (lotoPointDto.getEquipmentIdList() != null && !lotoPointDto.getEquipmentIdList().isEmpty()) {
        Set<Long> ids = new HashSet<>(lotoPointDto.getEquipmentIdList());
        System.out.println("Equipment IDs: " + ids);

        for (Long id : ids) {
            Equipment equipment = equipmentService.getEntityById(id);
            if (equipment != null) {
                // Update both sides of the relationship
                LotoPoint lotoPoint = lotoPointRepo.findById(savedLpId).orElse(null);
                System.out.println("equipment.getLotoPoints().size() = " + equipment.getLotoPoints().size());
                equipment.addLotoPoint(lotoPoint);
                System.out.println("equipment.getLotoPoints().size() = " + equipment.getLotoPoints().size());
                equipmentService.save(equipment);
                lotoPoint.addEquipment(equipment);
                lotoPointRepo.save(lotoPoint);
            }
        }
    }

    return getEntityById(savedLpId);
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
}

