package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A preset for a catalog item.
 * <ul>
 *   <li>QUANTITY-mode items: a quick-add line with an optional {@code defaultQty} the operator can tweak.</li>
 *   <li>FILL-mode items (diesel/gasoline/DEF/CO2): a piece of equipment/tank with a fixed {@code capacity} and the
 *       {@code product} it holds. The order amount is computed as sum(capacity − current level) per product; the
 *       vendor email shows only the per-product total, never the equipment.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPresetDto {
    private String label;
    private Double defaultQty;
    /** FILL mode: the tank/equipment capacity. */
    private Double capacity;
    /** FILL mode: the product this equipment holds (e.g. "Diesel", "Gasoline", "DEF", "CO2") — used to total the order. */
    private String product;
}
