package com.dk_power.power_plant_java.dto.sds;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

/**
 * One scraped chemical from the source eBinder, sent by the Electron scraper to the import endpoint.
 * {@code names} may be a comma-separated (eBinder) or newline-separated list of names/aliases —
 * the first is treated as the primary name and used as the (case-insensitive) match key.
 */
@Data
public class SdsImportItemDto {
    private String names;
    private String manufacturer;
    private String revisionDate;
    private String sourceItemId;   // eBinder item id (Document ID) — the match key
    private Integer bookNumber;     // from the index merge (optional); sets the filed address
    private Integer sectionNumber;  // from the index merge (optional)
    private PaAttachmentDto pdf;    // the SDS PDF (fileName, contentType, base64Content)
}
