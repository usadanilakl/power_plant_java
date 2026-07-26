package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
        return valueService.getValuesByCategory("Location").stream()
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                .toList();
    }

    public List<Map<String, Object>> getWorkAreas() {
        return workAreaRepo.findAllWithLocations().stream()
                .map(wa -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", wa.getId());
                    map.put("name", wa.getName() != null ? wa.getName() : "");
                    map.put("description", wa.getDescription() != null ? wa.getDescription() : "");
                    map.put("isConfinedSpace", hasConfinedSpaceHazards(wa));
                    map.put("locationIds", wa.getLocations() != null
                            ? wa.getLocations().stream().map(v -> v.getId()).toList()
                            : java.util.List.of());
                    return map;
                })
                .toList();
    }

    public boolean hasConfinedSpaceHazards(WorkArea wa) {
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
