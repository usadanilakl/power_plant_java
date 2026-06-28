package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/**
 * An inventory line for the parts picker: item master info (itemnum/description/issueunit)
 * enriched with current balance at a storeroom. {@code curbal} is null when the item isn't stocked there.
 */
@Data
public class MaximoInventoryItemDto {
    private String itemnum;
    private String description;
    private String issueunit;
    private String storeroom;
    private Double curbal;
}
