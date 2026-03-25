package com.dk_power.power_plant_java.repository.diagrams;

import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface DiagramRepo extends BaseRepository<Diagram> {
    List<Diagram> findByNameContainingIgnoreCase(String name);
    List<Diagram> findByContextFileIdOrderByDateModifiedDesc(Long contextFileId);
}
