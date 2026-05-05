package com.dk_power.power_plant_java.sevice.maximo;

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
        Map<String, String> params = new LinkedHashMap<>();
        params.put("oslc.select", SELECT_FIELDS);
        params.put("oslc.pageSize", Integer.toString(Math.max(1, pageSize)));
        params.put("oslc.where",
                "spi:assetnum=\"" + escape(assetnum) + "\""
                + " and spi:siteid=\"" + escape(access.defaultSite()) + "\"");
        params.put("oslc.orderBy", "-spi:reportdate");
        Map<String, Object> body = access.getMap(access.osUrl(OS), params);
        return mapAll(members(body));
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
