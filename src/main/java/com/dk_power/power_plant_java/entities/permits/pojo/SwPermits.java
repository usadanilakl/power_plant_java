package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * "Required Permits/Tests/Actions" section of the Safe Work Permit (SW SMP-17).
 *
 * <p>The current Red Tag SW form has a single "Confined Space #" entry — the
 * previous {@code confinedSpaceReclassified} / {@code confinedSpacePermitRequired}
 * pair is collapsed into one {@link #confinedSpace} flag. The Reclassified vs
 * Permit-Required distinction now lives only on the Confined Space permit itself
 * ({@code ConfinedSpaceType}).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SwPermits {

    private boolean lotoRequired;
    private String lotoDescription;             // LOTO Required #

    private boolean hotWork;                    // Hot Work Permit #
    private String hotWorkDescription;

    private boolean confinedSpace;              // Confined Space # (was reclassified + permitRequired)
    private String confinedSpaceDescription;

    private boolean excavationPermit;           // Excavation Permit

    private boolean energizedPermit;            // Energized Electrical WP #
    private String energizedPermitDescription;

    private boolean ventingPurging;             // Venting/Purging Procedure
    private String ventingPurgingDescription;

    // Default true to match the Angular DTO. They disagreed, so a Java-created permit and a
    // UI-created one rendered different tick states for the same blank form.
    private boolean jha = true;                        // JHA
    private boolean gasTesting;                 // Air Monitoring within Safe Limits
    private boolean liftPlan;                   // Lift Plan                       (new)
    private boolean confSpaceRescuePlanReview;  // Conf. Space Rescue Plan Review   (new)
    private boolean fallRescuePlan;             // Fall Rescue Plan                (new)

    private boolean other;
    private String otherDescription;
}
