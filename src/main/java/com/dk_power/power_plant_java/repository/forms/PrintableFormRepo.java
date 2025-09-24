package com.dk_power.power_plant_java.repository.forms;

import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface PrintableFormRepo extends BaseRepository<PrintableForm> {
    Optional<PrintableForm> findByFormTypeAndIsPrimary(String permitType, boolean isPrimary);

    List<PrintableForm> findAllByFormType(String formType);
}
