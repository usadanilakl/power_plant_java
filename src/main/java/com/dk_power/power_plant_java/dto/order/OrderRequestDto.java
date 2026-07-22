package com.dk_power.power_plant_java.dto.order;

import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * A provider-neutral vendor order to compose + send as an email. This is the seam between "how the order was
 * decided" (a Maximo inventory form, a standalone catalog pick, a Rounds reorder suggestion, …) and the shared
 * {@code OrderEmailService} that renders and sends it. Callers set the recipient/PO/lines directly — nothing here
 * knows about Maximo, forms, or work orders.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDto {
    private String to;
    private String cc;
    private String subject;
    private String poNumber;
    /** Optional shipping/billing address block (rendered after the item list). */
    private String shipTo;
    /** Optional greeting line (e.g. "Good afternoon,"). Null → a sensible default. */
    private String greeting;
    /** Optional intro line before the item list. Null → the default "…would like to order the following:". */
    private String intro;
    /** Optional free-text note appended after the list — the per-vendor conditional text (e.g. winterized-fuel note). */
    private String note;
    /** Title used in the plain-text summary header (e.g. "Reagent & Test Inventory"). Null → "Order". */
    private String summaryTitle;
    @Builder.Default
    private List<OrderLineDto> lines = new ArrayList<>();
    /** Optional email attachments (base64). */
    private List<EmailAttachment> attachments;
}
