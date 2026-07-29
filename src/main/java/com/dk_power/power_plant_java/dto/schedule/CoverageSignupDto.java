package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View of a {@link com.dk_power.power_plant_java.entities.schedule.CoverageSignup}. Used by the
 * manager approve/reject list and returned on operator signup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoverageSignupDto {
    private Long id;
    private Long coverageRequestId;
    private Long userId;
    private String userName;
    private LocalDate date;
    private String shift;
    private String status;          // PENDING | APPROVED | REJECTED | WITHDRAWN
    private String signedUpVia;     // PWA | ELECTRON | KIOSK
    private Long approvedByUserId;
    private String approvedByName;
    private LocalDateTime approvedAt;
}
