package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

import java.util.List;

/** Issue one or more material lines on an existing work order (issuetype ISSUE). */
@Data
public class IssueMaterialRequest {
    /** Lines to issue (itemnum + positive quantity). Reuses the checkout line shape. */
    private List<PartsCheckoutRequest.Line> lines;
    /** Storeroom to issue from; defaults to WAREHOUSE1 when blank. */
    private String storeroom;
}
