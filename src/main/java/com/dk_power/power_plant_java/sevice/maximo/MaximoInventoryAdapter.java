package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryStockDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryUsageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

/**
 * Item / inventory lookup for the parts picker. Descriptions come from the item master
 * (mxapiitem — mxapiinventory's item join returns null on this instance); current balance comes
 * from mxapiinventory at the storeroom. See memory reference_maximo_write_api.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoInventoryAdapter {

    public static final String DEFAULT_STOREROOM = "WAREHOUSE1";

    private final MaximoAccessService access;

    // Stocked-item catalog cache (per site+storeroom). Item search filters this in memory.
    private static final long CATALOG_TTL_MS = 10 * 60 * 1000L;
    private static final int CATALOG_PAGE = 200;
    private static final int CATALOG_MAX_PAGES = 40;   // 200*40 = 8000 stocked-item ceiling
    private volatile List<MaximoInventoryItemDto> catalogCache;
    private volatile String catalogKey;
    private volatile long catalogLoadedAt;

    /**
     * Search STOCKED items (word-bucket over itemnum + description), each with on-hand balance. The universe
     * is only what's stocked at the storeroom (small), cached in memory and filtered in Java. This AVOIDS a
     * leading-wildcard {@code description LIKE "%x%"} on the org-wide item master (mxapiitem) — that is a
     * full-table scan that takes 40s+ and times out (the "connect timed out" the inventory search hit).
     * Blank query returns the first {@code pageSize} items.
     */
    public List<MaximoInventoryItemDto> search(String query, String siteid, String storeroom, int pageSize) {
        String store = (storeroom != null && !storeroom.isBlank()) ? storeroom : DEFAULT_STOREROOM;
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        int cap = Math.max(1, pageSize);
        List<String> words = MaximoOslcMapper.words(query);
        return stockedCatalog(site, store).stream()
                .filter(d -> matchesWords(d, words))
                .sorted(Comparator.comparing(MaximoInventoryItemDto::getItemnum,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(cap).collect(Collectors.toList());
    }

    private static boolean matchesWords(MaximoInventoryItemDto d, List<String> words) {
        if (words.isEmpty()) return true;
        String hay = ((d.getItemnum() == null ? "" : d.getItemnum()) + " "
                + (d.getDescription() == null ? "" : d.getDescription())).toLowerCase();
        for (String w : words) if (!hay.contains(w.toLowerCase())) return false;
        return true;
    }

    /**
     * All items stocked at the storeroom (itemnum + on-hand from mxapiinventory, description batched from the
     * item master by itemnum — indexed, fast). Cached per site+storeroom for {@link #CATALOG_TTL_MS}; the
     * cost is paid once, not per keystroke. Falls back to a stale cache if a rebuild fails.
     */
    private synchronized List<MaximoInventoryItemDto> stockedCatalog(String site, String store) {
        String key = site + "|" + store;
        List<MaximoInventoryItemDto> cached = catalogCache;
        if (cached != null && key.equals(catalogKey)
                && (System.currentTimeMillis() - catalogLoadedAt) < CATALOG_TTL_MS) {
            return cached;
        }
        try {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("oslc.select", "spi:itemnum,spi:curbal,spi:issueunit,spi:status");
            params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\" and spi:location=\"" + escape(store) + "\"");
            params.put("oslc.orderBy", "-spi:itemnum"); // stable order across pages (leading '-' survives transport)
            List<Map<String, Object>> rows =
                    access.getAllMembers(access.osUrl("mxapiinventory"), params, CATALOG_PAGE, CATALOG_MAX_PAGES);
            Map<String, MaximoInventoryItemDto> byItem = new LinkedHashMap<>();
            for (Map<String, Object> r : rows) {
                String itemnum = str(r, "itemnum");
                if (itemnum == null || byItem.containsKey(itemnum)) continue;
                MaximoInventoryItemDto d = new MaximoInventoryItemDto();
                d.setItemnum(itemnum);
                d.setIssueunit(str(r, "issueunit"));
                d.setStoreroom(store);
                String raw = str(r, "curbal");
                d.setCurbal(raw == null ? null : safeDouble(raw, null));
                byItem.put(itemnum, d);
            }
            enrichDescriptions(byItem);
            List<MaximoInventoryItemDto> catalog = new ArrayList<>(byItem.values());
            catalogCache = catalog; catalogKey = key; catalogLoadedAt = System.currentTimeMillis();
            return catalog;
        } catch (RuntimeException e) {
            if (cached != null) {
                log.warn("[Maximo] inventory catalog rebuild failed, serving stale cache: {}", e.getMessage());
                return cached;
            }
            throw e;
        }
    }

    /** Fill descriptions from the item master via {@code itemnum in [...]} chunks (indexed → fast, no wildcard scan). */
    private void enrichDescriptions(Map<String, MaximoInventoryItemDto> byItem) {
        List<String> itemnums = new ArrayList<>(byItem.keySet());
        int chunk = 100;
        for (int i = 0; i < itemnums.size(); i += chunk) {
            List<String> slice = itemnums.subList(i, Math.min(i + chunk, itemnums.size()));
            String inList = slice.stream().map(n -> "\"" + escape(n) + "\"").collect(Collectors.joining(","));
            Map<String, String> params = new LinkedHashMap<>();
            params.put("oslc.select", "spi:itemnum,spi:description");
            params.put("oslc.pageSize", Integer.toString(slice.size() + 5));
            params.put("oslc.where", "spi:itemnum in [" + inList + "]");
            for (Map<String, Object> r : members(access.getMap(access.osUrl("mxapiitem"), params))) {
                String itemnum = str(r, "itemnum");
                MaximoInventoryItemDto d = itemnum == null ? null : byItem.get(itemnum);
                if (d != null) d.setDescription(str(r, "description"));
            }
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
        params.put("oslc.select", "spi:itemnum,spi:issueunit,spi:status,spi:curbal,spi:reservedqty,"
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
