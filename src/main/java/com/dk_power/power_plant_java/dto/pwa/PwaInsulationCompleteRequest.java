package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

/**
 * Payload the insulation-contractor PWA sends when completing an item from the enriched
 * details dialog: optional contractor comment (goes to the WO worklog + status-change memo)
 * plus optional new photo attachments (persisted to H2 + published to the SP list item +
 * uploaded to the Maximo WO as doclinks). All fields are optional so the endpoint stays
 * backward-compatible with the old "just complete" flow — a null body still closes the WO.
 */
@Data
public class PwaInsulationCompleteRequest {
    /** Contractor's completion note. Blank/null → the bridge fills in "Completed" as the
     *  worklog summary + status-change memo. Non-blank replaces the fallback everywhere. */
    private String comment;
    /** New photos taken in the dialog. Each entry is {fileName, contentType, base64Content}
     *  matching the PWA field-list submit shape so we can reuse the same save/dedup path. */
    private List<PaAttachmentDto> attachments;
}
