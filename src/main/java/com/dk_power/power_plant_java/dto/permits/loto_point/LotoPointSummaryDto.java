package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for LOTO Point menu display
 * Contains only the essential fields needed for grouping and display
 * Significantly reduces payload size compared to full LotoPointDto
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotoPointSummaryDto {
    private Long id;
    private String tagNumber;
    private String description;
    private Boolean isVerified;

    // Fields for grouping
    private String equipmentType;    // First equipment's type name
    private String location;         // First equipment's location name
    private String system;           // System name
    private String unit;             // Unit
    private String zeroEnergyMethod; // Zero energy method
    private String fileName;         // First equipment's file name
}
