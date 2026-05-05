package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    /** Search assets by tag (assetnum) wildcard within the configured default site. */
    public List<MaximoAssetDto> searchByTag(String assetnumPattern, int pageSize) {
        return search(assetnumPattern, access.defaultSite(), pageSize);
    }

    public List<MaximoAssetDto> search(String assetnumPattern, String siteid, int pageSize) {
        StringBuilder where = new StringBuilder();
        if (assetnumPattern != null && !assetnumPattern.isBlank()) {
            where.append("spi:assetnum=\"%").append(escape(assetnumPattern)).append("%\"");
        }
        if (siteid != null && !siteid.isBlank()) {
            if (!where.isEmpty()) where.append(" and ");
            where.append("spi:siteid=\"").append(escape(siteid)).append("\"");
        }
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        if (!where.isEmpty()) params.put("oslc.where", where.toString());

        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
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
