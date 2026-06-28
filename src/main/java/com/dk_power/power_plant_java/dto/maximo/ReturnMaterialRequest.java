package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

import java.util.List;

/** Return one or more material lines to inventory on a work order (issuetype RETURN). */
@Data
public class ReturnMaterialRequest {
    /** Lines to return (itemnum + positive quantity). Reuses the checkout line shape. */
    private List<PartsCheckoutRequest.Line> lines;
    /** Storeroom to return to; defaults to WAREHOUSE1 when blank. */
    private String storeroom;
}
