package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.ReorderLineDto;
import com.dk_power.power_plant_java.dto.maximo.ReorderResultDto;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormTemplateRepo;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The reorder-email step of the chemistry-lab inventory form (see the {@code CHEM_LAB_INVENTORY} seed).
 * Convention-driven so the generic form system stays untouched: any field named {@code <key>__instock}
 * marks a reagent row; its sibling {@code <key>__desired} is the target level and {@code <key>__include}
 * whether it participates. Need = target - in-stock; included reagents with need &gt; 0 are the reorder
 * lines. On send, one email goes to the vendor ({@code cfg_email_to} / {@code cfg_email_cc}, subject carries
 * {@code cfg_po_number}) and a plain-text order summary is attached to the work order as the record that the
 * reorder was placed. Reuses {@link EmailFacadeService} (jgportal Graph API) and {@link MaximoDoclinksAdapter}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChemInventoryReorderService {

    private static final String WO_OS = "mxapiwodetail";
    private static final String INSTOCK = "__instock";
    private static final String DESIRED = "__desired";
    private static final String INCLUDE = "__include";

    private final MaximoFormTemplateRepo templateRepo;
    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoDoclinksAdapter doclinks;
    private final EmailFacadeService emailFacadeService;
    private final ObjectMapper objectMapper;

    /**
     * Compute the reorder lines for a filled inventory submission (dry run — no email, no Maximo writes).
     * Empty when nothing is below target (or the form isn't an inventory form).
     */
    public List<ReorderLineDto> computeReorder(MaximoFormSubmissionDto dto) {
        if (dto == null) return List.of();
        MaximoFormTemplate t = (dto.getTemplateFormKey() == null) ? null
                : templateRepo.findFirstByFormKey(dto.getTemplateFormKey()).orElse(null);
        List<Map<String, Object>> fields = parseList(t == null ? null : t.getFieldsJson());
        Map<String, Object> values = parseMap(dto.getValuesJson());

        List<ReorderLineDto> lines = new ArrayList<>();
        for (Map<String, Object> field : fields) {
            String name = str(field, "name");
            if (name == null || !name.endsWith(INSTOCK)) continue;
            String base = name.substring(0, name.length() - INSTOCK.length());
            if (!bool(values.get(base + INCLUDE))) continue;   // not in the reorder flow

            double inStock = num(values.get(name));
            double target = num(values.get(base + DESIRED));
            double need = target - inStock;
            if (need <= 0) continue;

            // The section header is the reagent description (used verbatim on the email); label is a fallback.
            String reagent = str(field, "section");
            if (reagent == null || reagent.isBlank()) reagent = str(field, "label");
            lines.add(ReorderLineDto.builder()
                    .reagent(reagent).target(target).inStock(inStock).need(need).build());
        }
        return lines;
    }

    /**
     * Send the vendor reorder email and attach the order summary to the work order. No-op (sent=false) when
     * there is nothing to reorder or no vendor email is set. The caller confirms with the user before this.
     */
    public ReorderResultDto sendReorder(MaximoFormSubmissionDto dto) {
        List<ReorderLineDto> lines = computeReorder(dto);
        Map<String, Object> values = parseMap(dto == null ? null : dto.getValuesJson());
        String to = trimToNull(str(values, "cfg_email_to"));
        String cc = trimToNull(str(values, "cfg_email_cc"));
        String po = trimToNull(str(values, "cfg_po_number"));
        String shipTo = trimToNull(str(values, "cfg_ship_to"));

        ReorderResultDto result = ReorderResultDto.builder()
                .lines(lines).recipient(to).cc(cc).poNumber(po).sent(false).build();

        if (lines.isEmpty()) {
            result.setMessage("No reagents are below their target level — nothing to reorder.");
            return result;
        }
        if (to == null) {
            result.setMessage("Set a vendor email in the reorder settings before sending.");
            return result;
        }

        String subject = "Reagent & Test Inventory Reorder" + (po != null ? " — PO " + po : "");
        emailFacadeService.sendEmail(EmailRequest.builder()
                .to(to).cc(cc).subject(subject).body(buildHtmlBody(lines, po, shipTo)).html(true).build());
        result.setSent(true);
        log.info("[ChemReorder] reorder email sent to {} (cc {}) — {} line(s), PO {}", to, cc, lines.size(), po);

        // Attach the order summary to the WO — the record that the reorder was placed.
        String href = resolveHref(dto);
        if (href != null) {
            try {
                byte[] summary = buildSummaryText(subject, to, cc, po, shipTo, lines).getBytes(StandardCharsets.UTF_8);
                var doclink = doclinks.upload(WO_OS, href, safeName("reorder_" + (po != null ? po : "order")) + ".txt",
                        "text/plain", summary, "Attachments");
                result.setDoclinkId(doclink == null ? null : doclink.getHref());
            } catch (Exception e) {
                log.warn("[ChemReorder] order-summary attach failed for WO {}: {}", dto.getWonum(), e.getMessage());
                result.setMessage("Reorder email sent to " + to + ", but attaching the summary to the work order failed: " + e.getMessage());
                return result;
            }
        }
        result.setMessage("Reorder email sent to " + to + (cc != null ? " (cc " + cc + ")" : "")
                + " — " + lines.size() + " item(s)" + (href != null ? "; summary attached to the work order." : "."));
        return result;
    }

    // ── body / summary ──────────────────────────────────────────────────────────

    private String buildHtmlBody(List<ReorderLineDto> lines, String po, String shipTo) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#222;font-size:14px;'>");
        sb.append("<p>Good afternoon,</p>");
        sb.append("<p>Jackson Generation would like to order the following:</p>");
        sb.append("<ul style='margin:0 0 14px 18px;'>");
        for (ReorderLineDto l : lines) {
            sb.append("<li><b>").append(escape(l.getReagent())).append("</b> — Qty ").append(qty(l.getNeed())).append("</li>");
        }
        sb.append("</ul>");
        if (shipTo != null) {
            sb.append("<p><b>Shipping &amp; Billing Address:</b><br>")
              .append(escape(shipTo).replace("\n", "<br>")).append("</p>");
        }
        if (po != null) sb.append("<p><b>PO#</b> ").append(escape(po)).append("</p>");
        sb.append("<p>Thanks,</p>");
        sb.append("</body></html>");
        return sb.toString();
    }

    private String buildSummaryText(String subject, String to, String cc, String po, String shipTo, List<ReorderLineDto> lines) {
        StringBuilder sb = new StringBuilder();
        sb.append("Reagent & Test Inventory — reorder placed\n");
        sb.append("Date:    ").append(LocalDate.now()).append('\n');
        sb.append("To:      ").append(to).append('\n');
        if (cc != null) sb.append("CC:      ").append(cc).append('\n');
        if (po != null) sb.append("PO #:    ").append(po).append('\n');
        sb.append("Subject: ").append(subject).append("\n\n");
        sb.append("Items ordered:\n");
        for (ReorderLineDto l : lines) {
            sb.append("  - ").append(l.getReagent()).append(" — Qty ").append(qty(l.getNeed()))
              .append("   (target ").append(qty(l.getTarget())).append(", in stock ").append(qty(l.getInStock())).append(")\n");
        }
        if (shipTo != null) sb.append("\nShip to:\n").append(shipTo).append('\n');
        return sb.toString();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String resolveHref(MaximoFormSubmissionDto dto) {
        if (dto == null) return null;
        if (dto.getWoHref() != null && !dto.getWoHref().isBlank()) return dto.getWoHref();
        String wonum = dto.getWonum();
        if (wonum == null || wonum.isBlank()) return null;
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setWonumContains(wonum.trim());
        for (MaximoWorkOrderDto w : workOrders.listByCriteria(c, 20)) {
            if (wonum.trim().equalsIgnoreCase(w.getWonum())) return w.getHref();
        }
        return null;
    }

    private List<Map<String, Object>> parseList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception e) { return List.of(); }
    }
    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}); }
        catch (Exception e) { return Map.of(); }
    }

    private static String str(Map<String, Object> m, String k) {
        Object o = m == null ? null : m.get(k);
        return o == null ? null : String.valueOf(o);
    }
    private static String trimToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    /** Parse a numeric form value; blank/non-numeric → 0 (a blank in-stock or target is treated as zero). */
    private static double num(Object v) {
        if (v == null) return 0;
        try { return Double.parseDouble(String.valueOf(v).trim()); } catch (NumberFormatException e) { return 0; }
    }
    /** Checkbox truthiness — Boolean true or the string "true". */
    private static boolean bool(Object v) {
        if (v instanceof Boolean b) return b;
        return v != null && "true".equalsIgnoreCase(String.valueOf(v).trim());
    }
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
    private static String safeName(String s) {
        return (s == null ? "reorder" : s).replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
