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
    private String reportedby;           // Maximo personid of who reported/submitted the WO; exact match
    private String schedstartFrom;       // ISO 8601, applied as spi:schedstart >= value
    private String schedfinishTo;        // ISO 8601, applied as spi:schedfinish <= value
    private String reportdateFrom;       // ISO 8601, applied as spi:reportdate >= value
    private String reportdateTo;         // ISO 8601, applied as spi:reportdate <= value
    private String statusdateFrom;       // ISO 8601, applied as spi:statusdate >= value (e.g. completed-since)
    private String statusdateTo;         // ISO 8601, applied as spi:statusdate <= value
    /**
     * Free-text search across the title AND the long description. OSLC has no OR, so the adapter runs one
     * query per column and merges. This is what a user-facing search box should send — a WO's title may say
     * "UNIT 2 MONTHLY SAMPLE PANEL MAINTENANCE" while its long description is empty, and vice versa.
     */
    private String textContains;
    private String descriptionContains;       // AND word-bucket of LIKE %word% on spi:description (title only)
    /** Contiguous LIKE %...% on spi:description — for identity matching (e.g. a PM's own WOs), not user search. */
    private String descriptionPhrase;
    private String longDescriptionContains;   // AND word-bucket of LIKE %word% on spi:description_longdescription
    private String wonumContains;              // LIKE %...% on spi:wonum
    private List<String> outageTypeIn;         // outage-type domain values (e.g. PLAN, SNOW); OSLC `in [...]`
    private String siteid;               // override default site

    /**
     * Whether any real filter was supplied. {@code siteid} is excluded on purpose: it scopes every query
     * anyway, so "site JG and nothing else" is still the unfiltered view. Lets a caller pick between
     * {@code listByCriteria} and the newest-first {@code listLatest} default.
     */
    public boolean hasAnyFilter() {
        return anyText(status, worktype, pmnum, assetnum, location, priority, leadCraft, supervisor, reportedby,
                schedstartFrom, schedfinishTo, reportdateFrom, reportdateTo, statusdateFrom, statusdateTo,
                textContains, descriptionContains, descriptionPhrase, longDescriptionContains, wonumContains)
                || (statusIn != null && !statusIn.isEmpty())
                || (leadIn != null && !leadIn.isEmpty())
                || (outageTypeIn != null && !outageTypeIn.isEmpty());
    }

    private static boolean anyText(String... values) {
        for (String v : values) if (v != null && !v.isBlank()) return true;
        return false;
    }
}
