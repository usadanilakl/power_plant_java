package com.dk_power.power_plant_java.mappers.sim_equipment;

import com.dk_power.power_plant_java.dto.sim_equipment.SimEquipmentDto;
import com.dk_power.power_plant_java.entities.sim_equipment.SimEquipment;
import com.dk_power.power_plant_java.entities.sim_equipment.SimRole;
import com.dk_power.power_plant_java.entities.sim_equipment.SourceEntityType;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.sim_equipment.SimEquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SimEquipmentMapper implements BaseMapper {
    private final SimEquipmentRepo repo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public SimEquipmentDto convertToDto(SimEquipment entity) {
        if (entity == null) return null;
        SimEquipmentDto dto = new SimEquipmentDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getSymbolId() != null) dto.setSymbolId(entity.getSymbolId());
        if (entity.getSvgPath() != null) dto.setSvgPath(entity.getSvgPath());
        if (entity.getDefaultWidth() != null) dto.setDefaultWidth(entity.getDefaultWidth());
        if (entity.getDefaultHeight() != null) dto.setDefaultHeight(entity.getDefaultHeight());
        if (entity.getDefaultColor() != null) dto.setDefaultColor(entity.getDefaultColor());
        if (entity.getSimRole() != null) dto.setSimRole(entity.getSimRole().name().toLowerCase());
        if (entity.getSimParamsJson() != null) dto.setSimParamsJson(entity.getSimParamsJson());
        if (entity.getSourceEntityType() != null) dto.setSourceEntityType(formatSourceEntityType(entity.getSourceEntityType()));
        if (entity.getSourceEntityId() != null) dto.setSourceEntityId(entity.getSourceEntityId());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    public SimEquipment convertToEntity(SimEquipmentDto dto) {
        if (dto == null) return null;
        SimEquipment entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new SimEquipment());
        }
        if (entity == null) entity = new SimEquipment();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getSymbolId() != null) entity.setSymbolId(dto.getSymbolId());
        if (dto.getSvgPath() != null) entity.setSvgPath(dto.getSvgPath());
        if (dto.getDefaultWidth() != null) entity.setDefaultWidth(dto.getDefaultWidth());
        if (dto.getDefaultHeight() != null) entity.setDefaultHeight(dto.getDefaultHeight());
        if (dto.getDefaultColor() != null) entity.setDefaultColor(dto.getDefaultColor());
        if (dto.getSimRole() != null) entity.setSimRole(parseSimRole(dto.getSimRole()));
        if (dto.getSimParamsJson() != null) entity.setSimParamsJson(dto.getSimParamsJson());
        if (dto.getSourceEntityType() != null) entity.setSourceEntityType(parseSourceEntityType(dto.getSourceEntityType()));
        if (dto.getSourceEntityId() != null) entity.setSourceEntityId(dto.getSourceEntityId());
        return entity;
    }

    private SimRole parseSimRole(String value) {
        return SimRole.valueOf(value.trim().toUpperCase());
    }

    private SourceEntityType parseSourceEntityType(String value) {
        String normalized = value.trim().toUpperCase().replace('-', '_');
        if ("LOTPOINT".equals(normalized) || "LOTOPOINT".equals(normalized)) {
            normalized = "LOTO_POINT";
        }
        return SourceEntityType.valueOf(normalized);
    }

    private String formatSourceEntityType(SourceEntityType value) {
        return switch (value) {
            case EQUIPMENT -> "Equipment";
            case LOTO_POINT -> "LotoPoint";
        };
    }
}
