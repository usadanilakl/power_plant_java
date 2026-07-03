package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoWorkOrderDto {
    private String href;
    private String wonum;
    private String description;
    private String longDescription;
    private String status;
    private String worktype;
    private String assetnum;
    private String location;
    private String siteid;
    private String reportdate;
    private String targetStart;     // spi:targstartdate — when the WO is scheduled to be performed
    private String targetFinish;    // spi:targcompdate — target completion
    private String schedstart;
    private String schedfinish;
    private String leadCraft;
    private String supervisor;
    private String priority;
    /** spi:pmnum — the PM-master id (e.g. "JG-1183") on PM-generated WOs; null on one-off WOs.
     *  Stable identity shared by every recurrence of a PM — the dedupe key for the recurring-PM catalog. */
    private String pmnum;
    /** spi:statusdate — when the WO's status last changed; for a COMP WO this is effectively the
     *  completion time. Used to bucket "completed this week" in the overview. */
    private String statusDate;
}
