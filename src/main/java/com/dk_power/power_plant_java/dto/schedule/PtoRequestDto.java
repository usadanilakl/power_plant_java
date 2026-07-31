package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.PtoRequest} for the PTO
 * intake review panel. {@code rawName} is the name as parsed from the email (kept for triage when
 * {@code userId} is null / low-confidence); {@code userName} is the resolved user, if any.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PtoRequestDto {
    private Long id;
    private Long userId;
    private String userName;
    private String rawName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;            // PENDING | APPROVED | REJECTED | PENDING_MANUAL_REVIEW
    private String submittedVia;      // EMAIL | APP
    private String sourceRequestId;
    private String emailMessageId;
    private LocalDateTime coverageEmailSentAt;
}
