package com.dk_power.power_plant_java.mappers.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramConnectionDto;
import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramConnectionRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DiagramConnectionMapper implements BaseMapper {
    private final DiagramConnectionRepo repo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public DiagramConnectionDto convertToDto(DiagramConnection entity) {
        if (entity == null) return null;
        DiagramConnectionDto dto = new DiagramConnectionDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getDiagram() != null) dto.setDiagramId(entity.getDiagram().getId());
        if (entity.getLocalId() != null) dto.setLocalId(entity.getLocalId());
        if (entity.getSourcePlacementLocalId() != null) dto.setSourcePlacementLocalId(entity.getSourcePlacementLocalId());
        if (entity.getTargetPlacementLocalId() != null) dto.setTargetPlacementLocalId(entity.getTargetPlacementLocalId());
        if (entity.getSourceAnchor() != null) dto.setSourceAnchor(entity.getSourceAnchor());
        if (entity.getTargetAnchor() != null) dto.setTargetAnchor(entity.getTargetAnchor());
        if (entity.getPipeTemplateId() != null) dto.setPipeTemplateId(entity.getPipeTemplateId());
        if (entity.getPipeName() != null) dto.setPipeName(entity.getPipeName());
        if (entity.getPipeParamsJson() != null) dto.setPipeParamsJson(entity.getPipeParamsJson());
        if (entity.getWaypointsJson() != null) dto.setWaypointsJson(entity.getWaypointsJson());
        if (entity.getLineStyle() != null) dto.setLineStyle(entity.getLineStyle());
        if (entity.getLineWidth() != null) dto.setLineWidth(entity.getLineWidth());
        if (entity.getColor() != null) dto.setColor(entity.getColor());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    /** Update an existing entity in-place from a DTO, preserving its ID and diagram reference. */
    public void updateEntity(DiagramConnection entity, DiagramConnectionDto dto) {
        if (dto == null || entity == null) return;
        if (dto.getLocalId() != null) entity.setLocalId(dto.getLocalId());
        if (dto.getSourcePlacementLocalId() != null) entity.setSourcePlacementLocalId(dto.getSourcePlacementLocalId());
        if (dto.getTargetPlacementLocalId() != null) entity.setTargetPlacementLocalId(dto.getTargetPlacementLocalId());
        if (dto.getSourceAnchor() != null) entity.setSourceAnchor(dto.getSourceAnchor());
        if (dto.getTargetAnchor() != null) entity.setTargetAnchor(dto.getTargetAnchor());
        if (dto.getPipeTemplateId() != null) entity.setPipeTemplateId(dto.getPipeTemplateId());
        if (dto.getPipeName() != null) entity.setPipeName(dto.getPipeName());
        if (dto.getPipeParamsJson() != null) entity.setPipeParamsJson(dto.getPipeParamsJson());
        if (dto.getWaypointsJson() != null) entity.setWaypointsJson(dto.getWaypointsJson());
        if (dto.getLineStyle() != null) entity.setLineStyle(dto.getLineStyle());
        if (dto.getLineWidth() != null) entity.setLineWidth(dto.getLineWidth());
        if (dto.getColor() != null) entity.setColor(dto.getColor());
    }

    public DiagramConnection convertToEntity(DiagramConnectionDto dto) {
        if (dto == null) return null;
        DiagramConnection entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new DiagramConnection());
        }
        if (entity == null) entity = new DiagramConnection();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getLocalId() != null) entity.setLocalId(dto.getLocalId());
        if (dto.getSourcePlacementLocalId() != null) entity.setSourcePlacementLocalId(dto.getSourcePlacementLocalId());
        if (dto.getTargetPlacementLocalId() != null) entity.setTargetPlacementLocalId(dto.getTargetPlacementLocalId());
        if (dto.getSourceAnchor() != null) entity.setSourceAnchor(dto.getSourceAnchor());
        if (dto.getTargetAnchor() != null) entity.setTargetAnchor(dto.getTargetAnchor());
        if (dto.getPipeTemplateId() != null) entity.setPipeTemplateId(dto.getPipeTemplateId());
        if (dto.getPipeName() != null) entity.setPipeName(dto.getPipeName());
        if (dto.getPipeParamsJson() != null) entity.setPipeParamsJson(dto.getPipeParamsJson());
        if (dto.getWaypointsJson() != null) entity.setWaypointsJson(dto.getWaypointsJson());
        if (dto.getLineStyle() != null) entity.setLineStyle(dto.getLineStyle());
        if (dto.getLineWidth() != null) entity.setLineWidth(dto.getLineWidth());
        if (dto.getColor() != null) entity.setColor(dto.getColor());
        return entity;
    }
}
