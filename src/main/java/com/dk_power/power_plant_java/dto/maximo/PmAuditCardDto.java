package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * A fully-populated audit card: a PM plus its real completion status from Maximo — last completed/closed WO
 * (with its worklog comment + attached form) and the next scheduled WO. Built eagerly (all PMs fanned out in
 * parallel) so the Auditing Cards view shows everything, colour-coded, with no per-card click.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmAuditCardDto {
    private Long pmId;
    private String pmnum;
    private String description;
    private String cadence;
    private boolean recurring;
    private LocalDate targetDate;         // catalog's last known target start

    private String lastWonum;
    private String lastHref;
    private LocalDate lastCompletedDate;  // effective date of the last completed/closed WO

    private String nextWonum;
    private String nextHref;
    private LocalDate nextScheduledDate;

    private String comment;               // the last completed WO's worklog note(s) (falls back to form findings)
    private Long submissionId;            // completion-form submission, if one was filled (for the PDF)
    private String formName;

    private boolean overdue;
    private LocalDate overdueOn;          // the first date it is overdue (period end + 1); null if not determinable
    private boolean hasIssues;            // keyword in the comment OR a failing form answer
    private boolean keywordHit;
    private boolean formIssues;
}
