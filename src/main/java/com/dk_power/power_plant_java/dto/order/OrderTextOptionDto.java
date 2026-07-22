package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A per-vendor body-text option offered when placing an order.
 * <ul>
 *   <li>{@code FREE} — the operator types free text.</li>
 *   <li>{@code FIXED} — a canned line (e.g. Hydrogen "One of the trailers is empty and needs swapping").</li>
 *   <li>{@code SEASONAL} — a canned line only offered/defaulted within a month range (e.g. diesel winterized note
 *       Oct–Apr). {@code monthFrom}/{@code monthTo} are 1-12 inclusive and wrap across year-end when from &gt; to.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTextOptionDto {
    /** FREE | FIXED | SEASONAL */
    private String kind;
    private String label;
    private String text;
    private Integer monthFrom;
    private Integer monthTo;
}
