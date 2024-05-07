package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.TicketTemp;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
public interface TicketTempRepo extends CrudRepository<TicketTemp,String> {
    List<TicketTemp> findAll(Sort sort);
}
