package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Result of a parts checkout — the created WO identity, final status, and material cost. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartsCheckoutResult {
    private String wonum;
    private String href;
    private String status;
    private Double actmatcost;
}
