package com.dk_power.power_plant_java.entities.maximo;

/** Lifecycle of a {@link MaximoFormSubmission}. */
public enum MaximoFormStatus {
    DRAFT,      // saved, still editable, not yet pushed to Maximo
    COMPLETED   // submitted: PDF attached + worklog/status/data written back
}
