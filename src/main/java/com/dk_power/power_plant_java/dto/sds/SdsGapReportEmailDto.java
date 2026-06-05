package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.List;

/**
 * Request body for the "Email Gap Report" action. The PDFs we attach come from the
 * missing-from-eBinder chemicals (so the recipient can upload them to the eBinder).
 * The scraped catalog is forwarded verbatim to {@code SdsSeedService.gapReport} so
 * the report sees the same data the Electron page just rendered.
 */
@Data
public class SdsGapReportEmailDto {
    private String to;
    private String cc;
    private List<SdsImportItemDto> scrapedCatalog;
    /** When false, the email is just the report body — no PDFs attached, no chunking, one email.
     *  Useful for a quick "here's what's outstanding" notice without dumping megabytes on the recipient.
     *  Defaults to true (the original behavior). */
    private Boolean includeAttachments;
}
