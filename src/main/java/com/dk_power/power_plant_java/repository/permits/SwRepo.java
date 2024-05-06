package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Sw;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
public interface SwRepo extends CrudRepository<Sw,Long> {
    List<Sw> findAll(Sort sort);
}
