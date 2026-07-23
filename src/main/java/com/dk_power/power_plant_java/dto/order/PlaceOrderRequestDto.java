package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request to place a vendor order from the Ordering UI. The vendor identity (recipient, cc, PO#, body note) is NOT
 * taken from the client — it is resolved server-side from the catalog item ({@code itemKey}) so it can't be tampered
 * with. The client supplies only the line items, an optional free-text note (e.g. a chosen seasonal/free text option),
 * and who is ordering.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequestDto {
    private String itemKey;
    private String orderedBy;
    /** Optional free-text appended after the vendor body note (chosen text options + operator notes, pre-joined by the UI). */
    private String note;
    /** Set when this order is placed from a reorder suggestion — marks that suggestion ORDERED on success. */
    private String sourceSuggestionId;
    @Builder.Default
    private List<OrderLineDto> lines = new ArrayList<>();

    /** Test send: the exact email goes to {@code testRecipient}/{@code testCc} instead of the vendor, and is NOT recorded. */
    private boolean testMode;
    private String testRecipient;
    private String testCc;
}
