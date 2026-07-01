package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
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

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.boolVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.longVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoAssetAdapter {

    private static final String OS = "mxasset";
    private static final String SELECT_FIELDS =
            "spi:assetnum,spi:description,spi:siteid,spi:location,"
            + "spi:status,spi:assettype,spi:assetid,spi:parent,spi:disabled";

    /** Internal per-field page — larger than the display cap so one OSLC page doesn't silently truncate. */
    private static final int FETCH_PER_FIELD = 100;
    /** Max matching locations to expand into an `in [...]` asset query (bounds the clause length). */
    private static final int LOC_LIMIT = 25;

    private final MaximoAccessService access;
    private final MaximoLocationAdapter locations;

    /** Search assets by query (assetnum + description + location word-bucket) within the default site. */
    public List<MaximoAssetDto> searchByTag(String query, int pageSize) {
        return search(query, access.defaultSite(), null, null, pageSize);
    }

    /**
     * Search assets with an AND word-bucket, matching across THREE things and unioning the hits:
     *   (1) the asset tag (assetnum), (2) the asset description, and (3) the asset's LOCATION — resolved
     * by finding operating-locations whose code OR description matches the words, then pulling assets in
     * them via {@code spi:location in [...]}. (3) is what makes a system/area term work even when it lives
     * only on the location: e.g. "osmosis" is the description of location 00-DMW-RO whose assets are tagged
     * 00-DWT-*, and "dmw" is a location-code prefix — neither appears on the asset tag/description, so tag-only
     * search missed them. Maximo OSLC rejects parentheses/OR, so each field is one AND-query and we union in Java.
     *
     * {@code status} and {@code location} are optional EXACT filters AND-ed into every sub-query.
     */
    public List<MaximoAssetDto> search(String query, String siteid, String status, String location, int pageSize) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        StringBuilder base = new StringBuilder("spi:siteid=\"").append(escape(site)).append("\"");
        if (status != null && !status.isBlank()) base.append(" and spi:status=\"").append(escape(status)).append("\"");
        if (location != null && !location.isBlank()) base.append(" and spi:location=\"").append(escape(location)).append("\"");
        String siteCond = base.toString();
        int cap = Math.max(1, pageSize);                       // how many to return to the dropdown
        int fetch = Math.max(cap, FETCH_PER_FIELD);            // internal per-field page

        List<String> words = MaximoOslcMapper.words(query);
        Map<String, MaximoAssetDto> merged = new LinkedHashMap<>();
        if (words.isEmpty()) {
            runInto(merged, siteCond, fetch);
        } else {
            runInto(merged, siteCond + MaximoOslcMapper.andLike("assetnum", words), fetch);
            runInto(merged, siteCond + MaximoOslcMapper.andLike("description", words), fetch);
            // (3) assets located in any location whose code/description matches the query
            String inClause = (location != null && !location.isBlank()) ? null : locationInClause(query, site);
            if (inClause != null) runInto(merged, siteCond + inClause, fetch);
        }
        // Sort in Java (Maximo oslc.orderBy "+" is mangled to a space by Spring).
        return merged.values().stream()
                .sorted(Comparator.comparing(MaximoAssetDto::getAssetnum,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(cap).collect(Collectors.toList());
    }

    /** Build ` and spi:location in ["A","B",…]` from locations matching the query, or null if none. */
    private String locationInClause(String query, String site) {
        List<String> codes = locations.search(query, site, LOC_LIMIT).stream()
                .map(MaximoLocationDto::getLocation)
                .filter(c -> c != null && !c.isBlank())
                .distinct().limit(LOC_LIMIT).collect(Collectors.toList());
        if (codes.isEmpty()) return null;
        return codes.stream().map(c -> "\"" + escape(c) + "\"")
                .collect(Collectors.joining(",", " and spi:location in [", "]"));
    }

    private void runInto(Map<String, MaximoAssetDto> merged, String where, int fetch) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(fetch));
        params.put("oslc.where", where);
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        for (Map<String, Object> row : members(body)) {
            MaximoAssetDto d = map(row);
            if (d.getAssetnum() != null) merged.putIfAbsent(d.getAssetnum(), d);
        }
    }

    /** Fetch one asset by exact assetnum (returns first match). */
    public Optional<MaximoAssetDto> findByAssetnum(String assetnum) {
        if (assetnum == null || assetnum.isBlank()) return Optional.empty();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", "1");
        params.put("oslc.where",
                "spi:assetnum=\"" + escape(assetnum) + "\""
                + " and spi:siteid=\"" + escape(access.defaultSite()) + "\"");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body)).stream().findFirst();
    }

    /** Fetch one asset by OSLC href id (the base64-ish "_..." key). */
    public Optional<MaximoAssetDto> findByHref(String href) {
        if (href == null || href.isBlank()) return Optional.empty();
        Map<String, String> params = Map.of("oslc.select", SELECT_FIELDS);
        Map<String, Object> body = access.getMap(access.osUrl(OS) + "/" + href, params);
        if (body == null) return Optional.empty();
        return Optional.of(map(body));
    }

    private List<MaximoAssetDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoAssetDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoAssetDto map(Map<String, Object> row) {
        MaximoAssetDto d = new MaximoAssetDto();
        d.setHref(hrefId(row));
        d.setAssetnum(str(row, "assetnum"));
        d.setDescription(str(row, "description"));
        d.setSiteid(str(row, "siteid"));
        d.setLocation(str(row, "location"));
        d.setStatus(str(row, "status"));
        d.setAssettype(str(row, "assettype"));
        d.setAssetid(longVal(row, "assetid"));
        d.setParent(str(row, "parent"));
        d.setDisabled(boolVal(row, "disabled"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
