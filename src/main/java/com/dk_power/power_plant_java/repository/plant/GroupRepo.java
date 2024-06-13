package com.dk_power.power_plant_java.repository.plant;


import com.dk_power.power_plant_java.entities.plant.Group;
import jakarta.transaction.Transactional;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

@Transactional
public interface GroupRepo<T extends Group> extends CrudRepository<T,Long> {
    Group findByName(String name);
}
