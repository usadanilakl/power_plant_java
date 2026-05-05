package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for submitting a new Maximo service request.
 * Only description + siteid are strictly required by Maximo; the rest are optional.
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateMaximoServiceRequestDto {
    private String description;
    private String longDescription;
    private String assetnum;
    private String location;
    private String siteid;            // defaults to maximo.default-site if blank
    private String reportedby;        // Maximo personid of submitter
    private String classstructureid;
    private String priority;
    private String affectedperson;
}
