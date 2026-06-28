package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

import java.util.List;

/**
 * Payload for the parts-checkout flow: create a WO, approve it, issue material lines, complete it.
 * Mirrors the manual Maximo steps (create WO → set location/description/worktype → APPR → add
 * material actuals → COMP).
 */
@Data
public class PartsCheckoutRequest {

    private String description;
    private String location;
    private String worktype;
    /** Defaults to the configured Maximo default site (JG) when blank. */
    private String siteid;
    /** Storeroom to issue from; defaults to WAREHOUSE1 when blank. */
    private String storeroom;
    private List<Line> lines;
    /** Optional memo recorded on the status changes. */
    private String memo;

    @Data
    public static class Line {
        private String itemnum;
        private Double quantity;
    }
}
