package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkProfile;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class NgWorkRequestDto extends BaseDto {


    private String dateOfWorkToBePerformed;

    private String timeOfWorkToBePerformed;

    private String requestedBy;

    private String company;

    private String location;

    private String affectedEquipment;

    private String workScope;

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;

    private Boolean isConfinedSpaceEntryRequired;
    private String space;
    private String sharepointId;
    private String localUuid;
    private String status;
    private Boolean hasJha;
    private Integer attachmentCount;
    private WorkAreaDto workArea;

    /**
     * Every area this request covers and what is planned in each. `workArea` above stays the
     * primary one; this drives how many Confined Space and Hot Work permits get generated.
     */
    private java.util.List<com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea> workAreas;
    private ValueDto workCategory;
    private Long dailyPermitPackageId;

    /** Derived, read-only: no work area is set, so an operator has to pick one before permits. */
    private Boolean areaNotSpecified;

    // ---- Operator processing override -----------------------------------------------------
    //
    // What the operator decided this job's areas / equipment / scope actually are, kept apart
    // from what the requester submitted so the request still shows what was asked for. Written
    // back to the entity; the `effective*` triplet below is derived and never is.

    /** Operator's area selection. Empty means "no override — use what the requester declared". */
    private java.util.List<com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea> operatorWorkAreas;
    private String operatorAffectedEquipment;
    private String operatorWorkScope;
    private String operatorOverrideBy;
    private String operatorOverrideAt;

    /**
     * Derived, read-only: what permit generation should actually use — the operator's value
     * where they set one, the requester's otherwise.
     *
     * <p>Sent rather than recomputed in Angular so the precedence rule lives in exactly one
     * place. Two copies of "which value wins" is how a permit ends up naming an area nobody
     * picked, and the UI needs the override fields separately anyway to render the editor.
     */
    private java.util.List<com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea> effectiveWorkAreas;
    private String effectiveAffectedEquipment;
    private String effectiveWorkScope;

    /** Job the grouping-key match suggests. A suggestion only — nothing is attached until an operator confirms. */
    private Long suggestedJobLogId;

    // Requester-declared hazards, carried through to the generated permits.
    private SwHazards declaredHazards;
    private HotWorkMeasures declaredHotWorkMeasures;
    private ConfinedSpaceHazards declaredConfinedSpaceHazards;
    private HotWorkProfile hotWorkProfile;

    /** Derived, read-only: the worksheet's fume x chrome product. 0 when not assessed. */
    private Integer hotWorkExposureScore;

    /**
     * Who actually submitted this, and when.
     *
     * <p>Stored on the entity and set by the PWA on every submission, and carried by the SharePoint
     * DTO — but absent here, so the operator screens had no way to show who to ring about a request.
     * Requester provenance only: never mapped back onto the entity, exactly as {@code NgJhaDto} and
     * {@code JhaMapper} already handle the same five fields.
     */
    private String timeSubmitted;
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;
}
