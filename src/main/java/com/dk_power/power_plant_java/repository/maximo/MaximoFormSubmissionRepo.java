package com.dk_power.power_plant_java.repository.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface MaximoFormSubmissionRepo extends BaseRepository<MaximoFormSubmission> {

    Optional<MaximoFormSubmission> findFirstBySubmissionKey(String submissionKey);

    List<MaximoFormSubmission> findByWonumOrderByDateModifiedDesc(String wonum);

    /** Newest submission for a form (any work order) — used to carry settings forward to a new run. */
    Optional<MaximoFormSubmission> findFirstByTemplateFormKeyOrderByDateModifiedDesc(String templateFormKey);
}
