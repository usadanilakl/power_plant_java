package com.dk_power.power_plant_java.dto.permits;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkRequestDto {

    @JsonProperty("Date of work to be performed")
    private String dateOfWorkToBePerformed;

    @JsonProperty("Time of work to be performed")
    private String timeOfWorkToBePerformed;

    @JsonProperty("Work Requested By")
    private String requestedBy;

    @JsonProperty("Company")
    private String company;

    @JsonProperty("Location Of Work")
    private String location;

    @JsonProperty("Affected Equipment")
    private String affectedEquipment;

    @JsonProperty("Work Scope")
    private String workScope;

    @JsonProperty("Is Hot Work Required (welding, cutting, griding, open flame, sparks)")
    private Boolean isHotWorkRequired;
    @JsonProperty("Foreman Name")
    private String foreman;
    @JsonProperty("Fire-watch Name")
    private String fireWatch;

    @JsonProperty("Is LOTO Required?")
    private Boolean isLotoRequired;

    @JsonProperty("Is Confined Space Entry Required?")
    private Boolean isConfinedSpaceEntryRequired;
    @JsonProperty("Space to be entered:")
    private String space;
    @JsonProperty("ID")
    private String sharepointId;
    @JsonProperty("Status")
    private String status;

    private String localUuid;

    public void setIsHotWorkRequired(String isHotWorkRequired) {
        this.isHotWorkRequired = convertYesNoToBooleanString(isHotWorkRequired);
    }

    public void setIsLotoRequired(String isLotoRequired) {
        this.isLotoRequired = convertYesNoToBooleanString(isLotoRequired);
    }

    public void setIsConfinedSpaceEntryRequired(String isConfinedSpaceEntryRequired) {
        this.isConfinedSpaceEntryRequired = convertYesNoToBooleanString(isConfinedSpaceEntryRequired);
    }
    public void setBooleanIsHotWorkRequired(Boolean isHotWorkRequired) {
        this.isHotWorkRequired = isHotWorkRequired;
    }

    public void setBooleanIsLotoRequired(Boolean isLotoRequired) {
        this.isLotoRequired = isLotoRequired;
    }

    public void setBooleanIsConfinedSpaceEntryRequired(Boolean isConfinedSpaceEntryRequired) {
        this.isConfinedSpaceEntryRequired = isConfinedSpaceEntryRequired;
    }

    private Boolean convertYesNoToBooleanString(String value) {
        if (value == null) {
            return null;
        }
        value = value.trim().toLowerCase();
        if (value.equals("yes")) {
            return true;
        } else if (value.equals("no")) {
            return false;
        } else {
            return false;
        }
    }

}