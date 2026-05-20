package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.RedTagStandardRow;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * API DTO for {@link com.dk_power.power_plant_java.entities.loto.RedTagStandard}.
 * Carries the digitized rows as a typed list (the entity stores them as a
 * JSON column) and the source image inline as base64 so the Angular detail
 * view can render it via a data URI.
 */
@Getter
@Setter
@NoArgsConstructor
public class RedTagStandardDto {

    private Long id;
    private String name;
    private String unit;
    private List<RedTagStandardRow> rows = new ArrayList<>();
    private String sourceImageBase64;
    private Long generatedStandardId;
    private String importNotes;
    private String dateCreated;
    private String dateModified;
}
