package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

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
    private List<String> statusIn;  // matches any of N statuses (OSLC `in [...]`)
    private String worktype;        // e.g. CM, PM, EM
    private String pmnum;           // PM-master id (e.g. JG-1183); exact match
    private String assetnum;
    private String location;
    private String priority;        // numeric — passed without quotes
    private String leadCraft;            // Maximo field is "lead"; exact match
    private List<String> leadIn;         // Maximo field is "lead"; matches any of N personids (OSLC `in [...]`)
    private String supervisor;           // exact match
    private String schedstartFrom;       // ISO 8601, applied as spi:schedstart >= value
    private String schedfinishTo;        // ISO 8601, applied as spi:schedfinish <= value
    private String reportdateFrom;       // ISO 8601, applied as spi:reportdate >= value
    private String reportdateTo;         // ISO 8601, applied as spi:reportdate <= value
    private String statusdateFrom;       // ISO 8601, applied as spi:statusdate >= value (e.g. completed-since)
    private String statusdateTo;         // ISO 8601, applied as spi:statusdate <= value
    private String descriptionContains;       // LIKE %...% on spi:description (title only)
    private String longDescriptionContains;   // LIKE %...% on spi:description_longdescription
    private String wonumContains;              // LIKE %...% on spi:wonum
    private String siteid;               // override default site
}
