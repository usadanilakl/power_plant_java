package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One line of a vendor order: an item ({@code description}) and how much to order ({@code qty}, optional {@code unit}). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderLineDto {
    /** Item description — used verbatim on the vendor email line. */
    private String description;
    /** Quantity to order. */
    private Double qty;
    /** Optional unit (e.g. "LBS", "Gallons"); null → omitted from the line. */
    private String unit;
}
