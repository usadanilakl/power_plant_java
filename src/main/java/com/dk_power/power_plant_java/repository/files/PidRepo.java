package com.dk_power.power_plant_java.repository.files;

import com.dk_power.power_plant_java.entities.files.PID;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface PidRepo extends CrudRepository<PID,Long>{
    List<PID> findByName(String name);
    List<PID> findByNumber(String number);
    List<PID> findByVendor(String number);
    PID findPIDById(Long id);
    void deleteAllByVendor(String vendor);

}
