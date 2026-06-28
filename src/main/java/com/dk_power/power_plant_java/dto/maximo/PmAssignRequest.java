package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

import java.util.List;

/** Approve + assign a batch of WAPPR PM work orders: set each WO's lead and move it to APPR. */
@Data
public class PmAssignRequest {
    private List<Item> items;
    private String memo;

    @Data
    public static class Item {
        private String href;
        private String personid;   // assignee; if blank, the WO is approved without changing lead
    }
}
