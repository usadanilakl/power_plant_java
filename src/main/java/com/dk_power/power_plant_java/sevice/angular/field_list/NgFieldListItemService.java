package com.dk_power.power_plant_java.sevice.angular.field_list;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgFieldListItemService {

    private final FieldListItemRepo repo;
    private final FieldListItemMapper mapper;
    private final NgValueService valueService;

    public List<FieldListItemDto> getAll() {
        return repo.findAll().stream().map(mapper::convertToDto).toList();
    }

    public List<FieldListItemDto> getByListType(String listTypeName) {
        return repo.findByListType_NameIgnoreCase(listTypeName).stream()
                .map(mapper::convertToDto).toList();
    }

    public List<FieldListItemDto> getByStatus(String statusName) {
        return repo.findByStatus_NameIgnoreCase(statusName).stream()
                .map(mapper::convertToDto).toList();
    }

    private static final List<String> OPEN_STATUSES = List.of("Open", "In Progress");

    public List<FieldListItemDto> getOpenItems() {
        return repo.findByStatus_NameIn(OPEN_STATUSES).stream()
                .map(mapper::convertToDto).toList();
    }

    public List<FieldListItemDto> getOpenItemsByListType(String listTypeName) {
        return repo.findByListType_NameIgnoreCaseAndStatus_NameIn(listTypeName, OPEN_STATUSES).stream()
                .map(mapper::convertToDto).toList();
    }

    public FieldListItemDto getDtoById(Long id) {
        return repo.findById(id).map(mapper::convertToDto).orElse(null);
    }

    public FieldListItem getEntity() {
        return new FieldListItem();
    }

    public FieldListItemDto save(FieldListItemDto dto) {
        FieldListItem entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId()).orElse(new FieldListItem());
        } else {
            entity = new FieldListItem();
        }

        entity.setTitle(dto.getTitle());
        entity.setNotes(dto.getNotes());
        entity.setDateObserved(dto.getDateObserved());
        entity.setTimeObserved(dto.getTimeObserved());
        entity.setSpecificLocation(dto.getSpecificLocation());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        } else if (entity.getStatus() == null) {
            entity.setStatus(valueService.createValue("FieldListStatus", "Open"));
        }
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }

        mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);

        entity = repo.save(entity);
        return mapper.convertToDto(entity);
    }

    public void softDelete(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }
}
