package com.dk_power.power_plant_java.repository.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface MaximoFormTemplateRepo extends BaseRepository<MaximoFormTemplate> {

    Optional<MaximoFormTemplate> findFirstByFormKey(String formKey);

    List<MaximoFormTemplate> findAllByOrderByFormNameAsc();

    /** Templates with an exact pmnum match rule (for auto-associating a WO to its form). */
    List<MaximoFormTemplate> findByActiveTrueAndMatchPmnum(String matchPmnum);
}
