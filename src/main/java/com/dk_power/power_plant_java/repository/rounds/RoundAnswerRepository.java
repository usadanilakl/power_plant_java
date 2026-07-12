package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundAnswerRepository extends JpaRepository<RoundAnswer, Long> {
    List<RoundAnswer> findByInstance_Id(Long instanceId);
    List<RoundAnswer> findByQuestionIdOrderByAnsweredAtDesc(Long questionId);
}
