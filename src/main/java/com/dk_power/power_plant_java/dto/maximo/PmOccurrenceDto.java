package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One real Maximo work order matching a recurring PM (by pmnum, or by description when the PM has no
 * pmnum), for the catalog's per-PM history/upcoming timeline. {@code open} = the WO is still in a
 * pre-completion status (WSCH/WAPPR/APPR/INPRG) → an "upcoming"/active item; otherwise it's history.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmOccurrenceDto {
    private String wonum;
    private String href;
    private String status;
    private String date;   // yyyy-MM-dd — effective date (targstart → schedstart → reportdate)
    private String lead;
    private boolean open;  // true = open/active status (upcoming); false = terminal (history)
}
