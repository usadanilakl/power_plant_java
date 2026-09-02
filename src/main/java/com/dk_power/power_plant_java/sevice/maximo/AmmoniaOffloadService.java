package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The single standing "Ammonia Offloads" work order that every completed ammonia-offload checklist attaches to.
 *
 * <p>There is no scheduled/PM work order for an ammonia delivery — an offload happens whenever a truck arrives —
 * so instead of one WO per offload (which would litter Maximo and never close), every offload's completed
 * checklist PDF + a worklog line lands on ONE persistent WO. It is identified by a marker at the start of the WO
 * description ({@link #MARKER}), the same convention {@link MaximoToiService} uses; {@link #resolveOrCreate}
 * finds it (across restarts) or creates it once, then the href/wonum are cached for the process lifetime.
 *
 * <p>Gated with {@code @ConditionalOnProperty(maximo.api-key)} like the Maximo adapter beans it depends on.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "maximo.api-key")
@RequiredArgsConstructor
public class AmmoniaOffloadService {

    /** Marker at the start of the standing WO's description, so a LIKE query can always find it again. */
    public static final String MARKER = "<<AMMONIA-OFFLOADS>>";
    /** The seeded checklist template this section drives (see {@code MaximoFormSeeder.ammoniaOffload()}). */
    public static final String FORM_KEY = "AMMONIA_OFFLOAD";
    private static final String DESCRIPTION = MARKER + " Ammonia Offloads";

    private final MaximoWorkOrderAdapter workOrders;

    /** Cached once resolved/created — the standing WO doesn't change for the process lifetime. */
    private volatile MaximoWorkOrderDto cached;

    /**
     * The standing "Ammonia Offloads" work order: the cached copy, else the existing marked WO in Maximo, else a
     * freshly-created one (created once, then reused forever). Never completed — it is a blanket WO that stays open
     * to collect every offload's attachment + worklog.
     */
    public MaximoWorkOrderDto resolveOrCreate(String siteid) {
        MaximoWorkOrderDto c = cached;
        if (c != null && c.getHref() != null && !c.getHref().isBlank()) return c;
        synchronized (this) {
            if (cached != null) return cached;
            MaximoWorkOrderDto found = findExisting(siteid);
            if (found != null) { cached = found; return found; }
            MaximoWorkOrderDto created = create(siteid);
            cached = created;
            return created;
        }
    }

    /** @return the existing standing WO (marker in the description), or null if none exists yet. */
    private MaximoWorkOrderDto findExisting(String siteid) {
        try {
            MaximoWorkOrderCriteria crit = new MaximoWorkOrderCriteria();
            crit.setDescriptionPhrase(MARKER);   // LIKE "%<<AMMONIA-OFFLOADS%"
            crit.setSiteid(siteid);
            List<MaximoWorkOrderDto> hits = workOrders.listByCriteria(crit, 5);
            for (MaximoWorkOrderDto w : hits) {
                if (w.getDescription() != null && w.getDescription().contains(MARKER)) {
                    log.info("[Ammonia] Using existing standing WO {} ({})", w.getWonum(), w.getHref());
                    return w;
                }
            }
        } catch (RuntimeException e) {
            log.warn("[Ammonia] lookup of standing WO failed: {}", e.getMessage());
        }
        return null;
    }

    /** Create the standing WO once (comes back WAPPR — attachments + worklog still apply, like TOI). */
    private MaximoWorkOrderDto create(String siteid) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("spi:description", DESCRIPTION);
        fields.put("spi:description_longdescription",
                "Standing work order for ammonia delivery offloads. Each completed ammonia offload checklist "
                        + "attaches here as a PDF with a worklog entry. Do not complete/close this work order.");
        if (siteid != null && !siteid.isBlank()) fields.put("spi:siteid", siteid.trim());
        MaximoWorkOrderDto wo = workOrders.create(fields);
        log.info("[Ammonia] Created standing WO {} ({})", wo.getWonum(), wo.getHref());
        return wo;
    }
}
