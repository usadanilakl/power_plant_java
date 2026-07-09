package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One reagent that needs reordering: qty to order ({@code need}) = {@code target} - {@code inStock}. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderLineDto {
    /** Reagent description (Hach #/size) — used verbatim on the vendor email line. */
    private String reagent;
    private Double target;
    private Double inStock;
    /** Quantity to order to bring stock back up to target (always > 0 for a line that appears here). */
    private Double need;
}
