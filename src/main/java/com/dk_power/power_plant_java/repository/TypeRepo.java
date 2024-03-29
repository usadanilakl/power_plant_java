package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.model.Type;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface TypeRepo extends CrudRepository<Type,Long> {
    List<Type> findByGroup(String group);
    List<Type> findByCategory(String type);

}
