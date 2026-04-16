package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ConflictSearchRequest {
    private String conflictType; // DUPLICATE_TAG, NO_EQUIPMENT, NO_ZERO_ENERGY, NO_CHARACTERISTICS, MISSING_COUNTERPART
    private String groupBy;      // file, location, system, unit (optional)
    private int page = 1;
    private int pageSize = 50;
}
