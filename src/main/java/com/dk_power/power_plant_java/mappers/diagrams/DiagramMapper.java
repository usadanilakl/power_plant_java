package com.dk_power.power_plant_java.mappers.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DiagramMapper implements BaseMapper {
    private final DiagramRepo repo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public DiagramDto convertToDto(Diagram entity) {
        if (entity == null) return null;
        DiagramDto dto = new DiagramDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getCanvasWidth() != null) dto.setCanvasWidth(entity.getCanvasWidth());
        if (entity.getCanvasHeight() != null) dto.setCanvasHeight(entity.getCanvasHeight());
        if (entity.getShapesJson() != null) dto.setShapesJson(entity.getShapesJson());
        if (entity.getConnectionsJson() != null) dto.setConnectionsJson(entity.getConnectionsJson());
        if (entity.getGridSize() != null) dto.setGridSize(entity.getGridSize());
        if (entity.getContextFileId() != null) dto.setContextFileId(entity.getContextFileId());
        if (entity.getContextFileName() != null) dto.setContextFileName(entity.getContextFileName());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    public Diagram convertToEntity(DiagramDto dto) {
        if (dto == null) return null;
        Diagram entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new Diagram());
        }
        if (entity == null) entity = new Diagram();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getCanvasWidth() != null) entity.setCanvasWidth(dto.getCanvasWidth());
        if (dto.getCanvasHeight() != null) entity.setCanvasHeight(dto.getCanvasHeight());
        if (dto.getShapesJson() != null) entity.setShapesJson(dto.getShapesJson());
        if (dto.getConnectionsJson() != null) entity.setConnectionsJson(dto.getConnectionsJson());
        if (dto.getGridSize() != null) entity.setGridSize(dto.getGridSize());
        entity.setContextFileId(dto.getContextFileId());
        entity.setContextFileName(dto.getContextFileName());
        return entity;
    }
}
