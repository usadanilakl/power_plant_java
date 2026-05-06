package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.boolVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.longVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

/**
 * Worklog (notes/comments) on a parent ticket.
 * SR → sub-collection "uxworklog" under "mxapisr".
 * WO → sub-collection "woworklog" under "mxapiwodetail".
 * The plain "worklog" path on a WO returns the GLOBAL worklog table — do not use it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoWorklogAdapter {

    private final MaximoAccessService access;

    public List<MaximoWorklogDto> listForSr(String srHref) {
        return list("mxapisr", srHref, "uxworklog");
    }

    public List<MaximoWorklogDto> listForWo(String woHref) {
        return list("mxapiwodetail", woHref, "woworklog");
    }

    private List<MaximoWorklogDto> list(String parentObjectStructure, String parentHref, String collection) {
        if (parentHref == null || parentHref.isBlank()) return List.of();
        String url = access.subUrl(parentObjectStructure, parentHref, collection);
        Map<String, Object> body = access.getMap(url, Map.of("oslc.select", "*"));
        return mapAll(members(body));
    }

    private List<MaximoWorklogDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoWorklogDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoWorklogDto map(Map<String, Object> row) {
        MaximoWorklogDto d = new MaximoWorklogDto();
        d.setHref(hrefId(row));
        d.setWorklogid(longVal(row, "worklogid"));
        d.setDescription(str(row, "description"));
        d.setLongDescription(str(row, "description_longdescription"));
        d.setLogtype(str(row, "logtype"));
        d.setLogtypeDescription(str(row, "logtype_description"));
        d.setCreateby(str(row, "createby"));
        d.setCreatedate(str(row, "createdate"));
        d.setModifyby(str(row, "modifyby"));
        d.setModifydate(str(row, "modifydate"));
        d.setClientviewable(boolVal(row, "clientviewable"));
        d.setRecordkey(str(row, "recordkey"));
        return d;
    }
}
