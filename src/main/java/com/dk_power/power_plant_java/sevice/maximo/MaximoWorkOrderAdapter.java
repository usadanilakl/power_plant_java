package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
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
public class MaximoWorkOrderAdapter {

    private static final String OS = "mxapiwodetail";
    private static final String SELECT_FIELDS =
            "spi:wonum,spi:description,spi:description_longdescription,spi:status,"
            + "spi:worktype,spi:assetnum,spi:location,spi:siteid,spi:reportdate,"
            + "spi:targstartdate,spi:targcompdate,spi:schedstart,spi:schedfinish,spi:lead,spi:supervisor,spi:wopriority,spi:pmnum,spi:statusdate";

    private final MaximoAccessService access;

    public List<MaximoWorkOrderDto> listForAsset(String assetnum, int pageSize) {
        if (assetnum == null || assetnum.isBlank()) return List.of();
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setAssetnum(assetnum);
        return listByCriteria(c, pageSize);
    }

    /**
     * AND-combined query across any subset of {status, worktype, assetnum, location, priority}.
     * Returns empty list if no criteria provided (don't blast the whole site).
     */
    public List<MaximoWorkOrderDto> listByCriteria(MaximoWorkOrderCriteria c, int pageSize) {
        String where = buildWhere(c);
        if (where == null) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:reportdate");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
    }

    /**
     * Like {@link #listByCriteria} but pages through the whole result set (merges every
     * {@code pageno}). Use for catalog-style queries (e.g. a year of PM WOs across all leads) where
     * the single-page {@link #listByCriteria} would silently truncate. Returns empty if no criteria.
     */
    public List<MaximoWorkOrderDto> listAllByCriteria(MaximoWorkOrderCriteria c, int pageSizePerPage, int maxPages) {
        String where = buildWhere(c);
        if (where == null) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:reportdate"); // stable sort key across page fetches
        return mapAll(access.getAllMembers(access.osUrl(OS), params, pageSizePerPage, maxPages));
    }

    /** Build the AND-joined `oslc.where` (incl. siteid). Returns null when no real criteria were given. */
    private String buildWhere(MaximoWorkOrderCriteria c) {
        if (c == null) return null;
        List<String> conds = new ArrayList<>();
        addStr(conds, "status", c.getStatus());
        addStrIn(conds, "status", c.getStatusIn());
        addStr(conds, "worktype", c.getWorktype());
        addStr(conds, "pmnum", c.getPmnum());
        addStr(conds, "assetnum", c.getAssetnum());
        addStr(conds, "location", c.getLocation());
        addNum(conds, "wopriority", c.getPriority());
        addStr(conds, "lead", c.getLeadCraft());
        addStrIn(conds, "lead", c.getLeadIn());
        addStr(conds, "supervisor", c.getSupervisor());
        addStrOp(conds, "schedstart", ">=", c.getSchedstartFrom());
        addStrOp(conds, "schedfinish", "<=", c.getSchedfinishTo());
        addStrOp(conds, "reportdate", ">=", c.getReportdateFrom());
        addStrOp(conds, "reportdate", "<=", c.getReportdateTo());
        addStrOp(conds, "statusdate", ">=", c.getStatusdateFrom());
        addStrOp(conds, "statusdate", "<=", c.getStatusdateTo());
        addLike(conds, "description", c.getDescriptionContains());
        addLike(conds, "description_longdescription", c.getLongDescriptionContains());
        addLike(conds, "wonum", c.getWonumContains());
        if (conds.isEmpty()) return null;

        String siteid = (c.getSiteid() != null && !c.getSiteid().isBlank())
                ? c.getSiteid() : access.defaultSite();
        addStr(conds, "siteid", siteid);
        return String.join(" and ", conds);
    }

    /** Set a WO's lead (assignee personid) via a MERGE field update at the WO root. */
    public void setLead(String href, String personid) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (personid == null || personid.isBlank()) throw new IllegalArgumentException("personid is required");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:lead", personid.trim().toUpperCase());
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /**
     * Set a WO's Target Start ({@code spi:targstartdate}) via a MERGE field update at the WO root —
     * mirrors {@link #setLead}. Sends an ISO local datetime at midnight with NO zone offset
     * ({@code yyyy-MM-dd'T'HH:mm:ss}), matching the date-string convention this codebase uses against
     * Maximo; Maximo applies the site timezone. Used when a PM is shifted to a preferred weekday.
     */
    public void setTargetStart(String href, java.time.LocalDate date) {
        if (date == null) throw new IllegalArgumentException("date is required");
        setTargetStart(href, date.atStartOfDay().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
    }

    /** Raw-string overload: {@code targstartdate} must be a Maximo-acceptable datetime, e.g. {@code yyyy-MM-dd'T'HH:mm:ss}. */
    public void setTargetStart(String href, String targstartdate) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (targstartdate == null || targstartdate.isBlank()) throw new IllegalArgumentException("targstartdate is required");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:targstartdate", targstartdate.trim());
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /**
     * Set Target Start AND Target Finish ({@code spi:targstartdate} + {@code spi:targcompdate}) in ONE MERGE,
     * so Maximo never sees a transient finish &lt; start (which would clamp the WO to start == end). {@code finish}
     * is clamped to {@code >= start}. Same root-scalar MERGE shape as {@link #setTargetStart}; both values are
     * ISO local datetime at midnight (no offset). Used when a PM is shifted to a preferred weekday + period end.
     */
    public void setTargetWindow(String href, java.time.LocalDate start, java.time.LocalDate finish) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (start == null) throw new IllegalArgumentException("start is required");
        java.time.LocalDate end = (finish == null || finish.isBefore(start)) ? start : finish;
        var fmt = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:targstartdate", start.atStartOfDay().format(fmt));
        payload.put("spi:targcompdate", end.atStartOfDay().format(fmt));
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    private static void addStr(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=\"" + escape(value) + "\"");
    }

