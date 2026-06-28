package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Orchestrates the parts-checkout flow against Maximo:
 *   create WO (location, description, worktype) → APPR → issue material lines → COMP.
 *
 * Validated live (WO J26-41383). Material issues decrement inventory immediately and cannot be
 * deleted, so the lines are added only after the WO is approved and right before completion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoPartsCheckoutService {

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoAccessService access;

    public PartsCheckoutResult checkout(PartsCheckoutRequest req) {
        if (req == null) throw new IllegalArgumentException("request is required");
        List<PartsCheckoutRequest.Line> lines = req.getLines();
        if (lines == null || lines.isEmpty()) throw new IllegalArgumentException("at least one item line is required");
        if (req.getLocation() == null || req.getLocation().isBlank())
            throw new IllegalArgumentException("location is required");

        // 1. create
        MaximoWorkOrderDto wo = workOrders.create(
                req.getDescription(), req.getLocation(), req.getWorktype(), req.getSiteid());
        String href = wo.getHref();
        log.info("[Checkout] created WO {} ({}), issuing {} line(s)", wo.getWonum(), href, lines.size());

        // 2. approve
        workOrders.changeStatus(href, "APPR", req.getMemo());

        // 3. issue all material lines in one additive call
        workOrders.addMaterials(href, lines, req.getStoreroom());

        // 4. complete
        workOrders.changeStatus(href, "COMP", req.getMemo());

        // 5. read back final state (status + actual material cost) for the confirmation
        Map<String, Object> body = access.getMap(access.osUrl("mxapiwodetail") + "/" + href,
                Map.of("oslc.select", "spi:wonum,spi:status,spi:actmatcost"));
        return new PartsCheckoutResult(
                MaximoOslcMapper.str(body, "wonum") != null ? MaximoOslcMapper.str(body, "wonum") : wo.getWonum(),
                href,
                MaximoOslcMapper.str(body, "status"),
                doubleVal(MaximoOslcMapper.str(body, "actmatcost")));
    }

    private static Double doubleVal(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }
}
