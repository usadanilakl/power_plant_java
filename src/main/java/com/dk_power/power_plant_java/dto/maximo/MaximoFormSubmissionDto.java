package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Wire shape for a filled form submission. {@code valuesJson} carries the raw JSON fieldName→value map. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaximoFormSubmissionDto {
    private Long id;
    private String submissionKey;
    private String templateFormKey;
    private String templateName;
    private String wonum;
    private String pmnum;
    private String woHref;
    private String siteid;
    private String valuesJson;
    private MaximoFormStatus status;
    private String submittedBy;
    private LocalDateTime submittedAt;
    private String pdfDoclinkId;
    private String writeBackNote;
    /**
     * On completion, also transition the work order to COMP (when the template doesn't already specify a target
     * status). The mobile "Submit &amp; complete" flow sets this so performing a PM closes its work order; the
     * desktop leaves it false (its Complete tab drives the status change separately). Default false.
     */
    private boolean completeWo;
    /**
     * Outcome of the WO status change attempted during completion (only when {@code completeWo}/{@code
     * completeWoStatus} applied): {@code TRUE} = the work order reached its target status; {@code FALSE} = the
     * change was attempted but Maximo rejected it (see {@link #woCloseError}); {@code null} = no status change was
     * attempted. Lets the PWA reflect COMP only when the WO truly closed instead of optimistically, and offer a
     * close-only retry (which does NOT re-attach the already-attached form) when it didn't.
     */
    private Boolean woClosed;
    /** Maximo's rejection message when {@link #woClosed} is {@code FALSE} — the form still attached; only the close failed. */
    private String woCloseError;
}
