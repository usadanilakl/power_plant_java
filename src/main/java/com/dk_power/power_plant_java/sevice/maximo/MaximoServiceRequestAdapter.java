package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
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
public class MaximoServiceRequestAdapter {

    private static final String OS = "mxapisr";
    private static final String SELECT_FIELDS =
            "spi:ticketid,spi:description,spi:description_longdescription,spi:status,"
            + "spi:assetnum,spi:location,spi:siteid,spi:reportedby,spi:reportdate,"
            + "spi:classstructureid,spi:reportedpriority,spi:affectedperson";

    private final MaximoAccessService access;

    /** List service requests by status (e.g. "NEW", "QUEUED", "INPROG", "RESOLVED", "CLOSED"). */
    public List<MaximoServiceRequestDto> listByStatus(String status, int pageSize) {
        if (status == null || status.isBlank()) return List.of();
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
        c.setStatus(status);
        return listByCriteria(c, pageSize);
    }

    /** List service requests for a given assetnum, newest reportdate first. */
    public List<MaximoServiceRequestDto> listForAsset(String assetnum, int pageSize) {
        if (assetnum == null || assetnum.isBlank()) return List.of();
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
        c.setAssetnum(assetnum);
        return listByCriteria(c, pageSize);
    }

    /**
     * AND-combined query across any subset of SR criteria fields.
     * Returns empty list if no criteria provided (don't blast the whole site).
     */
    public List<MaximoServiceRequestDto> listByCriteria(MaximoServiceRequestCriteria c, int pageSize) {
        if (c == null) return List.of();
        List<String> conds = new ArrayList<>();
        addStr(conds, "status", c.getStatus());
        addStr(conds, "assetnum", c.getAssetnum());
        addStr(conds, "location", c.getLocation());
        addNum(conds, "reportedpriority", c.getPriority());
        addStr(conds, "reportedby", c.getReportedby());
        addStr(conds, "affectedperson", c.getAffectedperson());
        addStr(conds, "classstructureid", c.getClassstructureid());
        addStrOp(conds, "reportdate", ">=", c.getReportdateFrom());
        addStrOp(conds, "reportdate", "<=", c.getReportdateTo());
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

    private static void addStrOp(List<String> conds, String field, String op, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + op + "\"" + escape(value) + "\"");
    }

    private static void addLike(List<String> conds, String field, String value) {
        if (value == null || value.isBlank()) return;
        conds.add("spi:" + field + "=\"%" + escape(value) + "%\"");
    }

    public Optional<MaximoServiceRequestDto> findByHref(String href) {
        if (href == null || href.isBlank()) return Optional.empty();
        Map<String, Object> body = access.getMap(
                access.osUrl(OS) + "/" + href, Map.of("oslc.select", SELECT_FIELDS));
        if (body == null) return Optional.empty();
        return Optional.of(map(body));
    }

    /** Create a new service request. Returns the freshly-created record (Maximo echoes it back when Properties: * is set). */
    public MaximoServiceRequestDto create(CreateMaximoServiceRequestDto req) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (req.getDescription() != null) payload.put("description", req.getDescription());
        if (req.getLongDescription() != null) payload.put("description_longdescription", req.getLongDescription());
        if (req.getAssetnum() != null) payload.put("assetnum", req.getAssetnum());
        if (req.getLocation() != null) payload.put("location", req.getLocation());
        payload.put("siteid",
                (req.getSiteid() != null && !req.getSiteid().isBlank()) ? req.getSiteid() : access.defaultSite());
        if (req.getReportedby() != null) payload.put("reportedby", req.getReportedby());
        if (req.getClassstructureid() != null) payload.put("classstructureid", req.getClassstructureid());
        if (req.getPriority() != null) payload.put("reportedpriority", req.getPriority());
        if (req.getAffectedperson() != null) payload.put("affectedperson", req.getAffectedperson());
        // class is "SR" — required so Maximo creates a Service Request (not an Incident or Problem)
        payload.put("class", "SR");

        Map<String, Object> created = access.postJson(access.osUrl(OS), null, payload);
        log.info("[Maximo] Created SR ticketid={}", str(created, "ticketid"));
        return map(created);
    }

    private List<MaximoServiceRequestDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoServiceRequestDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoServiceRequestDto map(Map<String, Object> row) {
        MaximoServiceRequestDto d = new MaximoServiceRequestDto();
        d.setHref(hrefId(row));
        d.setTicketid(str(row, "ticketid"));
        d.setDescription(str(row, "description"));
        d.setLongDescription(str(row, "description_longdescription"));
        d.setStatus(str(row, "status"));
        d.setAssetnum(str(row, "assetnum"));
        d.setLocation(str(row, "location"));
        d.setSiteid(str(row, "siteid"));
        d.setReportedby(str(row, "reportedby"));
        d.setReportdate(str(row, "reportdate"));
        d.setClassstructureid(str(row, "classstructureid"));
        d.setPriority(str(row, "reportedpriority"));
        d.setAffectedperson(str(row, "affectedperson"));
        return d;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
