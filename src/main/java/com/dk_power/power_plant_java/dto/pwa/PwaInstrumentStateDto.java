package com.dk_power.power_plant_java.dto.pwa;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight instrumentation cache state used by PWA to decide
 * whether a full instrument list pull is necessary.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PwaInstrumentStateDto {
    private long itemCount;
    private String lastModified;
    private String version;
}

