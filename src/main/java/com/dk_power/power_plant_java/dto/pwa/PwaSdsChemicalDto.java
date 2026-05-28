package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaSdsChemicalDto {
    private String localUuid;
    private String sharepointId;

    /** Newline-delimited names/aliases. */
    private String names;
    /** Newline-delimited storage locations. */
    private String locations;

    private String statusName;
    private String notes;

    private String processedByName;
    private String processedByEmail;

    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String pwaUserUuid;
    private String timeSubmitted;

    private List<PaAttachmentDto> attachments;
}
