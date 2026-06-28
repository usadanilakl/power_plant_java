package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * A WAPPR recurring-PM work order with its proposed shift-based assignee, for the approval UI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmPendingAssignmentDto {
    private String href;
    private String wonum;
    private String pmnum;
    private String description;
    private String status;
    private String targetDate;            // yyyy-MM-dd the assignment was computed for
    private ShiftPreference shift;        // the PM's configured shift
    private RecurrenceCadence cadence;
    private String currentLead;           // lead currently on the WO
    private String proposedPersonid;      // suggested assignee (null if schedule has no one)
    private String proposedName;
    private String note;                  // why no proposal, etc.
    private List<PersonOption> candidates; // people on that shift/date, for the dropdown

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PersonOption {
        private String personid;
        private String name;
    }
}
