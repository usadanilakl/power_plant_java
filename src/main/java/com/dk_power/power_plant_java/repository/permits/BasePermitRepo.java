package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface BasePermitRepo <T extends BasePermit> extends CrudRepository<T,Long> {
    List<T> findAll(Sort sortBy);
    T findByCreatedBy(String name);

}
