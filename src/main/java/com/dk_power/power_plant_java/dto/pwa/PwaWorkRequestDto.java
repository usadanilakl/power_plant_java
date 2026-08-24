package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkProfile;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import lombok.Data;

import java.util.List;

@Data
public class PwaWorkRequestDto {
    private String localUuid;           // PWA's unique ID for dedup
    private String sharepointId;        // SharePoint list item ID (for updates)

    // Work request fields
    private String company;
    private String dateOfWork;
    private String timeOfWork;
    private String locationOfWork;
    private String workRequestedBy;
    private String affectedEquipment;
    private String workScope;
    private Boolean isLotoRequired;
    private Boolean isHotWorkRequired;
    private Boolean isConfinedSpaceEntryRequired;
    private String foremanName;
    private String fireWatchName;
    private String spaceToBeEntered;

    // Contact info (for unauthenticated users)
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;
    private String pwaUserUuid;         // PWA user's UUID
    private String timeSubmitted;       // ISO 8601 timestamp

    // Job auto-linking fields
    private String workCategoryName;    // Resolved to Value entity on backend
    private Long workAreaId;            // WorkArea entity ID
    private String workAreaName;        // Denormalized area name for downstream integrations

    /**
     * Set when the requester could not place their work on the map. The map stays the preferred
     * path; taking this escape hatch makes {@code locationOfWork} the only thing an operator has to
     * go on, so the PWA requires a written description alongside it.
     */
    private Boolean workAreaUnknown;

    // Hazards the requester declared. Same three shapes the SW / HW / CS permits carry, so the
    // operator's generated permits can be seeded from them directly.
    private SwHazards declaredHazards;
    private HotWorkMeasures declaredHotWorkMeasures;
    private ConfinedSpaceHazards declaredConfinedSpaceHazards;
    /** Type of hot work + Cr(VI) assessment. Null unless hot work was declared. */
    private HotWorkProfile hotWorkProfile;

    // Attachments (photos, signatures, documents)
    private List<PaAttachmentDto> attachments;
}
