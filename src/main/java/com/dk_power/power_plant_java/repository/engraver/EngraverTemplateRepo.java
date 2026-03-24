package com.dk_power.power_plant_java.repository.engraver;

import com.dk_power.power_plant_java.entities.engraver.EngraverTemplate;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface EngraverTemplateRepo extends BaseRepository<EngraverTemplate> {
    List<EngraverTemplate> findByTagSizeAndDataStructure(String tagSize, String dataStructure);
    List<EngraverTemplate> findByTagSize(String tagSize);
    Optional<EngraverTemplate> findFirstByFilename(String filename);
}
