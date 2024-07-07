package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities2.loto.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

public interface LockRepo extends JpaRepository<Lock,Long> {
}
