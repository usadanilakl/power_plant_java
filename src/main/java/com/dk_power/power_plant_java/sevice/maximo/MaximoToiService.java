package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.ToiCloseRequest;
import com.dk_power.power_plant_java.dto.maximo.ToiCreateRequest;
import com.dk_power.power_plant_java.dto.maximo.ToiUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TOI/TMOD (Temporary Operation Instruction / Temporary Modification) records, backed by Maximo work orders.
 *
 * There is no dedicated Maximo field, so a TOI/TMOD is identified by a marker at the START of the WO description:
 * {@link #MARKER_ACTIVE} while active, flipped to {@link #MARKER_CLOSED} on close. Both share the {@link #MARKER_PREFIX}
 * so ONE contiguous LIKE query returns every TOI/TMOD; the UI splits Active/Closed by which marker is present.
 *
 * The risk assessment + instruction-form fields are written as the first worklog note (the "log section"); ongoing
 * notes and the closure note are worklog rows too. The WO stays WAPPR — closure is tracked by the marker + closure
 * note, so it never fails on a Maximo status-flow rule.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoToiService {

    /** Shared start of both markers, so one LIKE query finds active AND closed records. */
    public static final String MARKER_PREFIX = "<<TOI/TMOD";
    public static final String MARKER_ACTIVE = "<<TOI/TMOD>>";
    public static final String MARKER_CLOSED = "<<TOI/TMOD-CLOSED>>";
    private static final String FORM_NOTE_TITLE = "TOI/TMOD RECORD";
    private static final String CLOSE_NOTE_TITLE = "TOI/TMOD CLOSED";

    private final MaximoWorkOrderAdapter workOrders;

    /** All TOI/TMOD work orders (active + closed), newest first. Few exist, so one page is enough. */
    public List<MaximoWorkOrderDto> list(String siteid, int pageSize) {
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setDescriptionPhrase(MARKER_PREFIX);   // contiguous LIKE "%<<TOI/TMOD%" — matches active + closed
        c.setSiteid(siteid);
        return workOrders.listByCriteria(c, pageSize);
    }

    /** Create a TOI/TMOD: a WAPPR WO tagged with the active marker + the form written as the first worklog note. */
    public MaximoWorkOrderDto create(ToiCreateRequest req) {
        if (req == null || req.title() == null || req.title().isBlank())
            throw new IllegalArgumentException("title is required");

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("spi:description", MARKER_ACTIVE + " " + req.title().trim());
        if (notBlank(req.instructions())) fields.put("spi:description_longdescription", req.instructions().trim());
        if (notBlank(req.location())) fields.put("spi:location", req.location().trim());
        if (notBlank(req.assetnum())) fields.put("spi:assetnum", req.assetnum().trim());
        if (notBlank(req.worktype())) fields.put("spi:worktype", req.worktype().trim());
        if (notBlank(req.siteid())) fields.put("spi:siteid", req.siteid().trim());

        MaximoWorkOrderDto wo = workOrders.create(fields);
        // The form record (risk assessment + instruction fields) as the first worklog note.
        workOrders.reportActuals(wo.getHref(), null, FORM_NOTE_TITLE, formatRecord(req), "CLIENTNOTE");
        log.info("[TOI] Created TOI/TMOD WO {} ({})", wo.getWonum(), wo.getHref());
        return wo;
    }

    /**
     * Close a TOI/TMOD: record who closed it + comments as a worklog note, flip the marker to CLOSED, and
     * complete the WO (status → COMP, like a PM). Documents are attached separately (before this call) via the
     * standard WO-attachment endpoint. The marker + closure note are written FIRST (while the WO is still editable)
     * and are the authoritative Active/Closed signal, so the status change is best-effort — if Maximo's status
     * flow rejects it, the record is still marked closed.
     */
    public MaximoWorkOrderDto update(String href, ToiUpdateRequest req) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (req == null) throw new IllegalArgumentException("request is required");
        MaximoWorkOrderDto wo = workOrders.findByHref(href).orElse(null);
        if (wo == null) throw new IllegalStateException("TOI/TMOD work order not found");

        Map<String, Object> fields = new LinkedHashMap<>();
        if (notBlank(req.title())) {
            String desc = wo.getDescription() == null ? "" : wo.getDescription();
            String marker = desc.contains(MARKER_CLOSED) ? MARKER_CLOSED : MARKER_ACTIVE;
            fields.put("spi:description", marker + " " + req.title().trim());
        }
        if (notBlank(req.instructions())) fields.put("spi:description_longdescription", req.instructions().trim());
        if (notBlank(req.location())) fields.put("spi:location", req.location().trim());
        if (notBlank(req.assetnum())) fields.put("spi:assetnum", req.assetnum().trim());
        if (notBlank(req.worktype())) fields.put("spi:worktype", req.worktype().trim());
        workOrders.updateFields(href, fields);
        log.info("[TOI] Updated TOI/TMOD {} ({} field(s))", wo.getWonum(), fields.size());
        return workOrders.findByHref(href).orElse(wo);
    }

    public MaximoWorkOrderDto close(String href, ToiCloseRequest req) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        String closedBy = (req != null && notBlank(req.closedBy())) ? req.closedBy().trim() : "app";
        String comments = (req != null && notBlank(req.comments())) ? req.comments().trim() : null;

        MaximoWorkOrderDto wo = workOrders.findByHref(href).orElse(null);
        if (wo == null) throw new IllegalStateException("TOI/TMOD work order not found");
        String desc = wo.getDescription() == null ? "" : wo.getDescription();
        if (!desc.contains(MARKER_CLOSED)) {
            String closedDesc = desc.contains(MARKER_ACTIVE)
                    ? desc.replace(MARKER_ACTIVE, MARKER_CLOSED)
                    : MARKER_CLOSED + " " + desc;
            workOrders.setDescription(href, closedDesc);
        }
        String note = "Closed by " + closedBy + (comments != null ? ". " + comments : "");
        workOrders.reportActuals(href, null, CLOSE_NOTE_TITLE, note, "CLIENTNOTE");

        // Complete the WO. A TOI/TMOD is created WAPPR, and Maximo won't jump WAPPR→COMP directly, so approve first.
        try {
            if ("WAPPR".equalsIgnoreCase(wo.getStatus())) {
                try { workOrders.changeStatus(href, "APPR", "TOI/TMOD closed"); }
                catch (Exception e) { log.warn("[TOI] APPR before COMP failed for {}: {}", wo.getWonum(), e.getMessage()); }
            }
            workOrders.changeStatus(href, "COMP", "TOI/TMOD closed");
        } catch (Exception e) {
            log.warn("[TOI] status->COMP failed for {} (still marked closed by marker/note): {}", wo.getWonum(), e.getMessage());
        }
        log.info("[TOI] Closed TOI/TMOD {} by {}", wo.getWonum(), closedBy);
        return workOrders.findByHref(href).orElse(wo);
    }

    // ── record formatting ──────────────────────────────────────────────────────

    private String formatRecord(ToiCreateRequest r) {
        int total = riskTotal(r);
        StringBuilder sb = new StringBuilder();
        sb.append("TOI/TMOD — ").append(nz(r.title())).append('\n');
        if (notBlank(r.originator())) sb.append("Originator: ").append(r.originator().trim()).append('\n');
        if (notBlank(r.approvedBy()))
            sb.append("Approved by: ").append(r.approvedBy().trim())
              .append(notBlank(r.approvedDate()) ? " (" + r.approvedDate().trim() + ")" : "").append('\n');
        if (notBlank(r.expectedCompletion())) sb.append("Expected completion: ").append(r.expectedCompletion().trim()).append('\n');
        if (notBlank(r.riskIdentified())) sb.append("\nRISK IDENTIFIED:\n").append(r.riskIdentified().trim()).append('\n');
        if (notBlank(r.countermeasures())) sb.append("\nCOUNTERMEASURES / CONTROLS:\n").append(r.countermeasures().trim()).append('\n');
        sb.append("\nRISK ASSESSMENT\n");
        sb.append(sectionLine("Safety", r.safety()));
        sb.append(sectionLine("Environmental", r.environmental()));
        sb.append(sectionLine("Operations", r.operations()));
        sb.append("TOTAL: ").append(total).append("  ->  ").append(riskLevel(total)).append('\n');
        if (notBlank(r.instructions())) sb.append("\nINSTRUCTIONS:\n").append(r.instructions().trim()).append('\n');
        return sb.toString();
    }

    private static String sectionLine(String name, ToiCreateRequest.RiskSection s) {
        if (s == null) return name + ": (not assessed)\n";
        return name + ": " + nz(s.consequenceLabel()) + " (" + nz(s.consequencePts()) + ") + "
                + nz(s.probabilityLabel()) + " (" + nz(s.probabilityPts()) + ") = " + s.score() + '\n';
    }

    /** Grand total = sum of the three section scores. */
    public static int riskTotal(ToiCreateRequest r) {
        return score(r.safety()) + score(r.environmental()) + score(r.operations());
    }

    private static int score(ToiCreateRequest.RiskSection s) { return s == null ? 0 : s.score(); }

    /**
     * Risk level from the total. The form legend reads "&lt;25 Low, &lt;45 Guarded, &gt;45 Serious", but its own
     * example shows a total of 25 = Low Risk, so the boundaries are treated as inclusive (&le;25 / &le;45).
     */
    public static String riskLevel(int total) {
        if (total <= 25) return "Low Risk";
        if (total <= 45) return "Guarded Risk";
        return "Serious Risk";
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static String nz(Object o) { return o == null ? "" : o.toString(); }
}
