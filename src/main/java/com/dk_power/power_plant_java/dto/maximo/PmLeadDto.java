package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A lead operator's identity, for the Assignments-tab schedule peek to flag which roster people are leads.
 * {@code id} = local User id (matches {@code ShiftEntry.userId}); {@code scheduleName} = the exact Ops-Schedule
 * alias (matches a roster name directly); {@code personid} = Maximo personid.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmLeadDto {
    private Long id;
    private String name;
    private String scheduleName;
    private String personid;
}
