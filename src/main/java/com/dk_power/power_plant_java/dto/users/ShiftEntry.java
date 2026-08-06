package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ShiftEntry {
    private String name;
    private String group;
    /** Schedule v2 — operator position label (Lead, CRO, AO, …). Null for v1 rows. */
    private String position;
    private Long userId;
    private Double matchConfidence;
    /** Raw shift code when the bucket alone can't express it — e.g. "L" (Leads Meeting), stored in the
     *  unscheduled bucket. Null for normal rows, where the containing bucket (day/night/…) IS the shift. */
    private String code;
}
