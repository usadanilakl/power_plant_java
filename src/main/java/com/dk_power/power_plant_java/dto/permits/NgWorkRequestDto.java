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

    /** Job the grouping-key match suggests. A suggestion only — nothing is attached until an operator confirms. */
    private Long suggestedJobLogId;

    // Requester-declared hazards, carried through to the generated permits.
    private SwHazards declaredHazards;
    private HotWorkMeasures declaredHotWorkMeasures;
    private ConfinedSpaceHazards declaredConfinedSpaceHazards;
    private HotWorkProfile hotWorkProfile;

    /** Derived, read-only: the worksheet's fume x chrome product. 0 when not assessed. */
    private Integer hotWorkExposureScore;
}
