package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One recorded atmosphere test. */
@Data
@NoArgsConstructor
public class AirTestDto {
    private Long id;
    /** Client-generated, so a retried submission updates the reading instead of duplicating it. */
    private String clientUuid;
    private Long monitoredAreaId;
    private Instant testedAt;
    private String testedBy;
    private String meterModel;
    private String meterSerial;
    private String oxygen;
    private String lel;
    private String hydrogenSulfide;
    private String carbonMonoxide;
    private String ammonia;
    private String result;
    private String notes;
}
