package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.entities.TagNumber;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagNumberRepo extends JpaRepository<TagNumber, Long> {
}
