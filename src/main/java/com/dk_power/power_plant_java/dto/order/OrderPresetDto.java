package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A default-quantity preset for a catalog item. {@code defaultQty} is nullable — some presets are label-only
 *  (e.g. CO2 "mini-bulk tank", diesel "EDG"/"DFP") and the operator supplies the number at order time. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPresetDto {
    private String label;
    private Double defaultQty;
}
