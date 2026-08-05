package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.order.OrderLineDto;
import com.dk_power.power_plant_java.dto.order.OrderRequestDto;
import com.dk_power.power_plant_java.dto.order.OrderResultDto;
import com.dk_power.power_plant_java.sevice.angular.NgEmailCorrespondenceService;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Provider-neutral core that composes a vendor order into an HTML email and sends it via {@link EmailFacadeService}
 * (jgportal Graph API, manual-client fallback). Knows nothing about Maximo, forms, or work orders — it takes an
 * {@link OrderRequestDto} (recipient + PO + lines) and sends it.
 * <p>
 * Extracted from {@code ChemInventoryReorderService} so every ordering caller shares one compose-and-send path:
 * the chemistry-lab inventory reorder (which still derives its lines from a Maximo form and attaches a summary to
 * the WO), a standalone Ordering section, and Rounds-driven reorder suggestions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEmailService {

    private static final String DEFAULT_GREETING = "Good afternoon,";
    private static final String DEFAULT_INTRO = "Jackson Generation would like to order the following:";

    private final EmailFacadeService emailFacadeService;
    private final NgEmailCorrespondenceService correspondenceService;

    /**
     * Compose the order into an HTML email and send it. Returns {@code sent=false} (a no-op) when there are no lines
     * or no recipient — the caller is expected to confirm with the user first. Propagates a {@code RuntimeException}
     * only when {@link EmailFacadeService} exhausts both the API and manual-client paths (same contract as before).
     */
    public OrderResultDto send(OrderRequestDto order) {
        OrderResultDto result = OrderResultDto.builder()
                .recipient(order == null ? null : order.getTo())
                .cc(order == null ? null : order.getCc())
                .poNumber(order == null ? null : order.getPoNumber())
                .lines(order == null ? List.of() : order.getLines())
                .sent(false)
                .build();

        if (order == null || order.getLines() == null || order.getLines().isEmpty()) {
            result.setMessage("Nothing to order — no line items.");
            return result;
        }
        if (isBlank(order.getTo())) {
            result.setMessage("No recipient email is set for this order.");
            return result;
        }

        String body = buildHtmlBody(order);
        emailFacadeService.sendEmail(EmailRequest.builder()
                .to(order.getTo()).cc(order.getCc()).subject(order.getSubject())
                .body(body).attachments(order.getAttachments()).html(true).build());
        result.setSent(true);
        log.info("[OrderEmail] order email sent to {} (cc {}) — {} line(s), PO {}",
                order.getTo(), order.getCc(), order.getLines().size(), order.getPoNumber());
        logCorrespondence(order, body);
        result.setMessage("Order email sent to " + order.getTo()
                + (isBlank(order.getCc()) ? "" : " (cc " + order.getCc() + ")")
                + " — " + order.getLines().size() + " item(s).");
        return result;
    }

    /** Best-effort: log the sent order as OUTBOUND EmailCorrespondence so it shows in the Correspondence "Linked" tab.
     *  Driven by the order's log* fields; a failure never affects the send. (Uses the proven Mail.Send path, so no
     *  Graph message/conversation id is captured — vendor replies are still visible in the mailbox Inbox tab.) */
    private void logCorrespondence(OrderRequestDto order, String body) {
        if (isBlank(order.getLogEntityType())) return;
        try {
            correspondenceService.saveOutbound(
                    order.getLogEntityType(), null,
                    order.getSubject(), body, order.getTo(),
                    isBlank(order.getLogCorrespondenceType()) ? "Order Email" : order.getLogCorrespondenceType());
        } catch (Exception e) {
            log.warn("[OrderEmail] correspondence logging failed: {}", e.getMessage());
        }
    }

    // ── body / summary ──────────────────────────────────────────────────────────

    /** The HTML email body. Byte-identical to the former chem-lab body when greeting/intro are the defaults and
     *  line units + note are null, so the existing lab reorder email is unchanged. */
    public String buildHtmlBody(OrderRequestDto o) {
        String greeting = isBlank(o.getGreeting()) ? DEFAULT_GREETING : o.getGreeting();
        String intro = isBlank(o.getIntro()) ? DEFAULT_INTRO : o.getIntro();
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#222;font-size:14px;'>");
        sb.append("<p>").append(escape(greeting)).append("</p>");
        sb.append("<p>").append(escape(intro)).append("</p>");
        sb.append("<ul style='margin:0 0 14px 18px;'>");
        for (OrderLineDto l : o.getLines()) {
            sb.append("<li><b>").append(escape(l.getDescription())).append("</b> — Qty ").append(qty(l.getQty()));
            if (!isBlank(l.getUnit())) sb.append(' ').append(escape(l.getUnit()));
            sb.append("</li>");
        }
        sb.append("</ul>");
        if (!isBlank(o.getShipTo())) {
            sb.append("<p><b>Shipping &amp; Billing Address:</b><br>")
              .append(escape(o.getShipTo()).replace("\n", "<br>")).append("</p>");
        }
        if (!isBlank(o.getPoNumber())) sb.append("<p><b>PO#</b> ").append(escape(o.getPoNumber())).append("</p>");
        if (!isBlank(o.getNote())) sb.append("<p>").append(escape(o.getNote()).replace("\n", "<br>")).append("</p>");
        sb.append("<p>Thanks,</p>");
        sb.append("</body></html>");
        return sb.toString();
    }

    /** A plain-text order summary — for callers that want to persist or attach a record of what was ordered. */
    public String renderSummaryText(OrderRequestDto o) {
        StringBuilder sb = new StringBuilder();
        sb.append(isBlank(o.getSummaryTitle()) ? "Order" : o.getSummaryTitle()).append(" — order placed\n");
        sb.append("Date:    ").append(LocalDate.now()).append('\n');
        sb.append("To:      ").append(o.getTo()).append('\n');
        if (!isBlank(o.getCc())) sb.append("CC:      ").append(o.getCc()).append('\n');
        if (!isBlank(o.getPoNumber())) sb.append("PO #:    ").append(o.getPoNumber()).append('\n');
        if (!isBlank(o.getSubject())) sb.append("Subject: ").append(o.getSubject()).append('\n');
        sb.append("\nItems ordered:\n");
        for (OrderLineDto l : o.getLines()) {
            sb.append("  - ").append(l.getDescription()).append(" — Qty ").append(qty(l.getQty()));
            if (!isBlank(l.getUnit())) sb.append(' ').append(l.getUnit());
            sb.append('\n');
        }
        if (!isBlank(o.getNote())) sb.append("\nNote:\n").append(o.getNote()).append('\n');
        if (!isBlank(o.getShipTo())) sb.append("\nShip to:\n").append(o.getShipTo()).append('\n');
        return sb.toString();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    /** Whole numbers render without a trailing ".0"; fractional keep one decimal. */
    private static String qty(Double d) {
        if (d == null) return "0";
        double v = d;
        return (v == Math.floor(v)) ? Long.toString((long) v) : String.format("%.1f", v);
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
