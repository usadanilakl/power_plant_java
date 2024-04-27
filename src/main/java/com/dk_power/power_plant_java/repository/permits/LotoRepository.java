package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.model.permits.Loto;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

@Transactional
public interface LotoRepository extends CrudRepository<Loto,Long> {
}
