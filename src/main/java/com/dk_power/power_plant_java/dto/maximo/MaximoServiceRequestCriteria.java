package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Multi-field filter for Maximo service request queries.
 * All fields optional — non-blank values are AND'd into the OSLC where clause.
 * Site defaults to maximo.default-site if blank.
 */
@Getter
@Setter
@NoArgsConstructor
public class MaximoServiceRequestCriteria {
    private String status;               // e.g. NEW, QUEUED, INPROG, PENDING, RESOLVED, CLOSED
    private String assetnum;
    private String location;
    private String priority;             // reportedpriority — numeric, no quotes
    private String reportedby;           // Maximo personid
    private String affectedperson;       // Maximo personid
    private String classstructureid;
    private String reportdateFrom;       // ISO 8601, applied as spi:reportdate >= value
    private String reportdateTo;         // ISO 8601, applied as spi:reportdate <= value
    private String descriptionContains;       // LIKE %...% on spi:description (title only)
    private String longDescriptionContains;   // LIKE %...% on spi:description_longdescription
    private String siteid;               // override default site
}
