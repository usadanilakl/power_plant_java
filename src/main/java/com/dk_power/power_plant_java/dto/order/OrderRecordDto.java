package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** A placed order recorded in the ledger — the cross-machine order history (one row per email sent). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRecordDto {
    /** SharePoint list-item id. */
    private String sharepointId;
    /** Locally-minted stable id (independent of the SharePoint id). */
    private String pwaId;
    /** ISO datetime the order was placed. */
    private String orderDate;
    private String orderedBy;
    private String vendor;
    private String catalogItemKey;
    private String poNumber;
    private String recipient;
    private String cc;
    private String subject;
    @Builder.Default
    private List<OrderLineDto> lines = new ArrayList<>();
    private boolean emailSent;
    private String emailError;
    /** The suggestion this order was raised from, if any. */
    private String sourceSuggestionId;
    /** SENT | FAILED. */
    private String status;
}
