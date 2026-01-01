
package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgZeroEnergyService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class ZeroEnergyMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final NgZeroEnergyService zeroEnergyService;
    private final LotoPointService lotoPointService;
    private final NgEquipmentService equipmentService;

    public ZeroEnergyMapper(ModelMapper modelMapper,
                            ValueService valueService,
                            @Lazy NgZeroEnergyService zeroEnergyService,
                            @Lazy LotoPointService lotoPointService,
                            @Lazy NgEquipmentService equipmentService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.zeroEnergyService = zeroEnergyService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyDto with full object references.
     */
    public ZeroEnergyDto convertToDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyDto dto = new ZeroEnergyDto();

        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplate(valueService.convertToDto(entity.getZeroEnergyTemplate()));
        }

        // Set template equipment IDs
        if (entity.getTemplateEquipmentIds() != null && !entity.getTemplateEquipmentIds().isEmpty()) {
            List<Long> list = entity.getTemplateEquipmentIds().stream().filter(e -> e != 0).toList();
            if(!list.isEmpty()){
                dto.setTemplateEquipmentIds(new ArrayList<>(list));

                // Load equipment by IDs
                List<EquipmentDto> equipmentDtos = new ArrayList<>();
                for (Long equipmentId : entity.getTemplateEquipmentIds()) {
                    equipmentService.findById(equipmentId).ifPresent(equipment -> {
                        equipmentDtos.add(equipmentService.toDto(equipment));
                    });
                }

                dto.setTemplateEquipment(equipmentDtos);
            }
        }

        // Resolved method from @Transient getter
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyIdDto with ID references only.
     */
    public ZeroEnergyIdDto convertToIdDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyIdDto dto = new ZeroEnergyIdDto();
        
        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields - IDs only
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplateId(entity.getZeroEnergyTemplate().getId());
        }

        // Set template equipment IDs
        if (entity.getTemplateEquipmentIds() != null && !entity.getTemplateEquipmentIds().isEmpty()) {
            dto.setTemplateEquipmentIds(new ArrayList<>(entity.getTemplateEquipmentIds()));
        }

        // Resolved method from @Transient getter
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Converts ZeroEnergyDto to ZeroEnergy entity.
     */
    public ZeroEnergy convertToEntity(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.getEntityById(dto.getId());
        }

        // Base fields
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplate() != null) {
            entity.setZeroEnergyTemplate(valueService.convertToEntity(dto.getZeroEnergyTemplate()));
        }

        // Set template equipment IDs directly if provided
        if (dto.getTemplateEquipmentIds() != null && !dto.getTemplateEquipmentIds().isEmpty()) {
            entity.setTemplateEquipmentIdsList(dto.getTemplateEquipmentIds());
        }

        return entity;
    }

    /**
     * Converts ZeroEnergyIdDto to ZeroEnergy entity.
     * Uses ID references to load related entities.
     */
    public ZeroEnergy convertIdDtoToEntity(ZeroEnergyIdDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.findById(dto.getId()).orElse(new ZeroEnergy());
        }

        // Base fields
        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplateId() != null) {
            entity.setZeroEnergyTemplate(valueService.findById(dto.getZeroEnergyTemplateId()).orElse(null));
        }

        // Set template equipment IDs
        if (dto.getTemplateEquipmentIds() != null && !dto.getTemplateEquipmentIds().isEmpty()) {
            entity.setTemplateEquipmentIdsList(dto.getTemplateEquipmentIds());
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
