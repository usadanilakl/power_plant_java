package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.time.Instant;

@Data
public class SdsChemicalDto {
    private Long id;

    /** Newline-delimited names/aliases. */
    private String names;
    /** First name — convenience for SharePoint Title + table display. */
    private String primaryName;

    /** Newline-delimited storage locations. */
    private String locations;

    private Long statusId;
    private String statusName;

    private Integer bookNumber;
    private Integer sectionNumber;

    private String notes;
    private String sourceId;
    private String manufacturer;
    private String sourceRevisionDate;

    private String processedByName;
    private String processedByEmail;
    private Instant processedAt;

    private Instant lastAuditedAt;

    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;

    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;

    private String createdBy;
    private String dateCreated;
    private String dateModified;

    private int attachmentCount;
}
