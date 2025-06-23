package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
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
public class NgEquipmentService implements NgCrudService<Equipment, EquipmentDto, EquipmentRepo, EquipmentMapper> {
    private final EquipmentRepo equipmentRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final EquipmentMapper equipmentMapper;

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

    public String getTagNumberBase(String tagNumber) {
        if (tagNumber == null || tagNumber.isEmpty()) {
            return "";
        }

        // Remove all spaces and convert to uppercase
        String cleanedTag = tagNumber.replaceAll("\\s+", "").toUpperCase();

        // Regular expression to match the pattern
        String regex = "\\d{2}-?[A-Z]+-?([A-Z]{2,4})(\\d{3,4})";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(regex);
        java.util.regex.Matcher matcher = pattern.matcher(cleanedTag);

        if (matcher.find()) {
            String system = matcher.group(1);
            String number = matcher.group(2);
            return system + number;
        }

        // If no match found, try a more lenient approach
        String lenientRegex = "([A-Z]{2,4})(\\d{3,4})";
        pattern = java.util.regex.Pattern.compile(lenientRegex);
        matcher = pattern.matcher(cleanedTag);

        if (matcher.find()) {
            String system = matcher.group(1);
            String number = matcher.group(2);
            return system + number;
        }

        // If still no match, return the original string
        return tagNumber;
    }
}