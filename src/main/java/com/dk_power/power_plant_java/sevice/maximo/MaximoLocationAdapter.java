package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

/** Operating-location lookup (mxapioperloc) for the location picker. */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoLocationAdapter {

    private static final String OS = "mxapioperloc";
    private static final String SELECT = "spi:location,spi:description,spi:type,spi:status,spi:siteid";
    /** Adds spi:parent for the seeder's tree reconstruction. */
    private static final String SELECT_ALL = "spi:location,spi:description,spi:parent,spi:type,spi:status,spi:siteid";

    private final MaximoAccessService access;

    /**
     * Page the ENTIRE operating-location hierarchy for a site (for {@code PhysicalObjectMaximoSeeder}).
     * Unlike {@link #search}, this includes {@code spi:parent} so the tree can be reconstructed, and pages
     * every result (not one display page). Stable {@code -spi:location} orderBy so pages don't shuffle.
     */
    public List<MaximoLocationDto> getAllLocations(String siteid) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_ALL);
        params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\"");
        params.put("oslc.orderBy", "-spi:location");
        List<Map<String, Object>> rows = access.getAllMembers(access.osUrl(OS), params, 500, 40);
        List<MaximoLocationDto> out = new java.util.ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            MaximoLocationDto d = map(row);
            if (d.getLocation() != null) out.add(d);
        }
        return out;
    }

    /**
     * Search locations with an AND word-bucket over code + description: every typed word must appear,
     * matched against the location code OR the description. Blank query returns the first page.
     *
     * Per field the words are AND-chained in one query (valid OSLC); the two fields are unioned —
     * Maximo OSLC rejects parentheses and OR, so cross-field OR is done by merging two queries.
     * So "02 acc" finds 02-ACC (code contains both words) that a single broad %acc% would miss.
     */
    public List<MaximoLocationDto> search(String query, String siteid, int pageSize) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        String siteCond = "spi:siteid=\"" + escape(site) + "\"";
        int cap = Math.max(1, pageSize);

        List<String> words = MaximoOslcMapper.words(query);
        Map<String, MaximoLocationDto> merged = new LinkedHashMap<>();
        if (words.isEmpty()) {
            runInto(merged, siteCond, cap);
        } else {
            runInto(merged, siteCond + MaximoOslcMapper.andLike("location", words), cap);
            runInto(merged, siteCond + MaximoOslcMapper.andLike("description", words), cap);
        }
        // Sort in Java: Maximo's oslc.orderBy needs a +/- sign, but Spring sends "+" as a space
        // (URL decode), which Maximo then rejects. Result sets are small, so sort client-side.
        return merged.values().stream()
                .sorted(Comparator.comparing(MaximoLocationDto::getLocation,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(cap).collect(Collectors.toList());
    }

    /**
     * The operating-location chain for {@code location}, leaf first: itself, its parent, its grandparent, up to
     * the top. The site-level rung (code == siteid) is dropped — {@code siteid} already carries that, and "the
     * whole plant" is not a useful thing to file against.
     *
     * <p>This is the ONLY hierarchy this Maximo has. Assets expose {@code spi:parent}, but it is null on every
     * one of them; each asset does carry a {@code location}. So "the parent of this asset" only has an answer
     * through its location: {@code 01-FE-BFW407A} (ORIFICE PLATE) sits in {@code 01-FDW-INST} (INSTRUMENTATION),
     * whose parent is {@code 01-FDW} (UNIT 01 FEEDWATER). An SR filed against a location with no assetnum is
     * valid, and is the right answer when the broken thing isn't itself an asset.
     *
     * <p>Two calls: {@code spi:locancestor} gives the ancestor codes (unordered), then one
     * {@code location in [...]} batch fetches their descriptions and parents so the chain can be ordered by
     * following {@code parent}. Empty list when the location is unknown.
     */
    public List<MaximoLocationDto> ancestors(String location, String siteid) {
        if (location == null || location.isBlank()) return List.of();
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        String leaf = location.trim();

        List<String> codes = ancestorCodes(leaf, site);
        if (codes.isEmpty()) return List.of();

        Map<String, MaximoLocationDto> byCode = new LinkedHashMap<>();
        String inList = codes.stream().map(c -> "\"" + escape(c) + "\"").collect(Collectors.joining(","));
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_ALL);
        params.put("oslc.pageSize", Integer.toString(codes.size() + 5));
        params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\" and spi:location in [" + inList + "]");
        for (Map<String, Object> row : members(access.getMap(access.osUrl(OS), params))) {
            MaximoLocationDto d = map(row);
            if (d.getLocation() != null) byCode.put(d.getLocation(), d);
        }

        // Walk parent links from the leaf upward. `seen` guards against a cycle in bad hierarchy data.
        List<MaximoLocationDto> chain = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String cursor = leaf;
        while (cursor != null && seen.add(cursor)) {
            MaximoLocationDto d = byCode.get(cursor);
            if (d == null) break;
            if (!cursor.equalsIgnoreCase(site)) chain.add(d);
            cursor = d.getParent();
        }
        return chain;
    }

    /** Ancestor codes from the {@code locancestor} child collection, plus the location itself. */
    @SuppressWarnings("unchecked")
    private List<String> ancestorCodes(String leaf, String site) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", "spi:location,spi:locancestor");
        params.put("oslc.pageSize", "1");
        params.put("oslc.where", "spi:siteid=\"" + escape(site) + "\" and spi:location=\"" + escape(leaf) + "\"");
        List<Map<String, Object>> rows = members(access.getMap(access.osUrl(OS), params));
        if (rows.isEmpty()) return List.of();
        List<String> codes = new ArrayList<>();
        codes.add(leaf);
        if (rows.get(0).get("spi:locancestor") instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    Object ancestor = ((Map<String, Object>) m).get("spi:ancestor");
                    if (ancestor != null && !codes.contains(ancestor.toString())) codes.add(ancestor.toString());
                }
            }
        }
        return codes;
    }

    private void runInto(Map<String, MaximoLocationDto> merged, String where, int cap) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT);
        params.put("oslc.pageSize", Integer.toString(cap));
        params.put("oslc.where", where);
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        for (Map<String, Object> row : members(body)) {
            MaximoLocationDto d = map(row);
            if (d.getLocation() != null) merged.putIfAbsent(d.getLocation(), d);
        }
    }

    private MaximoLocationDto map(Map<String, Object> row) {
        MaximoLocationDto d = new MaximoLocationDto();
        d.setHref(hrefId(row));
        d.setLocation(str(row, "location"));
        d.setDescription(str(row, "description"));
        d.setType(str(row, "type"));
        d.setStatus(str(row, "status"));
        d.setSiteid(str(row, "siteid"));
        d.setParent(str(row, "parent"));   // null unless SELECT_ALL was used (getAllLocations)
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
