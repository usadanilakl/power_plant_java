package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.entities.physical.PhysicalObjectType;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAccessService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAssetAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoLocationAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Seeds/refreshes the {@link PhysicalObject} tree from Maximo: {@code mxapioperloc} (the location hierarchy,
 * via {@code spi:parent}) then {@code mxasset} (equipment leaves parented to their location). Idempotent —
 * upserts by {@link PhysicalObject#getMaximoKey()}.
 *
 * <p><b>Local-owned, Maximo-seeded.</b> On CREATE it fills every field from Maximo (name := description). On
 * UPDATE it refreshes only Maximo-owned fields ({@code description}, {@code maximoType}, structural {@code parent}
 * and {@code type}) and never touches locally-editable fields ({@code name}, {@code specificLocation}, representation
 * refs, {@code floorIndex}). Hand-added, non-Maximo nodes have no {@code maximoKey} match in the Maximo pull, so the
 * seeder never visits them. Change-guarded: rows with no real diff are not re-saved (no sync noise on a no-op reseed).
 *
 * <p>Intended to run on the hub (one authoritative seeder → propagates via sync); exposed as an admin endpoint so it
 * can also be run on a desktop for local verification. The type→level mapping is a depth heuristic (see
 * {@link #depthToType}) — refine once real {@code spi:type} values are reviewed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PhysicalObjectMaximoSeeder {

    private final MaximoLocationAdapter locations;
    private final MaximoAssetAdapter assets;
    private final PhysicalObjectRepo repo;
    private final MaximoAccessService access;

    /** Summary of a reseed run. */
    public record SeedResult(String site, int locations, int locationsCreated,
                             int assets, int assetsCreated, int orphanAssets, int totalNodes) {}

    @Transactional
    public SeedResult reseed(String siteid) {
        String site = (siteid != null && !siteid.isBlank()) ? siteid : access.defaultSite();

        // Existing rows indexed by their stable key (only Maximo-keyed rows participate in upsert).
        Map<String, PhysicalObject> byKey = new HashMap<>();
        for (PhysicalObject p : repo.findAll()) {
            if (p.getMaximoKey() != null) byKey.putIfAbsent(p.getMaximoKey(), p);
        }

        // ── Pass 1: locations (scalar fields; parent/type resolved after all nodes exist) ──
        List<MaximoLocationDto> locs = locations.getAllLocations(site);
        Map<String, String> parentCodeOf = new HashMap<>();          // location code -> Maximo parent code
        Map<String, PhysicalObject> nodeByCode = new HashMap<>();     // location code -> node
        List<PhysicalObject> dirty = new ArrayList<>();
        int locCreated = 0;

        for (MaximoLocationDto l : locs) {
            String code = l.getLocation();
            parentCodeOf.put(code, blankToNull(l.getParent()));
            String key = PhysicalObject.keyFor(site, code, null, null);
            PhysicalObject node = byKey.get(key);
            boolean isNew = node == null;
            if (isNew) {
                node = new PhysicalObject();
                node.setMaximoSiteid(site);
                node.setMaximoLocation(code);
                node.setTagNumber(code);
                node.setName(l.getDescription() != null ? l.getDescription() : code); // local-editable henceforth
                byKey.put(key, node);
                locCreated++;
            }
            boolean changed = isNew;
            changed |= setIfChanged(node.getDescription(), l.getDescription(), node::setDescription);
            changed |= setIfChanged(node.getMaximoType(), l.getType(), node::setMaximoType);
            nodeByCode.put(code, node);
            if (changed) dirty.add(node);
        }
        // persist new location nodes so they have ids before we wire parents
        if (!dirty.isEmpty()) { repo.saveAll(dirty); repo.flush(); dirty.clear(); }

        // Pass 1b: parent + depth-based type
        Map<String, Integer> depthCache = new HashMap<>();
        for (MaximoLocationDto l : locs) {
            String code = l.getLocation();
            PhysicalObject node = nodeByCode.get(code);
            if (node == null) continue;
            PhysicalObject parent = nodeByCode.get(parentCodeOf.get(code));
            PhysicalObjectType type = depthToType(depth(code, parentCodeOf, depthCache));
            boolean changed = false;
            if (!Objects.equals(idOf(node.getParent()), idOf(parent))) { node.setParent(parent); changed = true; }
            if (node.getType() != type)                                 { node.setType(type);    changed = true; }
            if (changed) dirty.add(node);
        }
        if (!dirty.isEmpty()) { repo.saveAll(dirty); repo.flush(); dirty.clear(); }

        // ── Pass 2: assets → EQUIPMENT leaves parented to their location node ──
        List<MaximoAssetDto> asts = assets.getAllAssets(site);
        int astCreated = 0, orphans = 0;
        for (MaximoAssetDto a : asts) {
            String assetnum = a.getAssetnum();
            if (assetnum == null || assetnum.isBlank()) continue;
            String key = PhysicalObject.keyFor(site, null, assetnum, null);
            PhysicalObject node = byKey.get(key);
            boolean isNew = node == null;
            if (isNew) {
                node = new PhysicalObject();
                node.setMaximoSiteid(site);
                node.setMaximoAssetnum(assetnum);
                node.setTagNumber(assetnum);
                node.setName(a.getDescription() != null ? a.getDescription() : assetnum);
                node.setType(PhysicalObjectType.EQUIPMENT);
                byKey.put(key, node);
                astCreated++;
            }
            PhysicalObject parent = a.getLocation() != null ? nodeByCode.get(a.getLocation()) : null;
            if (parent == null && a.getLocation() != null) orphans++;
            boolean changed = isNew;
            changed |= setIfChanged(node.getDescription(), a.getDescription(), node::setDescription);
            changed |= setIfChanged(node.getMaximoType(), a.getAssettype(), node::setMaximoType);
            changed |= setIfChanged(node.getMaximoLocation(), a.getLocation(), node::setMaximoLocation);
            if (!Objects.equals(idOf(node.getParent()), idOf(parent))) { node.setParent(parent); changed = true; }
            if (node.getType() != PhysicalObjectType.EQUIPMENT)         { node.setType(PhysicalObjectType.EQUIPMENT); changed = true; }
            if (changed) dirty.add(node);
        }
        if (!dirty.isEmpty()) { repo.saveAll(dirty); repo.flush(); }

        int total = (int) repo.findAll().stream().filter(p -> p.getMaximoKey() != null).count();
        SeedResult result = new SeedResult(site, locs.size(), locCreated, asts.size(), astCreated, orphans, total);
        log.info("[PhysicalObject seed] site={} locations={} (+{}) assets={} (+{}) orphanAssets={} totalNodes={}",
                site, locs.size(), locCreated, asts.size(), astCreated, orphans, total);
        return result;
    }

    // ── helpers ──────────────────────────────────────────────────────────────────────────────────

    /** Set via the consumer only when the value differs; returns whether it changed. */
    private static boolean setIfChanged(String current, String incoming, java.util.function.Consumer<String> setter) {
        if (Objects.equals(current, incoming)) return false;
        setter.accept(incoming);
        return true;
    }

    private static Long idOf(PhysicalObject p) { return p == null ? null : p.getId(); }

    private static String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    /** Distance from the root along the Maximo parent chain (memoized, cycle-guarded). */
    private static int depth(String code, Map<String, String> parentOf, Map<String, Integer> cache) {
        Integer cached = cache.get(code);
        if (cached != null) return cached;
        int d = 0;
        String cur = code;
        java.util.Set<String> seen = new java.util.HashSet<>();
        while (cur != null && seen.add(cur)) {
            String parent = parentOf.get(cur);
            if (parent == null || !parentOf.containsKey(parent)) break;
            d++;
            cur = parent;
        }
        cache.put(code, d);
        return d;
    }

    /** Depth → hierarchy level. Heuristic; refine when real {@code spi:type} values are reviewed. */
    private static PhysicalObjectType depthToType(int depth) {
        return switch (depth) {
            case 0 -> PhysicalObjectType.PLANT;
            case 1 -> PhysicalObjectType.SECTION;
            case 2 -> PhysicalObjectType.SYSTEM;
            case 3 -> PhysicalObjectType.SKID;
            default -> PhysicalObjectType.LOCATION;
        };
    }
}
