package com.dk_power.power_plant_java.repository.permits.hot_work_repo;


import com.dk_power.power_plant_java.entities.permits.hot_works.Hw;
import org.springframework.data.repository.CrudRepository;

public interface HwRepo extends CrudRepository<Hw,Long> {
}
