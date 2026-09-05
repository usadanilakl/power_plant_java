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
            "spi:workorderid,spi:wonum,spi:description,spi:description_longdescription,spi:status,"
            + "spi:worktype,spi:assetnum,spi:location,spi:siteid,spi:reportdate,"
            + "spi:targstartdate,spi:targcompdate,spi:schedstart,spi:schedfinish,spi:lead,spi:supervisor,spi:wopriority,spi:pmnum,spi:statusdate,spi:reportedby";

    /** Task fetch adds the child-WO fields; kept off the shared select so a bad field can't break every WO query. */
    private static final String TASK_SELECT_FIELDS = SELECT_FIELDS + ",spi:taskid,spi:parent,spi:istask";

    /** Ceiling for the unfiltered "latest" view — an unbounded site-wide sort is ~49k rows on this instance. */
    private static final int MAX_LATEST_PAGE_SIZE = 200;

    private final MaximoAccessService access;

    /**
     * WORKORDER attribute holding the outage-type domain (PLAN/SNOW). Configurable because it may be a custom
     * field on some instances; default {@code outagetype} is the stock Maximo attribute. Overridable via
     * {@code maximo.outage-type-attr} so a wrong name is a config change, not a rebuild.
     */
    @org.springframework.beans.factory.annotation.Value("${maximo.outage-type-attr:naes_outagetype}")
    private String outageTypeAttr = "naes_outagetype";

    /** Worklog title (description) that marks a note as a LOTO isolation note, so the outage view can show only
     *  those. Kept server-side: callers add via {@link #addLotoNote} and filter via {@link #isLotoNote}. */
    public static final String LOTO_NOTE_TITLE = "LOTO ISOLATION";

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
        addStr(conds, "reportedby", c.getReportedby());
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
        addStrIn(conds, outageTypeAttr, c.getOutageTypeIn());
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

    /**
     * Update editable WO fields (description / longDescription / location / assetnum) in one
     * MERGE. Any null / blank value is skipped, so callers can partial-update. Used by the
     * field-list bridge to propagate PWA-side edits to the Maximo WO record so the two views
     * stay in sync (previously only status changes made it through — description/location
     * edits from PWA stayed local + SP only).
     *
     * <p>Same root-scalar MERGE primitive as {@link #setTargetWindow}. spi: prefix is
     * MANDATORY per {@link #create} — unprefixed keys are silently dropped by mxapiwodetail.
     */
    public void updateFields(String href, String description, String longDescription,
                             String location, String assetnum) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        Map<String, Object> payload = new LinkedHashMap<>();
        if (description != null && !description.isBlank()) payload.put("spi:description", description.trim());
        if (longDescription != null && !longDescription.isBlank())
            payload.put("spi:description_longdescription", longDescription.trim());
        if (location != null && !location.isBlank()) payload.put("spi:location", location.trim());
        if (assetnum != null && !assetnum.isBlank()) payload.put("spi:assetnum", assetnum.trim());
        if (payload.isEmpty()) return; // nothing to update — silent no-op
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
     * Work orders whose outage-type ({@link #outageTypeAttr}) is one of {@code types} (e.g. PLAN/SNOW), newest
     * first. Self-contained (its own select + where) so that if the outage attribute is misconfigured on an
     * instance, only this query fails — never the shared {@link #SELECT_FIELDS} used by every other WO query.
     */
    public List<MaximoWorkOrderDto> listByOutageType(List<String> types, String siteid, int pageSize) {
        return listOutageWithNotes(types, siteid, pageSize).stream().map(OutageWo::wo).toList();
    }

    /** Resolve a WO's OSLC href from its wonum (exact match), or null. For WO-scoped writes like the Q&A worklog. */
    public String findHrefByWonum(String wonum) {
        if (wonum == null || wonum.isBlank()) return null;
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setWonumContains(wonum.trim());
        for (MaximoWorkOrderDto w : listByCriteria(c, 20)) {
            if (wonum.trim().equalsIgnoreCase(w.getWonum())) return w.getHref();
        }
        return null;
    }

    /** An outage WO row paired with its LOTO isolation worklog rows (mapped from the ONE inline worklog select). */
    public record OutageWo(MaximoWorkOrderDto wo,
                           List<com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto> lotoNotes) {}

    /**
     * Like {@link #listByOutageType} but also returns each WO's LOTO isolation worklog rows (title == the marker),
     * so callers can parse the note text / read the note timestamps without a per-WO round trip. The outage
     * coverage view uses this to detect LOTOs mentioned in a WO's log and to compute the log-time range.
     */
    public List<OutageWo> listOutageWithNotes(List<String> types, String siteid, int pageSize) {
        if (types == null || types.isEmpty()) return List.of();
        List<String> conds = new ArrayList<>();
        addStrIn(conds, outageTypeAttr, types);
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        addStr(conds, "siteid", site);
        // Non-history only: outage WOs go to history (historyflag=1) the moment they CLOSE, and there are
        // thousands of those. The operator view wants the OPEN outage work (APPR/INPRG/WMATL/WPCOND/…) — the
        // same set Maximo's default WO list shows (~165), not the closed backlog.
        addNum(conds, "historyflag", "0");
        String where = String.join(" and ", conds);
        String baseSelect = SELECT_FIELDS + ",spi:" + outageTypeAttr;

        // Enrich with the WO's worklog INLINE so we can flag which WOs already have a LOTO note in this ONE query
        // (no per-WO calls). Select the collection BY NAME ("spi:worklog") — NOT the OSLC brace sub-select
        // "spi:worklog{spi:description}": Spring's UriComponentsBuilder misreads "{...}" as a URI-template variable,
        // leaves the braces unencoded, and URI construction then throws "Illegal character {" so the whole query
        // fails (the 502). If the enriched select is rejected for any reason, fall back to the plain query so the
        // list ALWAYS loads — the badge just won't populate.
        List<Map<String, Object>> rows;
        boolean enriched = true;
        try {
            rows = members(access.getMap(access.osUrl(OS), outageParams(baseSelect + ",spi:worklog", where, pageSize)));
        } catch (RuntimeException e) {
            log.warn("[Maximo] outage worklog-enrich failed ({}) — loading without LOTO counts", e.getMessage());
            rows = members(access.getMap(access.osUrl(OS), outageParams(baseSelect, where, pageSize)));
            enriched = false;
        }
        List<OutageWo> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            MaximoWorkOrderDto d = map(row);
            List<com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto> notes =
                    enriched ? extractLotoNotes(row) : List.of();
            d.setLotoNoteCount(notes.size());
            out.add(new OutageWo(d, notes));
        }
        return out;
    }

    private static Map<String, String> outageParams(String select, String where, int pageSize) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", select);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:reportdate");
        return params;
    }

    /** Map a WO row's inline {@code spi:worklog} to the LOTO isolation notes only (rows titled {@link #LOTO_NOTE_TITLE}). */
    @SuppressWarnings("unchecked")
    private static List<com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto> extractLotoNotes(Map<String, Object> row) {
        Object wl = row.get("spi:worklog");
        if (!(wl instanceof List<?> list)) return List.of();
        List<com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto> out = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) continue;
            Map<String, Object> mm = (Map<String, Object>) m;
            Object desc = mm.get("spi:description");
            if (desc == null || !LOTO_NOTE_TITLE.equalsIgnoreCase(desc.toString().trim())) continue;
            com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto d =
                    new com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto();
            d.setDescription(desc.toString());
            Object ld = mm.get("spi:description_longdescription");
            if (ld != null) d.setLongDescription(ld.toString());
            Object cd = mm.get("spi:createdate");
            if (cd != null) d.setCreatedate(cd.toString());
            Object cb = mm.get("spi:createby");
            if (cb != null) d.setCreateby(cb.toString());
            Object wid = mm.get("spi:worklogid");
            if (wid instanceof Number num) d.setWorklogid(num.longValue());
            out.add(d);
        }
        return out;
    }

    /** Add a LOTO isolation note to a WO: a worklog whose title is the {@link #LOTO_NOTE_TITLE} marker and whose
     *  long text is the operator's isolation description. No labor, no status change. */
    public void addLotoNote(String href, String isolationText) {
        reportActuals(href, null, LOTO_NOTE_TITLE, isolationText, "CLIENTNOTE");
    }

    /** True when a worklog row is a LOTO isolation note (title == the marker), so the outage view can show only those. */
    public static boolean isLotoNote(com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto w) {
        return w != null && w.getDescription() != null && w.getDescription().trim().equalsIgnoreCase(LOTO_NOTE_TITLE);
    }

    /**
     * Create a new work order. Like SR-create, every field must carry the {@code spi:} prefix or it
     * is silently dropped. New WOs come back at status WAPPR. Returns the created WO (with href + wonum).
     */
    public MaximoWorkOrderDto create(String description, String location, String worktype, String siteid) {
        return create(description, null, location, worktype, siteid);
    }

    /**
     * Full-form overload that also sets {@code spi:description_longdescription}. Kept as a separate
     * signature so existing callers (parts checkout) don't need to pass null. Everything else is
     * identical to the 4-arg form — same silent-drop rule for spi: prefix, same WAPPR-on-create.
     */
    public MaximoWorkOrderDto create(String description, String longDescription, String location, String worktype, String siteid) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (description != null && !description.isBlank()) payload.put("spi:description", description.trim());
        if (longDescription != null && !longDescription.isBlank())
            payload.put("spi:description_longdescription", longDescription.trim());
        if (location != null && !location.isBlank()) payload.put("spi:location", location.trim());
        if (worktype != null && !worktype.isBlank()) payload.put("spi:worktype", worktype.trim());
        payload.put("spi:siteid", (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite());
        Map<String, Object> created = access.postJson(access.osUrl(OS), null, payload);
        log.info("[Maximo] Created WO wonum={}", str(created, "wonum"));
        return map(created);
    }

    private volatile List<String> worktypeCache = null;
    private volatile long worktypeCacheAt = 0L;
    private static final long WORKTYPE_TTL_MS = 10 * 60 * 1000;

    /**
     * Work-type codes that must ALWAYS appear in the filter even if no WO uses them yet (e.g. a newly-added
     * worktype). Overridable via {@code maximo.curated-worktypes} (comma-separated). Maximo's worktype domain OS
     * (MXDOMAIN) is access-blocked here, so a brand-new code can't be discovered from WOs OR the domain — it has
     * to be listed here. ADD THE WINTERIZATION CODE HERE once confirmed (it isn't in any WO yet).
     */
    @org.springframework.beans.factory.annotation.Value("${maximo.curated-worktypes:PM,CM,INS,PRO,WAR,SAF,REG,MOC,WINT}")
    private String curatedWorktypesCsv = "PM,CM,INS,PRO,WAR,SAF,REG,MOC,WINT";

    /**
     * The work-type codes for the filter: the distinct codes actually in use (derived from real WOs, since the
     * domain OS is blocked) UNION the curated always-show set (so newly-added-but-unused codes still appear).
     * Sorted, cached 10 min.
     */
    public List<String> distinctWorktypes(String siteid) {
        long now = System.currentTimeMillis();
        List<String> cached = worktypeCache;
        if (cached != null && (now - worktypeCacheAt) < WORKTYPE_TTL_MS) return cached;
        java.util.TreeSet<String> set = new java.util.TreeSet<>();
        for (String c : curatedWorktypesCsv.split(",")) { String t = c.trim(); if (!t.isEmpty()) set.add(t); }
        try {
            String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
            Map<String, String> params = new LinkedHashMap<>();
            params.put("oslc.select", "spi:worktype");
            params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\"");
            params.put("oslc.pageSize", "2000");
            params.put("oslc.orderBy", "-spi:reportdate");
            for (Map<String, Object> row : members(access.getMap(access.osUrl(OS), params))) {
                String wt = str(row, "worktype");
                if (wt != null && !wt.isBlank()) set.add(wt.trim());
            }
        } catch (RuntimeException e) {
            log.warn("[Maximo] worktype discovery failed ({}) — using curated set only", e.getMessage());
        }
        List<String> out = new ArrayList<>(set);
        worktypeCache = out;
        worktypeCacheAt = now;
        return out;
    }

    /** Create a WO from an arbitrary spi-field map (each key MUST be spi-prefixed or it is silently dropped);
     *  defaults {@code spi:siteid}. New WO comes back WAPPR. Used by TOI/TMOD create (needs assetnum + longdesc). */
    public MaximoWorkOrderDto create(Map<String, Object> spiFields) {
        Map<String, Object> payload = new LinkedHashMap<>(spiFields);
        payload.putIfAbsent("spi:siteid", access.defaultSite());
        Map<String, Object> created = access.postJson(access.osUrl(OS), null, payload);
        log.info("[Maximo] Created WO wonum={}", str(created, "wonum"));
        return map(created);
    }

    /** Update a WO's description via a MERGE scalar write (used to flip the TOI/TMOD active↔closed marker). */
    public void setDescription(String href, String description) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("spi:description", description == null ? "" : description.trim());
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /** MERGE-update a WO's scalar fields (each key must be spi-prefixed). No-op if the map is empty. */
    public void updateFields(String href, Map<String, Object> spiFields) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (spiFields == null || spiFields.isEmpty()) return;
        access.addChildren(access.osUrl(OS) + "/" + href, new LinkedHashMap<>(spiFields));
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

    /**
     * Maximo WORKORDER.NP_STATUSMEMO max length on this instance. A longer changeStatus memo makes Maximo reject
     * the ENTIRE status change with BMXAA4590E ("Could not change Work Order … status") wrapping a BMXAA4049E
     * field-length error — so the WO silently never closes. A long PM form name (e.g. "Completed form: Emergency
     * Eyewash & Safety Shower Inspection (SMP-06)") blows past it. Truncate the memo rather than fail the close.
     */
    private static final int MAX_STATUS_MEMO_LEN = 50;

    /**
     * The Inventory Usage UDA that Maximo requires on every WO COMP (rolled out 2026-08-17 by
     * ops). Discovered via live probe (see comment on {@link #ensureInventoryUsageFlag}). Field
     * shown in the Maximo Web UI as "Inventory Usage" with values "N" (No) / "Y" (Yes).
     */
    static final String INV_USAGE_FIELD = "spi:invusage_xf";

    /** Change WO status via the changeStatus action method (e.g. COMP). */
    public void changeStatus(String href, String status, String memo) {
        if (href == null || href.isBlank()) throw new IllegalArgumentException("href is required");
        if (status == null || status.isBlank()) throw new IllegalArgumentException("status is required");
        String s = status.trim().toUpperCase();
        // Maximo (post-2026-08-17) enforces two mandatory fields on the COMP transition:
        //   1. spi:invusage_xf — Inventory Usage (Y/N)
        //   2. at least one WOWORKLOG child row
        // Without them, wsmethod:changeStatus rejects with BMXAA4590E wrapping a
        // BMXAA5401E "required field" error and the WO silently never closes.
        // Auto-fill both here so EVERY caller that hits COMP is safe, regardless of whether
        // they invoked reportActuals first. Idempotent — the flag is a scalar upsert and
        // ensureWorklogPresent short-circuits when the WO already has a worklog row.
        if ("COMP".equals(s)) {
            try {
                ensureInventoryUsageFlag(href);
            } catch (RuntimeException e) {
                log.warn("[Maximo] Failed to set {} on {} before COMP: {}", INV_USAGE_FIELD, href, e.getMessage());
            }
            try {
                ensureWorklogPresent(href, memo);
            } catch (RuntimeException e) {
                log.warn("[Maximo] Failed to ensure worklog on {} before COMP: {}", href, e.getMessage());
            }
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", s);
        if (memo != null && !memo.isBlank()) {
            String m = memo.trim();
            if (m.length() > MAX_STATUS_MEMO_LEN) m = m.substring(0, MAX_STATUS_MEMO_LEN).trim();
            body.put("memo", m);
        }
        access.invokeAction(access.osUrl(OS) + "/" + href, "wsmethod:changeStatus", body);
    }

    /**
     * Set {@link #INV_USAGE_FIELD} to "Y" if the WO has any matusetrans row (materials used) or
     * "N" otherwise. Auto-detection matches the Maximo Web UI behavior — ops sets the flag
     * based on whether they issued parts against the WO. One extra Maximo call per COMP
     * (listMaterials probe); acceptable since COMP is a low-frequency operation.
     *
     * <p>Field discovered by live probe against a completed WO 2026-08-17. Values verified: the
     * ALN domain backing the field has exactly two entries — N (No) / Y (Yes).
     */
    public void ensureInventoryUsageFlag(String href) {
        if (href == null || href.isBlank()) return;
        boolean hasMaterials;
        try {
            hasMaterials = !listMaterials(href).isEmpty();
        } catch (RuntimeException e) {
            // Probe failed — default to "N" rather than block COMP. If it turns out the WO did
            // have materials, ops corrects the flag in the Maximo Web UI in ~5 seconds. Better
            // than a full COMP-failure loop.
            log.warn("[Maximo] listMaterials probe failed for {} — defaulting invusage=N: {}", href, e.getMessage());
            hasMaterials = false;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put(INV_USAGE_FIELD, hasMaterials ? "Y" : "N");
        access.addChildren(access.osUrl(OS) + "/" + href, payload);
    }

    /**
     * Guarantee the WO has at least one worklog before COMP. If the WO already has one (any
     * child row on {@code /woworklog}), no-op. Otherwise add one with the caller-supplied memo
     * (or {@code "Completed"} fallback) as the summary. Uses CLIENTNOTE logtype — matches the
     * existing worklog conventions in {@link #reportActuals}.
     */
    public void ensureWorklogPresent(String href, String memo) {
        if (href == null || href.isBlank()) return;
        // Cheap presence probe — one field, one row is enough to know if a worklog exists.
        boolean hasWorklog = false;
        try {
            Map<String, Object> body = access.getMap(
                    access.osUrl(OS) + "/" + href + "/woworklog",
                    Map.of("oslc.select", "spi:worklogid", "oslc.pageSize", "1"));
            hasWorklog = !members(body).isEmpty();
        } catch (RuntimeException e) {
            log.debug("[Maximo] worklog presence probe failed for {}: {} — will add one anyway", href, e.getMessage());
        }
        if (hasWorklog) return;
        String summary = (memo != null && !memo.isBlank()) ? memo.trim() : "Completed";
        reportActuals(href, null, summary, null, "CLIENTNOTE");
    }

    /**
     * The full "complete work order" flow: record actuals (labor + worklog), then optionally
     * change status (default COMP). Returns the refreshed WO. Labor codes must already be
     * resolved. The COMP path in {@link #changeStatus} takes care of the mandatory
     * {@link #INV_USAGE_FIELD} + worklog fields — no need to duplicate that here.
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
        d.setWorkorderid(MaximoOslcMapper.longVal(row, "workorderid"));   // numeric PK — the WO-conversation anchor
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
        d.setReportedby(str(row, "reportedby"));
        d.setPriority(str(row, "wopriority"));
        d.setPmnum(str(row, "pmnum"));
        d.setStatusDate(str(row, "statusdate"));
        d.setTaskid(str(row, "taskid"));
        d.setParent(str(row, "parent"));
        d.setIstask(MaximoOslcMapper.boolVal(row, "istask"));
        d.setOutageType(str(row, outageTypeAttr));   // null unless the outage query selected it
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
