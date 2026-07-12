package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundIssue;
import com.dk_power.power_plant_java.entities.rounds.RoundIssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundIssueRepository extends JpaRepository<RoundIssue, Long> {
    List<RoundIssue> findByStatusOrderByOpenedAtDesc(RoundIssueStatus status);
    RoundIssue findFirstByQuestionIdAndStatus(Long questionId, RoundIssueStatus status);
    List<RoundIssue> findByPhysicalObjectIdAndStatus(Long physicalObjectId, RoundIssueStatus status);
}
