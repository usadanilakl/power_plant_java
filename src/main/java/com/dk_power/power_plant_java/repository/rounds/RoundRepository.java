package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByDeletedFalseOrderByNameAsc();
    List<Round> findByActiveTrueAndDeletedFalseOrderByNameAsc();
    Round findFirstBySourceTemplateAndDeletedFalse(String sourceTemplate);
}
