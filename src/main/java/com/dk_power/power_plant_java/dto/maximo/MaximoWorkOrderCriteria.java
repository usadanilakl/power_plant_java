package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Multi-field filter for Maximo work order queries.
 * All fields optional — non-blank values are AND'd into the OSLC where clause.
 * Site defaults to maximo.default-site if blank.
 */
@Getter
@Setter
@NoArgsConstructor
public class MaximoWorkOrderCriteria {
    private String status;          // e.g. WAPPR, APPR, INPRG, COMP, CLOSE, CAN
    private String worktype;        // e.g. CM, PM, EM
    private String assetnum;
    private String location;
    private String priority;        // numeric — passed without quotes
    private String leadCraft;            // Maximo field is "lead"; exact match
    private String schedstartFrom;       // ISO 8601, applied as spi:schedstart >= value
    private String schedfinishTo;        // ISO 8601, applied as spi:schedfinish <= value
    private String descriptionContains;  // wraps in %...% for SQL-style LIKE on spi:description
    private String siteid;               // override default site
}
