package com.dk_power.power_plant_java.repository.plant;

import org.springframework.data.repository.CrudRepository;

public interface GroupRepo<T> extends CrudRepository<T,Long> {
}
