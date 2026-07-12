package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.ImportedRoundQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImportedRoundQuestionRepository extends JpaRepository<ImportedRoundQuestion, Long> {
    ImportedRoundQuestion findFirstBySourceWebviewKey(String sourceWebviewKey);
    List<ImportedRoundQuestion> findByStatusOrderByCategoryAscPromptAsc(String status);
    List<ImportedRoundQuestion> findAllByOrderByCategoryAscPromptAsc();
}
