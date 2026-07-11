package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryStockDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryUsageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

/**
 * Raw Maximo access for items / inventory. Descriptions come from the item master (mxapiitem —
 * mxapiinventory's item join returns null on this instance); stock lines come from mxapiinventory.
 *
 * <p>This adapter is stateless: it fetches. The searchable catalog it feeds — cached, snapshotted to
 * disk, and refreshed in the background — lives in {@link MaximoInventoryCatalogService}.
 *
 * <p>See memory reference_maximo_write_api and project/features/maximo/inventory-checkout-api.md.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoInventoryAdapter {

    public static final String DEFAULT_STOREROOM = "WAREHOUSE1";

    /**
     * Every field a catalog stock line needs. {@code statusdate} is the ONLY timestamp mxapiinventory
     * exposes (INVENTORY has no {@code changedate}) — it stamps row creation and status transitions,
     * which is what makes it usable as an incremental-refresh watermark.
     */
    private static final String STOCK_SELECT =
            "spi:itemnum,spi:location,spi:binnum,spi:curbal,spi:issueunit,spi:status,spi:statusdate";

    /** Maximo compares {@code spi:statusdate} against a naive local timestamp; the offset is not accepted. */
    private static final DateTimeFormatter MAXIMO_TS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private static final int STOCK_PAGE = 500;
    private static final int DESC_CHUNK = 250;   // itemnums are short — the "in [...]" URL stays well under limits

    private final MaximoAccessService access;

    public String defaultSite() {
        return access.defaultSite();
    }

    /**
     * Stock lines, Maximo's own newest {@code statusdate} across them (the next refresh watermark), and the
     * raw member count before de-duplication by itemnum|location — the drift probe must compare like with like.
     */
    public record StockFetch(List<MaximoInventoryItemDto> rows, OffsetDateTime maxStatusdate, int rawCount) {}

    /** Cache key for a stock line: an item is stocked once per warehouse. */
    public static String key(String itemnum, String storeroom) {
        return itemnum + "|" + (storeroom == null ? "" : storeroom);
    }

    /**
     * How many stock lines exist at the site. {@code count=1} makes Maximo answer with a bare
     * {@code totalCount} and zero rows (~0.1s) — the drift probe that detects deletions.
     */
    public int countStockLines(String site) {
        return count(stockWhere(site, null));
    }

    /** How many stock lines changed since the watermark (~0.1s) — the change probe. */
    public int countChangedSince(String site, OffsetDateTime since) {
        return count(stockWhere(site, since));
    }

    private int count(String where) {
        Map<String, String> p = new LinkedHashMap<>();
        p.put("oslc.where", where);
        p.put("count", "1");
        p.put("oslc.pageSize", "1");   // without this the count still scans a full page
        Map<String, Object> body = access.getMap(access.osUrl("mxapiinventory"), p);
        Object total = body == null ? null : body.get("totalCount");
        return total instanceof Number n ? n.intValue() : -1;
    }

    private static String stockWhere(String site, OffsetDateTime since) {
        String w = "spi:siteid=\"" + escape(site) + "\"";
        if (since != null) w += " and spi:statusdate>\"" + since.format(MAXIMO_TS) + "\"";
        return w;
    }

    /**
     * Stock lines (item × warehouse) at a site, without descriptions. A non-null {@code since} restricts the
     * fetch to rows whose statusdate is newer — new stock lines and status flips, i.e. the incremental path.
     *
     * <p>The page cap is derived from the live {@code totalCount} rather than a fixed constant, so this can
     * never silently truncate the way a hardcoded {@code maxPages} does; a shortfall is logged as an error.
     */
    public StockFetch fetchStockLines(String site, OffsetDateTime since) {
        String where = stockWhere(site, since);
        int expected = count(where);
        int maxPages = expected < 0 ? 100 : (expected / STOCK_PAGE) + 2;

        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", STOCK_SELECT);
        params.put("oslc.where", where);
        params.put("oslc.orderBy", "-spi:itemnum");   // stable paging order ('-' survives transport, '+' does not)
        List<Map<String, Object>> rows =
                access.getAllMembers(access.osUrl("mxapiinventory"), params, STOCK_PAGE, maxPages);
        if (expected >= 0 && rows.size() < expected) {
            log.error("[Maximo] inventory fetch returned {} of {} stock lines — TRUNCATED, catalog will be incomplete",
                    rows.size(), expected);
        }

        Map<String, MaximoInventoryItemDto> byKey = new LinkedHashMap<>();
        OffsetDateTime max = null;
        for (Map<String, Object> r : rows) {
            String itemnum = str(r, "itemnum");
            if (itemnum == null) continue;
            String loc = str(r, "location");
            byKey.putIfAbsent(key(itemnum, loc), stockLine(r, itemnum, loc));
            OffsetDateTime sd = parseTs(str(r, "statusdate"));
            if (sd != null && (max == null || sd.isAfter(max))) max = sd;
        }
        return new StockFetch(new ArrayList<>(byKey.values()), max, rows.size());
    }

    private static MaximoInventoryItemDto stockLine(Map<String, Object> r, String itemnum, String loc) {
        MaximoInventoryItemDto d = new MaximoInventoryItemDto();
        d.setItemnum(itemnum);
        d.setStoreroom(loc);
        d.setBinnum(str(r, "binnum"));
        d.setIssueunit(str(r, "issueunit"));
        d.setStatus(str(r, "status"));
        d.setCurbal(dbl(r, "curbal"));   // absent = genuinely null (not zero); Maximo emits 0.0 explicitly
        return d;
    }

    /**
     * Descriptions from the item master via {@code itemnum in [...]} chunks — indexed, so fast. A leading-wildcard
     * {@code description LIKE "%x%"} over the org-wide item master is a 40s+ full scan and times out; never do that.
     */
    public Map<String, String> fetchDescriptions(Collection<String> itemnums) {
        List<String> list = itemnums.stream()
                .filter(n -> n != null && !n.isBlank()).distinct().collect(Collectors.toList());
        Map<String, String> out = new HashMap<>(Math.max(16, list.size() * 2));
        for (int i = 0; i < list.size(); i += DESC_CHUNK) {
            List<String> slice = list.subList(i, Math.min(i + DESC_CHUNK, list.size()));
            String inList = slice.stream().map(n -> "\"" + escape(n) + "\"").collect(Collectors.joining(","));
            Map<String, String> params = new LinkedHashMap<>();
            params.put("oslc.select", "spi:itemnum,spi:description");
            params.put("oslc.pageSize", Integer.toString(slice.size() + 5));
            params.put("oslc.where", "spi:itemnum in [" + inList + "]");
            for (Map<String, Object> r : members(access.getMap(access.osUrl("mxapiitem"), params))) {
                String itemnum = str(r, "itemnum");
                if (itemnum != null) out.put(itemnum, str(r, "description"));
            }
        }
        return out;
    }

    /**
     * Live exact-itemnum lookup, bypassing the cached catalog, so an item stocked in Maximo minutes ago is
     * findable before the next refresh picks it up. {@code itemnum} leads the INVENTORY primary key → indexed
     * (~0.2s). Never throws: a failure here must not break a search that already has cached hits to fall back on.
     */
    public List<MaximoInventoryItemDto> findLiveByItemnum(String itemnum, String siteid) {
        if (itemnum == null || itemnum.isBlank()) return List.of();
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        try {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("oslc.select", STOCK_SELECT);
            params.put("oslc.pageSize", "20");
            params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\" and spi:itemnum=\""
                    + escape(itemnum.trim()) + "\"");
            List<MaximoInventoryItemDto> out = new ArrayList<>();
            for (Map<String, Object> r : members(access.getMap(access.osUrl("mxapiinventory"), params))) {
                String num = str(r, "itemnum");
                if (num != null) out.add(stockLine(r, num, str(r, "location")));
            }
            if (!out.isEmpty()) {
                Map<String, String> desc = fetchDescriptions(List.of(out.get(0).getItemnum()));
                out.forEach(d -> d.setDescription(desc.get(d.getItemnum())));
            }
            return out;
        } catch (RuntimeException e) {
            log.debug("[Maximo] live itemnum lookup '{}' failed: {}", itemnum, e.toString());
            return List.of();
        }
    }

    private static OffsetDateTime parseTs(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return OffsetDateTime.parse(raw);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static Double safeDouble(String raw, Long fallback) {
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return fallback == null ? null : fallback.doubleValue();
        }
    }

    /** Full stock detail for one item at a storeroom (on-hand, reserved, reorder levels, cost, usage stats). */
    public Optional<MaximoInventoryStockDto> getStock(String itemnum, String siteid, String storeroom) {
        if (itemnum == null || itemnum.isBlank()) return Optional.empty();
        String store = (storeroom != null && !storeroom.isBlank()) ? storeroom : DEFAULT_STOREROOM;
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", "spi:itemnum,spi:binnum,spi:issueunit,spi:status,spi:curbal,spi:reservedqty,"
                + "spi:minlevel,spi:maxlevel,spi:reorder,spi:orderqty,spi:invcost,"
                + "spi:issueytd,spi:issue1yrago,spi:issue2yrago,spi:issue3yrago");
        params.put("oslc.pageSize", "1");
        params.put("oslc.where", "spi:itemnum=\"" + escape(itemnum) + "\" and spi:siteid=\"" + escape(site)
                + "\" and spi:location=\"" + escape(store) + "\"");
        List<Map<String, Object>> rows = members(access.getMap(access.osUrl("mxapiinventory"), params));
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> r = rows.get(0);
        MaximoInventoryStockDto d = new MaximoInventoryStockDto();
        d.setHref(hrefId(r));
        d.setItemnum(str(r, "itemnum"));
        d.setStoreroom(store);
        d.setBinnum(str(r, "binnum"));
        d.setIssueunit(str(r, "issueunit"));
        d.setStatus(str(r, "status"));
        d.setCurbal(dbl(r, "curbal"));
        d.setReservedqty(dbl(r, "reservedqty"));
        d.setMinlevel(dbl(r, "minlevel"));
        d.setMaxlevel(dbl(r, "maxlevel"));
        d.setReorder(dbl(r, "reorder"));
        d.setOrderqty(dbl(r, "orderqty"));
        d.setInvcost(dbl(r, "invcost"));
        d.setIssueytd(dbl(r, "issueytd"));
        d.setIssue1yrago(dbl(r, "issue1yrago"));
        d.setIssue2yrago(dbl(r, "issue2yrago"));
        d.setIssue3yrago(dbl(r, "issue3yrago"));
        return Optional.of(d);
    }

    /** Material-use transactions (which WOs consumed this item), newest first, via the matusetrans child. */
    public List<MaximoInventoryUsageDto> getUsage(String itemnum, String siteid, String storeroom, int pageSize) {
        Optional<MaximoInventoryStockDto> stock = getStock(itemnum, siteid, storeroom);
        if (stock.isEmpty() || stock.get().getHref() == null) return List.of();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", "spi:refwo,spi:wonum,spi:quantity,spi:transdate,spi:issuetype,spi:linecost");
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        Map<String, Object> body = access.getMap(
                access.osUrl("mxapiinventory") + "/" + stock.get().getHref() + "/matusetrans", params);
        List<MaximoInventoryUsageDto> out = new ArrayList<>();
        for (Map<String, Object> r : members(body)) {
            MaximoInventoryUsageDto u = new MaximoInventoryUsageDto();
            String wo = str(r, "wonum");
            u.setWonum(wo != null ? wo : str(r, "refwo"));
            u.setQuantity(dbl(r, "quantity"));
            u.setTransdate(str(r, "transdate"));
            u.setIssuetype(str(r, "issuetype"));
            u.setLinecost(dbl(r, "linecost"));
            out.add(u);
        }
        out.sort(Comparator.comparing((MaximoInventoryUsageDto u) -> u.getTransdate() == null ? "" : u.getTransdate()).reversed());
        return out;
    }

    private static Double dbl(Map<String, Object> row, String key) {
        String raw = str(row, key);
        return raw == null ? null : safeDouble(raw, null);
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
