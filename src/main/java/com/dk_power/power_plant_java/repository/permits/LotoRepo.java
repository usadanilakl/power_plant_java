package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Loto;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
public interface LotoRepo extends CrudRepository<Loto,Long> {
    List<Loto> findAll(Sort sort);
    List<Loto> findLotosByWorkScopeContaining(String searchValue);
}
