package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoWorkOrderAdapter {

    private static final String OS = "mxapiwodetail";
    /** Maximo LABTRANS.LABORCODE max length on this instance — a longer personid isn't a valid laborcode. */
    private static final int MAX_LABORCODE_LEN = 8;
    private static final String SELECT_FIELDS =
            "spi:wonum,spi:description,spi:description_longdescription,spi:status,"
            + "spi:worktype,spi:assetnum,spi:location,spi:siteid,spi:reportdate,"
            + "spi:targstartdate,spi:targcompdate,spi:schedstart,spi:schedfinish,spi:lead,spi:supervisor,spi:wopriority,spi:pmnum,spi:statusdate";

    /** Task fetch adds the child-WO fields; kept off the shared select so a bad field can't break every WO query. */
    private static final String TASK_SELECT_FIELDS = SELECT_FIELDS + ",spi:taskid,spi:parent,spi:istask";

    /** Ceiling for the unfiltered "latest" view — an unbounded site-wide sort is ~49k rows on this instance. */
    private static final int MAX_LATEST_PAGE_SIZE = 200;

    private final MaximoAccessService access;

    public List<MaximoWorkOrderDto> listForAsset(String assetnum, int pageSize) {
        if (assetnum == null || assetnum.isBlank()) return List.of();
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setAssetnum(assetnum);
        return listByCriteria(c, pageSize);
    }

    /** The two text columns a free-text search must cover: the WO title and its long-text body. */
    private static final List<String> TEXT_FIELDS = List.of("description", "description_longdescription");

    /**
     * AND-combined query across any subset of {status, worktype, assetnum, location, priority}.
     * Returns empty list if no criteria provided (don't blast the whole site).
     *
     * <p>{@code textContains} is special: it must match the title OR the long description, and OSLC has
     * neither {@code OR} nor parentheses. So it runs as one query per text column, merged and de-duplicated
     * by wonum in Java — the same trick the location/asset pickers use. Every other criterion is applied to
     * both queries, so the AND semantics are preserved.
     */
    public List<MaximoWorkOrderDto> listByCriteria(MaximoWorkOrderCriteria c, int pageSize) {
        if (c != null && c.getTextContains() != null && !c.getTextContains().isBlank()) {
            Map<String, MaximoWorkOrderDto> byWonum = new LinkedHashMap<>();
            for (String field : TEXT_FIELDS) {
                for (MaximoWorkOrderDto d : queryPage(buildWhere(c, field), pageSize)) {
                    if (d.getWonum() != null) byWonum.putIfAbsent(d.getWonum(), d);
                }
            }
            return newestFirst(byWonum.values(), pageSize);
        }
        return queryPage(buildWhere(c, null), pageSize);
    }

    private List<MaximoWorkOrderDto> queryPage(String where, int pageSize) {
        if (where == null) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:reportdate");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
    }

    /** Re-impose the newest-first order the merged per-field pages lost, then cap to one page. */
    private static List<MaximoWorkOrderDto> newestFirst(Collection<MaximoWorkOrderDto> rows, int pageSize) {
        return rows.stream()
                .sorted(Comparator.comparing((MaximoWorkOrderDto d) -> d.getReportdate() == null ? "" : d.getReportdate())
                        .reversed())
                .limit(Math.max(1, pageSize))
                .collect(Collectors.toList());
    }

    /**
     * The newest work orders at the site, no filter — what the Work Orders page shows on open so it isn't an
     * empty table. Deliberately a separate method rather than letting {@link #listByCriteria} fall through on
     * empty criteria: several callers there build criteria dynamically and rely on "no criteria → no rows"
     * instead of accidentally pulling the whole site. Bounded by {@code pageSize} (hard cap 200).
     */
    public List<MaximoWorkOrderDto> listLatest(String siteid, int pageSize) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.clamp(pageSize, 1, MAX_LATEST_PAGE_SIZE)));
        params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\"");
        params.put("oslc.orderBy", "-spi:reportdate");
        return mapAll(members(access.getMap(access.osUrl(OS), params)));
    }

    /**
     * Like {@link #listByCriteria} but pages through the whole result set (merges every
     * {@code pageno}). Use for catalog-style queries (e.g. a year of PM WOs across all leads) where
     * the single-page {@link #listByCriteria} would silently truncate. Returns empty if no criteria.
     */
    public List<MaximoWorkOrderDto> listAllByCriteria(MaximoWorkOrderCriteria c, int pageSizePerPage, int maxPages) {
        // textContains is a two-query merge and has no meaning for a paged scan; callers here never set it.
        String where = buildWhere(c, null);
        if (where == null) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:reportdate"); // stable sort key across page fetches
        return mapAll(access.getAllMembers(access.osUrl(OS), params, pageSizePerPage, maxPages));
    }

    /**
     * Build the AND-joined `oslc.where` (incl. siteid). Returns null when no real criteria were given.
     *
     * @param textField which column {@code textContains} is applied to on this pass
     *                  ({@code description} or {@code description_longdescription}), or null to ignore it.
     */
    private String buildWhere(MaximoWorkOrderCriteria c, String textField) {
        if (c == null) return null;
        List<String> conds = new ArrayList<>();
        if (textField != null) addLike(conds, textField, c.getTextContains());
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
        addLikePhrase(conds, "description", c.getDescriptionPhrase());
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

    /**
     * AND word-bucket, not a phrase match: {@code "unit 2 sample panel"} becomes four AND-ed {@code LIKE %word%}
     * conditions, so the words may appear in any order with anything between them. It therefore finds
     * {@code "UNIT 2 MONTHLY SAMPLE PANEL MAINTENANCE"}, which a single contiguous {@code LIKE "%unit 2 sample
     * panel%"} misses because {@code MONTHLY} breaks the phrase. Same rule the inventory picker uses.
     * A null/blank value contributes no condition.
     */
    private static void addLike(List<String> conds, String field, String value) {
        conds.addAll(MaximoOslcMapper.likeWordConditions(field, value));
    }

    /**
     * Contiguous {@code LIKE "%value%"} — the whole string, spaces and all, must appear intact. For identity
     * matching (a PM's own generated WOs), NOT for user search: a word bucket would let unrelated WOs that
     * happen to contain the same words masquerade as occurrences of that PM.
     */
    private static void addLikePhrase(List<String> conds, String field, String value) {
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
                String code = e.getLaborcode().trim().toUpperCase();
                // Maximo caps LABTRANS.LABORCODE at 8 chars (BMXAA4049E). Some people's personid is longer
                // (e.g. "ASTEIN-ROJAS") and is NOT a valid laborcode — sending it 400s the whole call and the
                // WO can't be completed. Drop that one labor row instead: the worklog + status change still go
                // through, so the WO always closes. (Labor for such users can be recorded/corrected in Maximo.)
                if (code.length() > MAX_LABORCODE_LEN) {
                    log.warn("[Maximo] laborcode '{}' exceeds Maximo's {}-char max — completing without this labor row (href {})",
                            code, MAX_LABORCODE_LEN, href);
                    continue;
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("spi:laborcode", code);
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

    /** Per-line issue/return cap — one Maximo matusetrans row = one unit (see {@link #postMaterial}). */
    private static final int MAX_UNITS_PER_LINE = 500;

    /**
     * Add matusetrans rows of a given issue type. {@code storeroom} defaults to WAREHOUSE1 when blank; each
     * line's storeroom overrides it.
     *
     * <p><b>Maximo quantity quirk (verified live 2026-07-09 on WO J26-41830):</b> a matusetrans added via the
     * {@code mxapiwodetail} MERGE ALWAYS issues exactly ONE unit — the {@code quantity}/{@code enterquantity}/
     * {@code qtyrequested} fields are ignored on create (qtyrequested is stored but the actual issued
     * {@code quantity} stays 1). Multiple rows in one payload DO each issue a unit. So a line quantity of N is
     * expanded into N single-unit rows. Whole units only (parts are issued in EACH); a fractional quantity is
     * rounded to the nearest whole unit (this API path cannot issue a partial unit).
     */
    private void postMaterial(String href, List<com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest.Line> lines,
                              String storeroom, String issuetype) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (lines == null || lines.isEmpty()) return;
        // Request-level fallback storeroom; each line may override it with the exact warehouse the user picked
        // (critical when the same itemnum is stocked ACTIVE in one warehouse and OBSOLETE in another).
        String fallbackStore = (storeroom != null && !storeroom.isBlank())
                ? storeroom : MaximoInventoryAdapter.DEFAULT_STOREROOM;
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var line : lines) {
            if (line == null || line.getItemnum() == null || line.getItemnum().isBlank()) continue;
            double qty = line.getQuantity() == null ? 0 : line.getQuantity();
            if (qty <= 0) continue;
            long units = Math.round(qty);
            if (units < 1) units = 1;
            if (units > MAX_UNITS_PER_LINE) {
                throw new IllegalArgumentException("Maximo issues one unit per line; " + units + " of item "
                        + line.getItemnum().trim() + " exceeds the " + MAX_UNITS_PER_LINE + "-unit cap — split it.");
            }
            String store = (line.getStoreroom() != null && !line.getStoreroom().isBlank())
                    ? line.getStoreroom().trim() : fallbackStore;
            // One row per unit — the quantity field is ignored by Maximo on this path (see javadoc).
            for (long i = 0; i < units; i++) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("spi:itemnum", line.getItemnum().trim());
                row.put("spi:storeloc", store);
                row.put("spi:issuetype", issuetype);
                rows.add(row);
            }
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
        assertDueForCompletion(href);
        reportActuals(href, req.getLabor(), req.getSummary(), req.getDetails(), req.getLogtype());
        boolean doComplete = req.getComplete() == null || req.getComplete();
        if (doComplete) {
            String status = (req.getStatus() != null && !req.getStatus().isBlank()) ? req.getStatus() : "COMP";
            changeStatus(href, status, req.getMemo());
        }
        return findByHref(href);
    }

    /**
     * A PM work order may only be completed once it is DUE — its target start is today or earlier. A WO that is
     * approved but scheduled for a future date must not be completed early (which would attach a completion form
     * and close the WO before its period). Throws a client-friendly message when not due; never blocks on a
     * read failure or an unset target date.
     */
    public void assertDueForCompletion(String href) {
        if (href == null || href.isBlank()) return;
        java.time.LocalDate targetStart;
        try {
            targetStart = findByHref(href).map(w -> parseWoDate(w.getTargetStart())).orElse(null);
        } catch (RuntimeException e) {
            log.debug("[Maximo] due-check read failed for {}: {}", href, e.toString());
            return;   // don't block completion on a read failure
        }
        if (targetStart != null && targetStart.isAfter(java.time.LocalDate.now())) {
            throw new IllegalStateException("This work order isn't due yet — it's scheduled for "
                    + targetStart + " and can't be completed before its period.");
        }
    }

    /** Parse a Maximo datetime string ("yyyy-MM-ddTHH:mm:ss…") to a LocalDate; null if unparseable/blank. */
    private static java.time.LocalDate parseWoDate(String iso) {
        if (iso == null || iso.length() < 10) return null;
        try { return java.time.LocalDate.parse(iso.substring(0, 10)); }
        catch (RuntimeException e) { return null; }
    }

    public Optional<MaximoWorkOrderDto> findByHref(String href) {
        if (href == null || href.isBlank()) return Optional.empty();
        Map<String, Object> body = access.getMap(
                access.osUrl(OS) + "/" + href, Map.of("oslc.select", SELECT_FIELDS));
        if (body == null) return Optional.empty();
        return Optional.of(map(body));
    }

    /**
     * The internal TASKS of a work order — the child WO rows carrying {@code istask=1} with this WO's number
     * in their {@code parent} field. Each is a full work order (own href/status), so it is displayed and
     * completed exactly like a top-level WO ({@link #changeStatus}/{@link #completeWorkOrder} on its href).
     * Ordered by task sequence. Filters {@code istask} client-side (robust against the OSLC YORN
     * where-clause quirk) so any non-task child WOs are excluded. Empty when the WO has no tasks.
     */
    public List<MaximoWorkOrderDto> listTasks(String parentWonum) {
        if (parentWonum == null || parentWonum.isBlank()) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", TASK_SELECT_FIELDS);
        params.put("oslc.where", "spi:parent=\"" + escape(parentWonum.trim()) + "\""
                + " and spi:siteid=\"" + access.defaultSite() + "\"");
        // NB: no oslc.orderBy — Maximo requires a sort-order SIGN (BMXAA8744E on a sign-less field), and the
        // '+'/'-' prefix is fragile over URL transport. Sort by task sequence in Java instead.
        params.put("oslc.pageSize", "200");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        List<MaximoWorkOrderDto> out = new ArrayList<>();
        for (Map<String, Object> row : members(body)) {
            if (Boolean.TRUE.equals(MaximoOslcMapper.boolVal(row, "istask"))) out.add(map(row));
        }
        out.sort(java.util.Comparator.comparingInt(d -> taskSeq(d.getTaskid())));
        return out;
    }

    /** Numeric task sequence for ordering; non-numeric/blank sort last. */
    private static int taskSeq(String taskid) {
        if (taskid == null || taskid.isBlank()) return Integer.MAX_VALUE;
        try { return (int) Double.parseDouble(taskid.trim()); } catch (NumberFormatException e) { return Integer.MAX_VALUE; }
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
        d.setTaskid(str(row, "taskid"));
        d.setParent(str(row, "parent"));
        d.setIstask(MaximoOslcMapper.boolVal(row, "istask"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
