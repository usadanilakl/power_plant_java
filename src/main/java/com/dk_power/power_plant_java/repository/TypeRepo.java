package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.model.Type;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface TypeRepo extends CrudRepository<Type,Long> {
    List<Type> findBySection(String section);
    List<Type> findByName(String name);

}
