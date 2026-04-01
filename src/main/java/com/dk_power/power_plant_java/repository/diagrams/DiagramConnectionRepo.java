package com.dk_power.power_plant_java.repository.diagrams;

import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface DiagramConnectionRepo extends BaseRepository<DiagramConnection> {
    List<DiagramConnection> findByDiagramIdOrderByLocalIdAsc(Long diagramId);
    void deleteByDiagramId(Long diagramId);
}
