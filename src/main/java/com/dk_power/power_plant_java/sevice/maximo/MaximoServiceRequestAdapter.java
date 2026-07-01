package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoServiceRequestAdapter {

    private static final String OS = "mxapisr";
    private static final String SELECT_FIELDS =
            "spi:ticketid,spi:description,spi:description_longdescription,spi:status,"
            + "spi:assetnum,spi:location,spi:siteid,spi:reportedby,spi:reportdate,"
            + "spi:classstructureid,spi:reportedpriority,spi:affectedperson";

    private final MaximoAccessService access;

    /** List service requests by status (e.g. "NEW", "QUEUED", "INPROG", "RESOLVED", "CLOSED"). */
    public List<MaximoServiceRequestDto> listByStatus(String status, int pageSize) {
        if (status == null || status.isBlank()) return List.of();
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
        c.setStatus(status);
        return listByCriteria(c, pageSize);
    }

    /** List service requests for a given assetnum, newest reportdate first. */
    public List<MaximoServiceRequestDto> listForAsset(String assetnum, int pageSize) {
        if (assetnum == null || assetnum.isBlank()) return List.of();
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
        c.setAssetnum(assetnum);
        return listByCriteria(c, pageSize);
    }

    /**
     * AND-combined query across any subset of SR criteria fields.
     * Returns empty list if no criteria provided (don't blast the whole site).
     */
    public List<MaximoServiceRequestDto> listByCriteria(MaximoServiceRequestCriteria c, int pageSize) {
        if (c == null) return List.of();
        List<String> conds = new ArrayList<>();
        addStr(conds, "status", c.getStatus());
        addStr(conds, "assetnum", c.getAssetnum());
        addStr(conds, "location", c.getLocation());
        addNum(conds, "reportedpriority", c.getPriority());
        addStr(conds, "reportedby", c.getReportedby());
        addStr(conds, "affectedperson", c.getAffectedperson());
        addStr(conds, "classstructureid", c.getClassstructureid());
        addStrOp(conds, "reportdate", ">=", c.getReportdateFrom());
        addStrOp(conds, "reportdate", "<=", c.getReportdateTo());
        addLike(conds, "description", c.getDescriptionContains());
        addLike(conds, "description_longdescription", c.getLongDescriptionContains());
        if (conds.isEmpty()) return List.of();

        String siteid = (c.getSiteid() != null && !c.getSiteid().isBlank())
                ? c.getSiteid() : access.defaultSite();
        addStr(conds, "siteid", siteid);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where", String.join(" and ", conds));
        params.put("oslc.orderBy", "-spi:reportdate");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
    }

    private static void addStr(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=\"" + escape(value) + "\"");
    }

    private static void addNum(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=" + escape(value));
    }

    private static void addStrOp(List<String> conds, String field, String op, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + op + "\"" + escape(value) + "\"");
    }

    private static void addLike(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=\"%" + escape(value) + "%\"");
    }

    public Optional<MaximoServiceRequestDto> findByHref(String href) {
        if (href == null || href.isBlank()) return Optional.empty();
        Map<String, Object> body = access.getMap(
                access.osUrl(OS) + "/" + href, Map.of("oslc.select", SELECT_FIELDS));
        if (body == null) return Optional.empty();
        return Optional.of(map(body));
    }

    /**
     * Create a new service request.
     *
     * Maximo OSLC requires the `spi:` namespace prefix on every payload field — unprefixed
     * keys are silently dropped, leaving an empty record. Confirmed by curl probe: a POST
     * with `{"description": "..."}` sticks only `siteid` and `ticketid`; with `{"spi:description": "..."}`
     * everything sticks. Maximo also auto-populates `location` from the asset's location
     * when `assetnum` is set, so we don't need to send location explicitly.
     */
    public MaximoServiceRequestDto create(CreateMaximoServiceRequestDto req) {
        Map<String, Object> payload = new LinkedHashMap<>();
        putIfPresent(payload, "spi:description", req.getDescription());
        putIfPresent(payload, "spi:description_longdescription", req.getLongDescription());
        putIfPresent(payload, "spi:assetnum", req.getAssetnum());
        putIfPresent(payload, "spi:location", req.getLocation());
        payload.put("spi:siteid",
                (req.getSiteid() != null && !req.getSiteid().isBlank()) ? req.getSiteid() : access.defaultSite());
        putIfPresent(payload, "spi:reportedby", req.getReportedby());
        putIfPresent(payload, "spi:classstructureid", req.getClassstructureid());
        putIfPresent(payload, "spi:reportedpriority", req.getPriority());
        putIfPresent(payload, "spi:affectedperson", req.getAffectedperson());
        // class is "SR" — required so Maximo creates a Service Request (not an Incident or Problem)
        payload.put("spi:class", "SR");

        Map<String, Object> created = access.postJson(access.osUrl(OS), null, payload);
        log.info("[Maximo] Created SR ticketid={}", str(created, "ticketid"));
        return map(created);
    }

    /**
     * Update an editable SR's whitelisted fields via a root MERGE-PATCH, mirroring
     * {@code MaximoWorkOrderAdapter.setLead}. {@code spiFields} maps each {@code spi:}-prefixed column to its
     * new value; only non-blank values are sent (so a clear is a no-op, and unset fields are untouched).
     * The PATCH answers 204, so the refreshed record is re-fetched. Sending assetnum + location together in
     * one MERGE avoids a transient asset/location mismatch (Maximo derives location from asset).
     */
    public MaximoServiceRequestDto updateFields(String href, Map<String, String> spiFields) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        Map<String, Object> payload = new LinkedHashMap<>();
        if (spiFields != null) spiFields.forEach((k, v) -> putIfPresent(payload, k, v));
        if (!payload.isEmpty()) access.addChildren(access.osUrl(OS) + "/" + href, payload);
        return findByHref(href).orElse(null);
    }

    /**
     * Add a worklog note to an SR via an additive MERGE of one {@code spi:worklog} row. The SR worklog
     * READ sub-collection is {@code uxworklog}, but the inline WRITE key is the generic {@code spi:worklog}
     * (same as WOs) — if rows ever fail to persist on this instance, fall back to {@code spi:uxworklog}.
     */
    public void addWorklog(String href, String summary, String details, String logtype) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        boolean hasSummary = summary != null && !summary.isBlank();
        boolean hasDetails = details != null && !details.isBlank();
        if (!hasSummary && !hasDetails) return;
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("spi:description", hasSummary ? summary.trim() : "Note");
        if (hasDetails) row.put("spi:description_longdescription", details.trim());
        row.put("spi:logtype", (logtype != null && !logtype.isBlank()) ? logtype.trim() : "CLIENTNOTE");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:worklog", List.of(row));
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    private static void putIfPresent(Map<String, Object> payload, String key, String value) {
        if (value != null && !value.isBlank()) payload.put(key, value);
    }

    private List<MaximoServiceRequestDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoServiceRequestDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoServiceRequestDto map(Map<String, Object> row) {
        MaximoServiceRequestDto d = new MaximoServiceRequestDto();
        d.setHref(hrefId(row));
        d.setTicketid(str(row, "ticketid"));
        d.setDescription(str(row, "description"));
        d.setLongDescription(str(row, "description_longdescription"));
        d.setStatus(str(row, "status"));
        d.setAssetnum(str(row, "assetnum"));
        d.setLocation(str(row, "location"));
        d.setSiteid(str(row, "siteid"));
        d.setReportedby(str(row, "reportedby"));
        d.setReportdate(str(row, "reportdate"));
        d.setClassstructureid(str(row, "classstructureid"));
        d.setPriority(str(row, "reportedpriority"));
        d.setAffectedperson(str(row, "affectedperson"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
