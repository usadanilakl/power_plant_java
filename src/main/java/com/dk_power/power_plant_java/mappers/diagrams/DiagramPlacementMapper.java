package com.dk_power.power_plant_java.mappers.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramPlacementDto;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramPlacementRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DiagramPlacementMapper implements BaseMapper {
    private final DiagramPlacementRepo repo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public DiagramPlacementDto convertToDto(DiagramPlacement entity) {
        if (entity == null) return null;
        DiagramPlacementDto dto = new DiagramPlacementDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getDiagram() != null) dto.setDiagramId(entity.getDiagram().getId());
        if (entity.getLocalId() != null) dto.setLocalId(entity.getLocalId());
        if (entity.getSimRole() != null) dto.setSimRole(entity.getSimRole());
        if (entity.getSimParamsJson() != null) dto.setSimParamsJson(entity.getSimParamsJson());
        if (entity.getSimEquipmentId() != null) dto.setSimEquipmentId(entity.getSimEquipmentId());
        if (entity.getSourceEntityType() != null) dto.setSourceEntityType(entity.getSourceEntityType());
        if (entity.getSourceEntityId() != null) dto.setSourceEntityId(entity.getSourceEntityId());
        if (entity.getX() != null) dto.setX(entity.getX());
        if (entity.getY() != null) dto.setY(entity.getY());
        if (entity.getWidth() != null) dto.setWidth(entity.getWidth());
        if (entity.getHeight() != null) dto.setHeight(entity.getHeight());
        if (entity.getRotation() != null) dto.setRotation(entity.getRotation());
        if (entity.getColor() != null) dto.setColor(entity.getColor());
        if (entity.getFillColor() != null) dto.setFillColor(entity.getFillColor());
        if (entity.getLineWidth() != null) dto.setLineWidth(entity.getLineWidth());
        if (entity.getLabel() != null) dto.setLabel(entity.getLabel());
        if (entity.getZIndex() != null) dto.setZIndex(entity.getZIndex());
        if (entity.getLocked() != null) dto.setLocked(entity.getLocked());
        if (entity.getGroupId() != null) dto.setGroupId(entity.getGroupId());
        if (entity.getType() != null) dto.setType(entity.getType());
        if (entity.getSymbolId() != null) dto.setSymbolId(entity.getSymbolId());
        if (entity.getSvgPath() != null) dto.setSvgPath(entity.getSvgPath());
        if (entity.getOriginalWidth() != null) dto.setOriginalWidth(entity.getOriginalWidth());
        if (entity.getOriginalHeight() != null) dto.setOriginalHeight(entity.getOriginalHeight());
        if (entity.getText() != null) dto.setText(entity.getText());
        if (entity.getFontSize() != null) dto.setFontSize(entity.getFontSize());
        if (entity.getFontFamily() != null) dto.setFontFamily(entity.getFontFamily());
        if (entity.getRadius() != null) dto.setRadius(entity.getRadius());
        if (entity.getStartX() != null) dto.setStartX(entity.getStartX());
        if (entity.getStartY() != null) dto.setStartY(entity.getStartY());
        if (entity.getEndX() != null) dto.setEndX(entity.getEndX());
        if (entity.getEndY() != null) dto.setEndY(entity.getEndY());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    /** Update an existing entity in-place from a DTO, preserving its ID and diagram reference. */
    public void updateEntity(DiagramPlacement entity, DiagramPlacementDto dto) {
        if (dto == null || entity == null) return;
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getLocalId() != null) entity.setLocalId(dto.getLocalId());
        if (dto.getSimRole() != null) entity.setSimRole(dto.getSimRole());
        if (dto.getSimParamsJson() != null) entity.setSimParamsJson(dto.getSimParamsJson());
        if (dto.getSimEquipmentId() != null) entity.setSimEquipmentId(dto.getSimEquipmentId());
        if (dto.getSourceEntityType() != null) entity.setSourceEntityType(dto.getSourceEntityType());
        if (dto.getSourceEntityId() != null) entity.setSourceEntityId(dto.getSourceEntityId());
        if (dto.getX() != null) entity.setX(dto.getX());
        if (dto.getY() != null) entity.setY(dto.getY());
        if (dto.getWidth() != null) entity.setWidth(dto.getWidth());
        if (dto.getHeight() != null) entity.setHeight(dto.getHeight());
        if (dto.getRotation() != null) entity.setRotation(dto.getRotation());
        if (dto.getColor() != null) entity.setColor(dto.getColor());
        if (dto.getFillColor() != null) entity.setFillColor(dto.getFillColor());
        if (dto.getLineWidth() != null) entity.setLineWidth(dto.getLineWidth());
        if (dto.getLabel() != null) entity.setLabel(dto.getLabel());
        if (dto.getZIndex() != null) entity.setZIndex(dto.getZIndex());
        if (dto.getLocked() != null) entity.setLocked(dto.getLocked());
        if (dto.getGroupId() != null) entity.setGroupId(dto.getGroupId());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getSymbolId() != null) entity.setSymbolId(dto.getSymbolId());
        if (dto.getSvgPath() != null) entity.setSvgPath(dto.getSvgPath());
        if (dto.getOriginalWidth() != null) entity.setOriginalWidth(dto.getOriginalWidth());
        if (dto.getOriginalHeight() != null) entity.setOriginalHeight(dto.getOriginalHeight());
        if (dto.getText() != null) entity.setText(dto.getText());
        if (dto.getFontSize() != null) entity.setFontSize(dto.getFontSize());
        if (dto.getFontFamily() != null) entity.setFontFamily(dto.getFontFamily());
        if (dto.getRadius() != null) entity.setRadius(dto.getRadius());
        if (dto.getStartX() != null) entity.setStartX(dto.getStartX());
        if (dto.getStartY() != null) entity.setStartY(dto.getStartY());
        if (dto.getEndX() != null) entity.setEndX(dto.getEndX());
        if (dto.getEndY() != null) entity.setEndY(dto.getEndY());
    }

    public DiagramPlacement convertToEntity(DiagramPlacementDto dto) {
        if (dto == null) return null;
        DiagramPlacement entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new DiagramPlacement());
        }
        if (entity == null) entity = new DiagramPlacement();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getLocalId() != null) entity.setLocalId(dto.getLocalId());
        if (dto.getSimRole() != null) entity.setSimRole(dto.getSimRole());
        if (dto.getSimParamsJson() != null) entity.setSimParamsJson(dto.getSimParamsJson());
        if (dto.getSimEquipmentId() != null) entity.setSimEquipmentId(dto.getSimEquipmentId());
        if (dto.getSourceEntityType() != null) entity.setSourceEntityType(dto.getSourceEntityType());
        if (dto.getSourceEntityId() != null) entity.setSourceEntityId(dto.getSourceEntityId());
        if (dto.getX() != null) entity.setX(dto.getX());
        if (dto.getY() != null) entity.setY(dto.getY());
        if (dto.getWidth() != null) entity.setWidth(dto.getWidth());
        if (dto.getHeight() != null) entity.setHeight(dto.getHeight());
        if (dto.getRotation() != null) entity.setRotation(dto.getRotation());
        if (dto.getColor() != null) entity.setColor(dto.getColor());
        if (dto.getFillColor() != null) entity.setFillColor(dto.getFillColor());
        if (dto.getLineWidth() != null) entity.setLineWidth(dto.getLineWidth());
        if (dto.getLabel() != null) entity.setLabel(dto.getLabel());
        if (dto.getZIndex() != null) entity.setZIndex(dto.getZIndex());
        if (dto.getLocked() != null) entity.setLocked(dto.getLocked());
        if (dto.getGroupId() != null) entity.setGroupId(dto.getGroupId());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getSymbolId() != null) entity.setSymbolId(dto.getSymbolId());
        if (dto.getSvgPath() != null) entity.setSvgPath(dto.getSvgPath());
        if (dto.getOriginalWidth() != null) entity.setOriginalWidth(dto.getOriginalWidth());
        if (dto.getOriginalHeight() != null) entity.setOriginalHeight(dto.getOriginalHeight());
        if (dto.getText() != null) entity.setText(dto.getText());
        if (dto.getFontSize() != null) entity.setFontSize(dto.getFontSize());
        if (dto.getFontFamily() != null) entity.setFontFamily(dto.getFontFamily());
        if (dto.getRadius() != null) entity.setRadius(dto.getRadius());
        if (dto.getStartX() != null) entity.setStartX(dto.getStartX());
        if (dto.getStartY() != null) entity.setStartY(dto.getStartY());
        if (dto.getEndX() != null) entity.setEndX(dto.getEndX());
        if (dto.getEndY() != null) entity.setEndY(dto.getEndY());
        return entity;
    }
}
