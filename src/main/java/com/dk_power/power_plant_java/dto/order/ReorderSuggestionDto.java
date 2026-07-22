package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A suggestion to reorder a catalog item, raised from an operator Round reading (Stage 4). Shown in the inbox. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderSuggestionDto {
    private String sharepointId;
    private String pwaId;
    private String suggestedAt;
    private String catalogItemKey;
    /** Origin of the suggestion, e.g. "rounds". */
    private String source;
    private String roundQuestionId;
    /** The reading + threshold that tripped it (kept as strings — informational). */
    private String reading;
    private String lowLimit;
    private String suggestedQty;
    private String reason;
    /** OPEN | ORDERED | DISMISSED. */
    private String status;
    /** Set when the suggestion resulted in an order. */
    private String resultingOrderId;
}
