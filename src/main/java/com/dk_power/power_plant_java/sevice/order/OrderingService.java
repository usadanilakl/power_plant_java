package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
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

    public OrderRecordDto placeOrder(PlaceOrderRequestDto req) {
        if (req == null || isBlank(req.getItemKey())) {
            throw new IllegalArgumentException("itemKey is required.");
        }
        if (req.getLines() == null || req.getLines().isEmpty()) {
            throw new IllegalArgumentException("Add at least one line item to order.");
        }
        OrderCatalogItemDto item = ledger.getCatalogItem(req.getItemKey());
        if (item == null) {
            throw new IllegalArgumentException("Unknown catalog item: " + req.getItemKey());
        }
        if (!item.isActive()) {
            throw new IllegalArgumentException(item.getDisplayName() + " is not active for ordering.");
        }
        if (isBlank(item.getContactEmail())) {
            throw new IllegalArgumentException("No vendor email is set for " + item.getDisplayName() + ".");
        }

        String po = item.getBlanketPoNumber();
        String subject = item.getDisplayName() + " Order" + (isBlank(po) ? "" : " — PO " + po);
        String note = joinNotes(item.getBodyNote(), req.getNote());

        OrderRequestDto order = OrderRequestDto.builder()
                .to(item.getContactEmail())
                .cc(item.getCcEmails())
                .subject(subject)
                .poNumber(po)
                .greeting("Hello,")   // matches the email-reorder.mc template
                .note(note)
                .summaryTitle(item.getDisplayName())
                .lines(req.getLines())
                .build();

        OrderResultDto result;
        try {
            result = orderEmailService.send(order);
        } catch (Exception e) {
            log.warn("[Ordering] order email send failed for '{}': {}", item.getItemKey(), e.getMessage());
            result = OrderResultDto.builder()
                    .sent(false).message("Email send failed: " + e.getMessage())
                    .recipient(item.getContactEmail()).cc(item.getCcEmails()).poNumber(po)
                    .lines(req.getLines()).build();
        }

        // Record every attempt (including failures) so the history reflects what was tried.
        OrderRecordDto record = OrderRecordDto.builder()
                .orderDate(LocalDateTime.now().toString())
                .orderedBy(req.getOrderedBy())
                .vendor(item.getVendor())
                .catalogItemKey(item.getItemKey())
                .poNumber(po)
                .recipient(item.getContactEmail())
                .cc(item.getCcEmails())
                .subject(subject)
                .lines(req.getLines())
                .emailSent(result.isSent())
                .emailError(result.isSent() ? null : result.getMessage())
                .sourceSuggestionId(req.getSourceSuggestionId())
                .status(result.isSent() ? "SENT" : "FAILED")
                .build();
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

    private static String joinNotes(String bodyNote, String extra) {
        boolean a = !isBlank(bodyNote), b = !isBlank(extra);
        if (a && b) return bodyNote.trim() + "\n\n" + extra.trim();
        if (a) return bodyNote.trim();
        if (b) return extra.trim();
        return null;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
