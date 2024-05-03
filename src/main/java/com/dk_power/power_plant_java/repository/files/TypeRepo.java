package com.dk_power.power_plant_java.repository.files;

import com.dk_power.power_plant_java.entities.files.Type;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface TypeRepo extends CrudRepository<Type,Long> {
    List<Type> findBySection(String section);
    List<Type> findByName(String name);

}
