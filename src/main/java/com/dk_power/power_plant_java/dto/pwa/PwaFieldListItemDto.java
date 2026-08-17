package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaFieldListItemDto {
    private String localUuid;
    private String sharepointId;

    // List type and status
    private String listTypeName;
    private String statusName;

    // Core fields
    private String title;
    private String notes;
    private String dateObserved;
    private String timeObserved;

    // Location
    private String locationName;

    // Work area picked on the plant map. The PWA has both to hand; the id is authoritative and the
    // name is the fallback when the id is stale (or absent on an older offline draft).
    private Long workAreaId;
    private String workAreaName;
    private String specificLocation;

    // Equipment reference (single search field — resolved to LotoPoint or Equipment on backend)
    private String equipmentTag;

    // Submitter info
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String pwaUserUuid;
    private String timeSubmitted;

    // Attachments — NEW attachments to add. Existing attachments are managed via
    // {@link #keepAttachmentIds}: on update, any existing attachment whose id is NOT in that
    // list is deleted, so the client just sends the IDs it still wants + any new files.
    // If {@link #keepAttachmentIds} is null (submit path, or updates that don't touch
    // attachments), NO deletions happen and this list is treated as additive.
    private List<PaAttachmentDto> attachments;
    /**
     * Attachment ids the client wants to KEEP on an update. Null = "don't touch existing
     * attachments" (submit path or field-only edits). Empty list = "delete everything".
     * Non-null with values = keep only these ids; delete the rest and add {@link #attachments}.
     */
    private List<Long> keepAttachmentIds;

    // Optional Maximo picker fields — sent when the PWA form's Maximo tree picker was used.
    // Bridge sends them on WO/SR create as spi:location and spi:assetnum. Null = ops assigns.
    private String maximoLocation;
    private String maximoAssetnum;
}
