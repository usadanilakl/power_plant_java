package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface BasePermitRepo <T extends BasePermit> extends CrudRepository<T,Long> {
    List<T> findAll(Sort sortBy);
    List<T> findByCreatedBy(String name);
    @Query("SELECT u FROM BasePermit u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    T getTempPermit(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM BasePermit e")
    Long findMaxPermitNum();


}
