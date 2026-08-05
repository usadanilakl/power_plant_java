package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderPreviewDto;
import com.dk_power.power_plant_java.dto.order.OrderRecordDto;
import com.dk_power.power_plant_java.dto.order.OrderRequestDto;
import com.dk_power.power_plant_java.dto.order.OrderResultDto;
import com.dk_power.power_plant_java.dto.order.PlaceOrderRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Orchestrates placing an order: resolve the vendor from the catalog, compose + send the email via the shared
 * {@link OrderEmailService}, and record the outcome to the {@link OrderLedger}. Vendor identity (recipient/cc/PO/body
 * note) is authoritative from the catalog, never the client.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderingService {

    private final OrderLedger ledger;
    private final OrderEmailService orderEmailService;

    /** Compose + send a real order (to the vendor, recorded) or a test copy (to a supplied address, not recorded). */
    public OrderRecordDto placeOrder(PlaceOrderRequestDto req) {
        OrderCatalogItemDto item = requireItem(req);
        if (req.getLines() == null || req.getLines().isEmpty()) {
            throw new IllegalArgumentException("Add at least one line item to order.");
        }
        boolean test = req.isTestMode();
        if (test) {
            if (isBlank(req.getTestRecipient()))
                throw new IllegalArgumentException("Provide a test recipient email.");
        } else {
            if (!item.isActive())
                throw new IllegalArgumentException(item.getDisplayName() + " is not active for ordering.");
            if (isBlank(item.getContactEmail()))
                throw new IllegalArgumentException("No vendor email is set for " + item.getDisplayName() + ".");
        }

        OrderRequestDto order = compose(item, req);
        OrderResultDto result = trySend(order, item.getItemKey());

        OrderRecordDto record = OrderRecordDto.builder()
                .orderDate(LocalDateTime.now().toString())
                .orderedBy(req.getOrderedBy())
                .vendor(item.getVendor())
                .catalogItemKey(item.getItemKey())
                .poNumber(item.getBlanketPoNumber())
                .recipient(order.getTo())
                .cc(order.getCc())
                .subject(order.getSubject())
                .lines(req.getLines())
                .emailSent(result.isSent())
                .emailError(result.isSent() ? null : result.getMessage())
                .sourceSuggestionId(test ? null : req.getSourceSuggestionId())
                .status(test ? "TEST" : (result.isSent() ? "SENT" : "FAILED"))
                .build();

        // A test copy is not a real order — don't persist it or touch suggestions.
        if (test) return record;

        record = ledger.recordOrder(record);
        if (result.isSent() && !isBlank(req.getSourceSuggestionId())) {
            try {
                ledger.updateSuggestionStatus(req.getSourceSuggestionId(), "ORDERED");
            } catch (Exception e) {
                log.warn("[Ordering] could not mark suggestion {} ordered: {}", req.getSourceSuggestionId(), e.getMessage());
            }
        }
        return record;
    }

    /** Render exactly what would be sent (subject/recipients/body) without sending — reflects the test-mode override too. */
    public OrderPreviewDto preview(PlaceOrderRequestDto req) {
        OrderCatalogItemDto item = requireItem(req);
        OrderRequestDto order = compose(item, req);
        return OrderPreviewDto.builder()
                .to(order.getTo())
                .cc(order.getCc())
                .subject(order.getSubject())
                .poNumber(order.getPoNumber())
                .bodyHtml(orderEmailService.buildHtmlBody(order))
                .build();
    }

    // ── helpers ──

    private OrderCatalogItemDto requireItem(PlaceOrderRequestDto req) {
        if (req == null || isBlank(req.getItemKey()))
            throw new IllegalArgumentException("itemKey is required.");
        OrderCatalogItemDto item = ledger.getCatalogItem(req.getItemKey());
        if (item == null)
            throw new IllegalArgumentException("Unknown catalog item: " + req.getItemKey());
        return item;
    }

    /** Build the email. Vendor identity is authoritative from the catalog; a test send overrides only the recipients. */
    private OrderRequestDto compose(OrderCatalogItemDto item, PlaceOrderRequestDto req) {
        boolean test = req.isTestMode();
        String po = item.getBlanketPoNumber();
        String subject = item.getDisplayName() + " Order" + (isBlank(po) ? "" : " — PO " + po);
        if (test) subject = "[TEST] " + subject;
        return OrderRequestDto.builder()
                .to(test ? req.getTestRecipient() : item.getContactEmail())
                .cc(test ? emptyToNull(req.getTestCc()) : item.getCcEmails())
                .subject(subject)
                .poNumber(po)
                .greeting("Hello,")   // matches the email-reorder.mc template
                .note(joinNotes(item.getBodyNote(), req.getNote()))
                .summaryTitle(item.getDisplayName())
                .lines(req.getLines())
                // log real sends to Correspondence; test sends are not logged
                .logEntityType(test ? null : "Ordering")
                .logCorrespondenceType("Vendor Order")
                .build();
    }

    private OrderResultDto trySend(OrderRequestDto order, String itemKey) {
        try {
            return orderEmailService.send(order);
        } catch (Exception e) {
            log.warn("[Ordering] order email send failed for '{}': {}", itemKey, e.getMessage());
            return OrderResultDto.builder()
                    .sent(false).message("Email send failed: " + e.getMessage())
                    .recipient(order.getTo()).cc(order.getCc()).poNumber(order.getPoNumber())
                    .lines(order.getLines()).build();
        }
    }

    private static String emptyToNull(String s) { return isBlank(s) ? null : s.trim(); }

    private static String joinNotes(String bodyNote, String extra) {
        boolean a = !isBlank(bodyNote), b = !isBlank(extra);
        if (a && b) return bodyNote.trim() + "\n\n" + extra.trim();
        if (a) return bodyNote.trim();
        if (b) return extra.trim();
        return null;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
