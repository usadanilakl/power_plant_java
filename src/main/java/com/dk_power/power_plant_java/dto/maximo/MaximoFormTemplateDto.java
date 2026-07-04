package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Wire shape for a form template. {@code fieldsJson} carries the raw JSON field-definition array. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaximoFormTemplateDto {
    private Long id;
    private String formKey;
    private String formName;
    private String description;
    private String fieldsJson;
    private String matchPmnum;
    private String matchDescriptionContains;
    private String completeWoStatus;
    private Boolean active;
}
