package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.longVal;
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

    /**
     * Search the item master by item number or description, then enrich each hit with its current
     * balance at the storeroom. Blank query returns the first page of items.
     *
     * Maximo OSLC rejects parentheses and has unreliable and/or precedence, so the itemnum-OR-
     * description search runs as two single-field queries merged (deduped by itemnum).
     */
    public List<MaximoInventoryItemDto> search(String query, String siteid, String storeroom, int pageSize) {
        String store = (storeroom != null && !storeroom.isBlank()) ? storeroom : DEFAULT_STOREROOM;
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        int cap = Math.max(1, pageSize);

        // AND word-bucket over itemnum + description: every word must appear in one field or the other.
        // Per field words are AND-chained in one query; the two fields are unioned (OSLC has no OR).
        List<String> words = MaximoOslcMapper.words(query);
        Map<String, MaximoInventoryItemDto> merged = new LinkedHashMap<>();
        if (words.isEmpty()) {
            runInto(merged, "spi:status=\"ACTIVE\"", store, cap);
        } else {
            runInto(merged, "spi:status=\"ACTIVE\"" + MaximoOslcMapper.andLike("itemnum", words), store, cap);
            runInto(merged, "spi:status=\"ACTIVE\"" + MaximoOslcMapper.andLike("description", words), store, cap);
        }
        // Sort in Java: Maximo's oslc.orderBy needs a +/- sign, but Spring sends "+" as a space
        // (URL decode), which Maximo rejects. Result sets are small, so sort client-side.
        List<MaximoInventoryItemDto> items = merged.values().stream()
                .sorted(Comparator.comparing(MaximoInventoryItemDto::getItemnum,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(cap).collect(Collectors.toList());
        if (!items.isEmpty()) enrichBalances(items, site, store);
        return items;
    }

    private void runInto(Map<String, MaximoInventoryItemDto> merged, String where, String store, int cap) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", "spi:itemnum,spi:description,spi:issueunit,spi:status");
        params.put("oslc.pageSize", Integer.toString(cap));
        params.put("oslc.where", where);
        Map<String, Object> body = access.getMap(access.osUrl("mxapiitem"), params);
        for (Map<String, Object> row : members(body)) {
            String itemnum = str(row, "itemnum");
            if (itemnum == null || merged.containsKey(itemnum)) continue;
            MaximoInventoryItemDto d = new MaximoInventoryItemDto();
            d.setItemnum(itemnum);
            d.setDescription(str(row, "description"));
            d.setIssueunit(str(row, "issueunit"));
            d.setStoreroom(store);
            merged.put(itemnum, d);
        }
    }

    /** One batched inventory call: balances for all itemnums at the storeroom. */
    private void enrichBalances(List<MaximoInventoryItemDto> items, String site, String store) {
        String inList = items.stream()
                .map(MaximoInventoryItemDto::getItemnum)
                .filter(n -> n != null && !n.isBlank())
                .map(n -> "\"" + escape(n) + "\"")
                .distinct()
                .collect(Collectors.joining(","));
        if (inList.isEmpty()) return;

        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", "spi:itemnum,spi:curbal");
        params.put("oslc.pageSize", Integer.toString(items.size() + 5));
        params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\" and spi:location=\""
                + escape(store) + "\" and spi:itemnum in [" + inList + "]");
        Map<String, Object> body = access.getMap(access.osUrl("mxapiinventory"), params);

        Map<String, Double> balByItem = new LinkedHashMap<>();
        for (Map<String, Object> row : members(body)) {
            String itemnum = str(row, "itemnum");
            Long bal = longVal(row, "curbal"); // curbal can be fractional; longVal tolerates and truncates
            String raw = str(row, "curbal");
            Double curbal = raw == null ? null : safeDouble(raw, bal);
            if (itemnum != null) balByItem.put(itemnum, curbal);
        }
        for (MaximoInventoryItemDto d : items) d.setCurbal(balByItem.get(d.getItemnum()));
    }

    private static Double safeDouble(String raw, Long fallback) {
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return fallback == null ? null : fallback.doubleValue();
        }
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
