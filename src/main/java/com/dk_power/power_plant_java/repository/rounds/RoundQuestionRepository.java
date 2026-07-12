package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundQuestionRepository extends JpaRepository<RoundQuestion, Long> {
    List<RoundQuestion> findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(Long roundId);
    RoundQuestion findFirstBySourceWebviewKey(String sourceWebviewKey);
    List<RoundQuestion> findByPhysicalObjectIdAndDeletedFalse(Long physicalObjectId);
}
