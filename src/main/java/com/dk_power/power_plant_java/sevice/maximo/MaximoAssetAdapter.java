package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
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

    private final MaximoAccessService access;

    /** Search assets by query (assetnum + description word-bucket) within the configured default site. */
    public List<MaximoAssetDto> searchByTag(String query, int pageSize) {
        return search(query, access.defaultSite(), pageSize);
    }

    /**
     * Search assets with an AND word-bucket over assetnum + description: every typed word must appear,
     * matched against the asset tag OR the description. Blank query returns the first page.
     *
     * Mirrors {@link MaximoLocationAdapter#search}: per field the words are AND-chained in one valid
     * OSLC query; the two fields are unioned in Java (Maximo OSLC rejects parentheses and OR, so
     * cross-field OR = merging two queries). So "acc breather" finds an asset whose tag+description
     * together contain both words, which a single broad %acc% LIKE on assetnum alone would miss.
     */
    public List<MaximoAssetDto> search(String query, String siteid, int pageSize) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();
        String siteCond = "spi:siteid=\"" + escape(site) + "\"";
        int cap = Math.max(1, pageSize);

        List<String> words = MaximoOslcMapper.words(query);
        Map<String, MaximoAssetDto> merged = new LinkedHashMap<>();
        if (words.isEmpty()) {
            runInto(merged, siteCond, cap);
        } else {
            runInto(merged, siteCond + MaximoOslcMapper.andLike("assetnum", words), cap);
            runInto(merged, siteCond + MaximoOslcMapper.andLike("description", words), cap);
        }
        // Sort in Java (Maximo oslc.orderBy "+" is mangled to a space by Spring); result sets are small.
        return merged.values().stream()
                .sorted(Comparator.comparing(MaximoAssetDto::getAssetnum,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(cap).collect(Collectors.toList());
    }

    private void runInto(Map<String, MaximoAssetDto> merged, String where, int cap) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(cap));
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
