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
    private String statusdateFrom;       // ISO 8601, applied as spi:statusdate >= value (catch status changes)
    private String statusdateTo;         // ISO 8601, applied as spi:statusdate <= value
    /**
     * Free-text search across the title AND the long description. OSLC has no OR, so the adapter runs one
     * query per column and merges. This is what a user-facing search box should send — an SR's title may
     * carry the words while its long description is empty, and vice versa.
     */
    private String textContains;
    private String descriptionContains;       // AND word-bucket of LIKE %word% on spi:description (title only)
    private String longDescriptionContains;   // LIKE %...% on spi:description_longdescription
    private String siteid;               // override default site

    /**
     * Whether any real filter was supplied. {@code siteid} is excluded on purpose: it scopes every query
     * anyway, so "site JG and nothing else" is still the unfiltered view. Lets a caller pick between
     * {@code listByCriteria} and the newest-first {@code listLatest} default.
     */
    public boolean hasAnyFilter() {
        return anyText(status, assetnum, location, priority, reportedby, affectedperson, classstructureid,
                reportdateFrom, reportdateTo, statusdateFrom, statusdateTo,
                textContains, descriptionContains, longDescriptionContains);
    }

    private static boolean anyText(String... values) {
        for (String v : values) if (v != null && !v.isBlank()) return true;
        return false;
    }
}
