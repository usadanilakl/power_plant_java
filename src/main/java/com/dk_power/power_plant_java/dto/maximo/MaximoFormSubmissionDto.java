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
}
