package com.dk_power.power_plant_java.sevice.maximo;

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
            "spi:wonum,spi:description,spi:status,spi:worktype,spi:assetnum,"
            + "spi:location,spi:siteid,spi:reportdate,spi:schedstart,spi:schedfinish,"
            + "spi:lead,spi:supervisor,spi:wopriority";

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
        if (c == null) return List.of();
        List<String> conds = new ArrayList<>();
        addStr(conds, "status", c.getStatus());
        addStr(conds, "worktype", c.getWorktype());
        addStr(conds, "assetnum", c.getAssetnum());
        addStr(conds, "location", c.getLocation());
        addNum(conds, "wopriority", c.getPriority());
        addStr(conds, "lead", c.getLeadCraft());
        addStrOp(conds, "schedstart", ">=", c.getSchedstartFrom());
        addStrOp(conds, "schedfinish", "<=", c.getSchedfinishTo());
        addLike(conds, "description", c.getDescriptionContains());
        if (conds.isEmpty()) return List.of();

        String siteid = (c.getSiteid() != null && !c.getSiteid().isBlank())
                ? c.getSiteid() : access.defaultSite();
        addStr(conds, "siteid", siteid);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where", String.join(" and ", conds));
        params.put("oslc.orderBy", "-spi:reportdate");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
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
        d.setStatus(str(row, "status"));
        d.setWorktype(str(row, "worktype"));
        d.setAssetnum(str(row, "assetnum"));
        d.setLocation(str(row, "location"));
        d.setSiteid(str(row, "siteid"));
        d.setReportdate(str(row, "reportdate"));
        d.setSchedstart(str(row, "schedstart"));
        d.setSchedfinish(str(row, "schedfinish"));
        d.setLeadCraft(str(row, "lead"));
        d.setSupervisor(str(row, "supervisor"));
        d.setPriority(str(row, "wopriority"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