    private static void addNum(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=" + escape(value));
    }

    /** For comparison operators (>=, <=, >, <) on quoted values like dates. */
    private static void addStrOp(List<String> conds, String field, String op, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + op + "\"" + escape(value) + "\"");
    }

    /** SQL-style LIKE: wraps value in %...% so users type "pump" and match "%pump%". */
    private static void addLike(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=\"%" + escape(value) + "%\"");
    }

    /**
     * OSLC `in` operator: emits `spi:field in ["A","B","C"]`. Square brackets are mandatory;
     * Maximo's parser rejects parens. Empty/null list is a no-op.
     */
    private static void addStrIn(List<String> conds, String field, java.util.List<String> values) {
        if (values == null || values.isEmpty()) return;
        String joined = values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> "\"" + escape(v) + "\"")
                .collect(java.util.stream.Collectors.joining(","));
        if (joined.isEmpty()) return;
        conds.add("spi:" + field + " in [" + joined + "]");
    }

    /**
     * Record actual labor and/or a worklog note on a WO in a single AddChange call.
     * Labor rows need only laborcode + regularhrs — Maximo derives craft, transtype, rate, dates.
     * No-op if there's nothing to add. See memory reference_maximo_write_api for the wire contract.
     */
    public void reportActuals(String href, List<CompleteWorkOrderRequest.LaborEntry> labor,
                              String summary, String details, String logtype) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        Map<String, Object> payload = new LinkedHashMap<>();

        List<Map<String, Object>> labtrans = new ArrayList<>();
        if (labor != null) {
            for (CompleteWorkOrderRequest.LaborEntry e : labor) {
                if (e == null || e.getLaborcode() == null || e.getLaborcode().isBlank()) continue;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("spi:laborcode", e.getLaborcode().trim().toUpperCase());
                if (e.getRegularhrs() != null) row.put("spi:regularhrs", e.getRegularhrs());
                labtrans.add(row);
            }
        }
        if (!labtrans.isEmpty()) payload.put("spi:labtrans", labtrans);

        boolean hasSummary = summary != null && !summary.isBlank();
        boolean hasDetails = details != null && !details.isBlank();
        if (hasSummary || hasDetails) {
            Map<String, Object> log = new LinkedHashMap<>();
            // Summary is required for a meaningful worklog row; fall back to a stub if only details given.
            log.put("spi:description", hasSummary ? summary.trim() : "Note");
            if (hasDetails) log.put("spi:description_longdescription", details.trim());
            log.put("spi:logtype", (logtype != null && !logtype.isBlank()) ? logtype.trim() : "CLIENTNOTE");
            payload.put("spi:worklog", List.of(log));
        }

        if (payload.isEmpty()) return;
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /**
     * Create a new work order. Like SR-create, every field must carry the {@code spi:} prefix or it
     * is silently dropped. New WOs come back at status WAPPR. Returns the created WO (with href + wonum).
     */
    public MaximoWorkOrderDto create(String description, String location, String worktype, String siteid) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (description != null && !description.isBlank()) payload.put("spi:description", description.trim());
        if (location != null && !location.isBlank()) payload.put("spi:location", location.trim());
        if (worktype != null && !worktype.isBlank()) payload.put("spi:worktype", worktype.trim());
        payload.put("spi:siteid", (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite());
        Map<String, Object> created = access.postJson(access.osUrl(OS), null, payload);
        log.info("[Maximo] Created WO wonum={}", str(created, "wonum"));
        return map(created);
    }

    /**
     * Issue material lines against a WO (matusetrans actuals). One additive MERGE call; positive
     * quantity = issue. {@code storeroom} defaults to WAREHOUSE1 when blank. No-op if no lines.
     */
    public void addMaterials(String href, List<com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest.Line> lines,
                             String storeroom) {
        postMaterial(href, lines, storeroom, "ISSUE");
    }

    /**
     * Return material to inventory (reverses an issue). Same matusetrans add as an issue but with
     * {@code spi:issuetype="RETURN"}: a positive quantity is stored positive and the line cost is
     * credited back. Verified against a real RETURN row on this instance. Works on a COMP WO.
     */
    public void returnMaterials(String href, List<com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest.Line> lines,
                                String storeroom) {
        postMaterial(href, lines, storeroom, "RETURN");
    }

    /**
     * Add matusetrans rows of a given issue type. {@code storeroom} defaults to WAREHOUSE1 when blank;
     * quantity is the positive absolute amount (Maximo applies the sign from issuetype). No-op if no lines.
     */
    private void postMaterial(String href, List<com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest.Line> lines,
                              String storeroom, String issuetype) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (lines == null || lines.isEmpty()) return;
        String store = (storeroom != null && !storeroom.isBlank())
                ? storeroom : MaximoInventoryAdapter.DEFAULT_STOREROOM;
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var line : lines) {
            if (line == null || line.getItemnum() == null || line.getItemnum().isBlank()) continue;
            double qty = line.getQuantity() == null ? 0 : line.getQuantity();
            if (qty <= 0) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("spi:itemnum", line.getItemnum().trim());
            row.put("spi:quantity", qty);
            row.put("spi:storeloc", store);
            row.put("spi:issuetype", issuetype);
            rows.add(row);
        }
        if (rows.isEmpty()) return;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:matusetrans", rows);
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /** Actual material rows (matusetrans) on a WO — issues and returns. */
    public List<com.dk_power.power_plant_java.dto.maximo.MaximoMaterialTxnDto> listMaterials(String href) {
        if (href == null || href.isBlank()) return List.of();
        Map<String, Object> body = access.getMap(
                access.osUrl(OS) + "/" + href + "/uxshowactualmaterial", Map.of("oslc.select", "*"));
        List<com.dk_power.power_plant_java.dto.maximo.MaximoMaterialTxnDto> out = new ArrayList<>();
        for (Map<String, Object> row : members(body)) {
            var d = new com.dk_power.power_plant_java.dto.maximo.MaximoMaterialTxnDto();
            d.setMatusetransid(MaximoOslcMapper.longVal(row, "matusetransid"));
            d.setItemnum(str(row, "itemnum"));
            d.setDescription(str(row, "description"));
            d.setIssuetype(str(row, "issuetype"));
            d.setStoreloc(str(row, "storeloc"));
            d.setIssueunit(str(row, "issueunit"));
            String q = str(row, "quantity");
            d.setQuantity(q == null ? null : safeDouble(q));
            String lc = str(row, "linecost");
            d.setLinecost(lc == null ? null : safeDouble(lc));
            out.add(d);
        }
        return out;
    }

    private static Double safeDouble(String s) {
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }

    /** Change WO status via the changeStatus action method (e.g. COMP). */
    public void changeStatus(String href, String status, String memo) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (status == null || status.isBlank()) throw new IllegalArgumentException("status is required");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.trim().toUpperCase());
        if (memo != null && !memo.isBlank()) body.put("memo", memo.trim());
        access.invokeAction(access.osUrl(OS) + "/" + href, "wsmethod:changeStatus", body);
    }

    /**
     * The full "complete work order" flow: record actuals (labor + worklog), then optionally
     * change status (default COMP). Returns the refreshed WO. Labor codes must already be resolved.
     */
    public Optional<MaximoWorkOrderDto> completeWorkOrder(String href, CompleteWorkOrderRequest req) {
        reportActuals(href, req.getLabor(), req.getSummary(), req.getDetails(), req.getLogtype());
        boolean doComplete = req.getComplete() == null || req.getComplete();
        if (doComplete) {
            String status = (req.getStatus() != null && !req.getStatus().isBlank()) ? req.getStatus() : "COMP";
            changeStatus(href, status, req.getMemo());
        }
        return findByHref(href);
    }

    public Optional<MaximoWorkOrderDto> findByHref(String href) {
        if (href == null || href.isBlank()) return Optional.empty();
        Map<String, Object> body = access.getMap(
                access.osUrl(OS) + "/" + href, Map.of("oslc.select", SELECT_FIELDS));
        if (body == null) return Optional.empty();
        return Optional.of(map(body));
    }

    private List<MaximoWorkOrderDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoWorkOrderDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoWorkOrderDto map(Map<String, Object> row) {
        MaximoWorkOrderDto d = new MaximoWorkOrderDto();
        d.setHref(hrefId(row));
        d.setWonum(str(row, "wonum"));
        d.setDescription(str(row, "description"));
        d.setLongDescription(str(row, "description_longdescription"));
        d.setStatus(str(row, "status"));
        d.setWorktype(str(row, "worktype"));
        d.setAssetnum(str(row, "assetnum"));
        d.setLocation(str(row, "location"));
        d.setSiteid(str(row, "siteid"));
        d.setReportdate(str(row, "reportdate"));
        d.setTargetStart(str(row, "targstartdate"));
        d.setTargetFinish(str(row, "targcompdate"));
        d.setSchedstart(str(row, "schedstart"));
        d.setSchedfinish(str(row, "schedfinish"));
        d.setLeadCraft(str(row, "lead"));
        d.setSupervisor(str(row, "supervisor"));
        d.setPriority(str(row, "wopriority"));
        d.setPmnum(str(row, "pmnum"));
        d.setStatusDate(str(row, "statusdate"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
