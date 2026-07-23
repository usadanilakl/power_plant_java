package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The completion detail for one WO (the last completed/closed occurrence of a PM), loaded on demand for the
 * audit view: the WO's worklog comment, whether it is flagged "troubled" (a keyword in the comment, or a
 * failing answer on an attached form), and the attached completion form (so the audit can show its PDF).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmCompletionDetailDto {
    private String wonum;
    private Long submissionId;   // the completion-form submission, if one was filled; null otherwise
    private String formName;
    private String comment;      // the WO's worklog note(s) (falls back to the form's findings)
    private boolean hasIssues;   // keyword in the comment OR a failing form answer
    private boolean keywordHit;  // the comment contained a flag keyword
    private boolean formIssues;  // an attached form has a 'Not OK'/'No'/'Present'/... answer
}
