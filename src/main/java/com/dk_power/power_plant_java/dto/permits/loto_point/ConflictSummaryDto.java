package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConflictSummaryDto {
    private long duplicateTagCount;
    private long noEquipmentCount;
    private long noZeroEnergyCount;
    private long noCharacteristicsCount;
    private long missingCounterpartCount;
    private long totalConflictCount;
}
