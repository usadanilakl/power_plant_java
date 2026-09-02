package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/**
 * Shared producer for the PWA "reference data" the hub serves (LOTO points, locations, work areas),
 * used by the PWA controllers ({@code PwaFieldListItemController}, {@code PwaWorkRequestController}) so
 * those endpoints share one mapping. (The Supabase/GitHub failover copies of these datasets are built
 * by {@code WorkAreaGitHubPublisher} and written through its configured {@code PwaDataSink}.)
 * See project/architecture/supabase/reference-data.md.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PwaReferenceDataService {

    private final LotoPointRepo lotoPointRepo;
    private final NgValueService valueService;
    private final WorkAreaRepo workAreaRepo;

    public List<Map<String, Object>> getLotoPoints() {
        return lotoPointRepo.findAll().stream()
                .map(lp -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", lp.getId());
                    map.put("tagNumber", lp.getTagNumber() != null ? lp.getTagNumber() : "");
                    map.put("description", lp.getDescription() != null ? lp.getDescription() : "");
                    map.put("specificLocation", lp.getSpecificLocation() != null ? lp.getSpecificLocation() : "");
                    map.put("eqType", lp.getEqType() != null ? lp.getEqType().getName() : "");
                    map.put("locationId", lp.getLocation() != null ? lp.getLocation().getId() : null);
                    return map;
                })
                .toList();
    }

    public List<Map<String, Object>> getLocations() {
        // Blank/null names filtered for the same reason as toSystemMaps below: Map.of throws on a
        // null value, so one bad row took out the whole endpoint.
        return toIdNameMaps(valueService.getValuesByCategory("Location"));
    }

    /**
     * The plant's SYSTEM vocabulary, for the PWA work-request wizard's "a whole system" answer.
     *
     * <p>Wrapped in a try/catch because {@code NgValueService.getValuesByCategory} THROWS when the
     * category does not exist rather than returning empty — on a site that has never created the
     * System category that would turn an optional picker into a failed request.
     */
    public List<Map<String, Object>> getSystems() {
        try {
            return toSystemMaps(valueService.getValuesByCategory("System"));
        } catch (RuntimeException e) {
            log.debug("[PWA Reference] System category unavailable: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * {@code Value} rows as {@code {id, name}}, skipping anything with no usable name.
     *
     * <p>Static, so the GitHub/Supabase publisher can share it without injecting this service —
     * that edge would close a cycle through {@code NgValueService} back to the publisher, and the
     * neighbouring {@code NgLotoPointService} already documents that exact breakage.
     *
     * <p>The blank filter is load-bearing twice over: {@code Map.of} NPEs on a null value, and the
     * PWA sorts these with {@code localeCompare}, which throws on null.
     */
    public static List<Map<String, Object>> toSystemMaps(List<com.dk_power.power_plant_java.entities.categories.Value> values) {
        return toIdNameMaps(values);
    }

    private static List<Map<String, Object>> toIdNameMaps(List<com.dk_power.power_plant_java.entities.categories.Value> values) {
        return (values == null ? List.<com.dk_power.power_plant_java.entities.categories.Value>of() : values).stream()
                .filter(v -> v != null && v.getName() != null && !v.getName().isBlank())
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                .toList();
    }

    public List<Map<String, Object>> getWorkAreas() {
        Map<Long, List<Long>> lotoIds = constantLotoIdsByArea(workAreaRepo);
        return workAreaRepo.findAllWithLocations().stream()
                .map(wa -> toWorkAreaMap(wa, lotoIds.getOrDefault(wa.getId(), List.of())))
                .toList();
    }

    /**
     * {@code workAreaId -> constant LOTO standard ids}, in one query.
     *
     * <p>Shared with {@code WorkAreaGitHubPublisher} so the live payload and the offline snapshot
     * are built the same way. Read as a projection because both callers run OUTSIDE a transaction —
     * the areas they hold are detached, and touching {@code constantLotos} on a detached area
     * throws {@code LazyInitializationException}.
     */
    public static Map<Long, List<Long>> constantLotoIdsByArea(WorkAreaRepo repo) {
        Map<Long, List<Long>> out = new LinkedHashMap<>();
        for (Object[] pair : repo.findConstantLotoStandardIdPairs()) {
            Long areaId = (Long) pair[0];
            Long standardId = (Long) pair[1];
            if (areaId == null || standardId == null) continue;
            out.computeIfAbsent(areaId, k -> new ArrayList<>()).add(standardId);
        }
        return out;
    }

    /**
     * One work-area row for PWA consumers. Shared with {@code WorkAreaGitHubPublisher} so the live
     * hub payload and the offline (Supabase / static JSON) snapshot cannot drift apart — they had
     * already diverged once, the snapshot omitting {@code description} and {@code isConfinedSpace}.
     *
     * <p>{@code areaTypeName} lets a picker restrict itself to certain kinds of area (an insulation
     * -removal picker has no use for confined spaces); {@code locationUnitFilters} lets it narrow a
     * shared location's equipment to one unit.
     */
    public static Map<String, Object> toWorkAreaMap(WorkArea wa) {
        return toWorkAreaMap(wa, List.of());
    }

    /**
     * As above, plus the area's constant LOTO standards — passed in rather than read from the
     * entity, for the detachment reason in {@link #constantLotoIdsByArea}.
     */
    public static Map<String, Object> toWorkAreaMap(WorkArea wa, List<Long> constantLotoIds) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", wa.getId());
        map.put("name", wa.getName() != null ? wa.getName() : "");
        map.put("description", wa.getDescription() != null ? wa.getDescription() : "");
        map.put("isConfinedSpace", hasConfinedSpaceHazards(wa));
        map.put("areaTypeId", wa.getAreaType() != null ? wa.getAreaType().getId() : null);
        map.put("areaTypeName", wa.getAreaType() != null && wa.getAreaType().getName() != null
                ? wa.getAreaType().getName()
                : "");
        map.put("locationIds", wa.getLocations() != null
                ? wa.getLocations().stream().map(v -> v.getId()).toList()
                : List.of());
        map.put("locationUnitFilters", wa.getLocationUnitFilters());

        // The area's standing hazard profile. The PWA seeds a new work request from this the moment
        // the requester picks the area on the map, so a contractor is not asked to know which
        // hazards a part of the plant always carries.
        //
        // Read defensively: these getters deserialize a JSON column and RETHROW on malformed
        // content. That is survivable on the admin screen that edits one area, but here a single
        // bad row would fail the whole reference snapshot and take the map picker down with it.
        map.put("constantHazards", readHazardBlock(wa, WorkArea::getConstantHazards));
        map.put("constantHotWorkMeasures", readHazardBlock(wa, WorkArea::getConstantHotWorkMeasures));
        map.put("constantConfinedSpaceHazards", readHazardBlock(wa, WorkArea::getConstantConfinedSpaceHazards));
        map.put("constantLotoIds", constantLotoIds);
        return map;
    }

    private static Object readHazardBlock(WorkArea wa, java.util.function.Function<WorkArea, Object> getter) {
        try {
            return getter.apply(wa);
        } catch (Exception e) {
            log.warn("[PWA Reference] Work area {} has unreadable hazard JSON; omitting that block",
                    wa.getId(), e);
            return null;
        }
    }

    public static boolean hasConfinedSpaceHazards(WorkArea wa) {
        try {
            var h = wa.getConstantConfinedSpaceHazards();
            return h.isOxygenDeficiency() || h.isFlammableGas() || h.isCombustibleDust()
                    || h.isToxicGas() || h.isRotatingEquipment() || h.isElectricalShock()
                    || h.isEntrapment() || h.isEngulfment() || h.isHeatStress() || h.isOther();
        } catch (Exception e) {
            return false;
        }
    }
}
