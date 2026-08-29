package com.dk_power.power_plant_java.repository.diagrams;

import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface DiagramPlacementRepo extends BaseRepository<DiagramPlacement> {
    List<DiagramPlacement> findByDiagramIdOrderByLocalIdAsc(Long diagramId);
    List<DiagramPlacement> findBySourceEntityTypeAndSourceEntityId(String sourceEntityType, Long sourceEntityId);
    void deleteByDiagramId(Long diagramId);
}
