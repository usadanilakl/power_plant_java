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
    /** spi:reportedby — Maximo personid of who reported/submitted the WO. */
    private String reportedby;
    private String priority;
    /** spi:pmnum — the PM-master id (e.g. "JG-1183") on PM-generated WOs; null on one-off WOs.
     *  Stable identity shared by every recurrence of a PM — the dedupe key for the recurring-PM catalog. */
    private String pmnum;
    /** spi:statusdate — when the WO's status last changed; for a COMP WO this is effectively the
     *  completion time. Used to bucket "completed this week" in the overview. */
    private String statusDate;
    /** spi:taskid — the task sequence number when this WO row is a task (istask=true); null otherwise. */
    private String taskid;
    /** spi:parent — the parent work order number when this row is a task/child WO; null on top-level WOs. */
    private String parent;
    /** spi:istask — true when this WO row is an internal task of a parent WO (completed independently). */
    private Boolean istask;
    /** The WO's outage-type domain value (PLAN = Planned Outage, SNOW = Short Notice Outage Work); only
     *  populated by the outage-items query (the attribute isn't on the shared select). */
    private String outageType;
    /** How many LOTO isolation notes this WO already has (worklog rows titled "LOTO ISOLATION"); populated by
     *  the outage-items query from the inline worklog, so the card can show a "note added" indicator. */
    private int lotoNoteCount;
}
