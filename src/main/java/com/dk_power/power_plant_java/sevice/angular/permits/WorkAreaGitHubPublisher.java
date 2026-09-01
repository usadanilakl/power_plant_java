package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.permits.WorkAreaMapper;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.pwa.PwaReferenceDataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * Publishes the PWA reference datasets. Builds each dataset's JSON once, then hands it to every active
 * {@link PwaDataSink} — GitHub Pages and/or Supabase — selected by the {@code pwa.data-target} flag
 * (default {@code supabase}). The debounce/coalesce state machine, the {@code @Async} entry points,
 * and the {@code /ng/admin/pwa-sync} + on-entity-change triggers are unchanged; only the transport is
 * now pluggable. (Name kept for its many callers; it no longer talks to GitHub directly — the
 * {@link GitHubPagesSink} does.) See project/architecture/supabase/reference-data.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkAreaGitHubPublisher {
    public enum PublishTarget {
        NONE,
        AREAS,
        MAP,
        CATEGORIES,
        FIELD_LIST_TYPES,
        INVENTORY_TYPES,
        LOCATIONS,
        SYSTEMS,
        LOTO_POINTS,
        SDS_CHEMICALS,
        MONITORED_AREAS,
        ALL
    }

    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapShapeRepo shapeRepo;
    private final WorkAreaMapper workAreaMapper;
    private final NgValueService valueService;
    private final LotoPointRepo lotoPointRepo;
    private final SdsChemicalRepo sdsChemicalRepo;
    @org.springframework.context.annotation.Lazy
    private final NgAirMonitoringService airMonitoringService;
    private final com.dk_power.power_plant_java.repository.permits.WorkCategoryProfileRepo workCategoryProfileRepo;
    private final ObjectMapper objectMapper;
    /** All configured transports; each decides via isActive() whether it receives this publish. */
    private final List<PwaDataSink> sinks;

    @Value("${files.root.path}")
    private String filesRootPath;

    @Value("${test.ui.enabled:false}")
    private boolean testMode;

    private static final String PLANT_MAP_MARKER = "__PLANT_MAP__";
    private final AtomicBoolean publishInProgress = new AtomicBoolean(false);
    private final AtomicBoolean publishRequested = new AtomicBoolean(false);
    private volatile PublishTarget pendingTarget = PublishTarget.NONE;

    @Async
    public void publishAll() {
        requestPublish(PublishTarget.ALL);
    }

    @Async
    public void publishAreas() {
        requestPublish(PublishTarget.AREAS);
    }

    @Async
    public void publishMap() {
        requestPublish(PublishTarget.MAP);
    }

    @Async
    public void publishCategories() {
        requestPublish(PublishTarget.CATEGORIES);
    }

    @Async
    public void publishFieldListTypes() {
        requestPublish(PublishTarget.FIELD_LIST_TYPES);
    }

    @Async
    public void publishInventoryTypes() {
        requestPublish(PublishTarget.INVENTORY_TYPES);
    }

    @Async
    public void publishLocations() {
        requestPublish(PublishTarget.LOCATIONS);
    }

    @Async
    public void publishSystems() {
        requestPublish(PublishTarget.SYSTEMS);
    }

    @Async
    public void publishLotoPoints() {
        requestPublish(PublishTarget.LOTO_POINTS);
    }

    /**
     * The air-monitoring list, so the PWA can read it with no signal.
     *
     * <p>Snapshot only. Readings are WRITTEN through the hub with a local outbox covering the gap —
     * a phone cannot write to anything while it is offline anyway, so the remote store's job here is
     * purely to answer "what needs testing" when the hub is unreachable.
     */
    @Async
    public void publishMonitoredAreas() {
        requestPublish(PublishTarget.MONITORED_AREAS);
    }

    @Async
    public void publishSdsChemicals() {
        requestPublish(PublishTarget.SDS_CHEMICALS);
    }

    private void requestPublish(PublishTarget target) {
        if (testMode) {
            log.debug("[PWA Publisher] Skipping publish (test mode active)");
            return;
        }
        mergePendingTarget(target);
        if (!publishInProgress.compareAndSet(false, true)) {
            log.info("[PWA Publisher] Publish already in progress, queueing a follow-up run for {}", pendingTarget);
            return;
        }
        try {
            do {
                PublishTarget targetToPublish = pendingTarget;
                pendingTarget = PublishTarget.NONE;
                publishRequested.set(false);

                List<PwaDataSink> active = sinks.stream().filter(PwaDataSink::isActive).toList();
                if (active.isEmpty()) {
                    log.warn("[PWA Publisher] No active data sink (pwa.data-target) — skipping publish of {}", targetToPublish);
                    continue;
                }

                if (shouldPublishAreas(targetToPublish)) {
                    publishText(active, "work_areas", "work-areas.json", buildAreasJson());
                    publishText(active, "work_area_shapes", "work-area-shapes.json", buildShapesJson());
                }
                if (shouldPublishCategories(targetToPublish)) {
                    publishText(active, "work_categories", "work-categories.json", buildCategoriesJson());
                }
                if (shouldPublishFieldListTypes(targetToPublish)) {
                    publishText(active, "field_list_types", "field-list-types.json", buildFieldListTypesJson());
                }
                if (shouldPublishInventoryTypes(targetToPublish)) {
                    publishText(active, "inventory_types", "inventory-types.json", buildInventoryTypesJson());
                }
                if (shouldPublishLocations(targetToPublish)) {
                    publishText(active, "locations", "locations.json", buildLocationsJson());
                }
                if (shouldPublishSystems(targetToPublish)) {
                    publishText(active, "systems", "systems.json", buildSystemsJson());
                }
                if (shouldPublishLotoPoints(targetToPublish)) {
                    publishText(active, "loto_points", "loto-points.json", buildLotoPointsJson());
                }
                if (shouldPublishMonitoredAreas(targetToPublish)) {
                    publishText(active, "monitored_areas", "monitored-areas.json", buildMonitoredAreasJson());
                }
                if (shouldPublishSdsChemicals(targetToPublish)) {
                    publishText(active, "sds_chemicals", "sds-chemicals.json", buildSdsChemicalsJson());
                }
                if (shouldPublishMap(targetToPublish)) {
                    byte[] imageBytes = readMapImage();
                    if (imageBytes != null) {
                        publishBinary(active, "work_area_map", "work-area-map-image.jpg", imageBytes);
                    }
                }

                log.info("[PWA Publisher] Publish complete for {} to {}", targetToPublish,
                        active.stream().map(PwaDataSink::name).toList());
            } while (publishRequested.get());

        } catch (Exception e) {
            log.error("[PWA Publisher] Failed: {}", e.getMessage(), e);
        } finally {
            publishInProgress.set(false);
        }
    }

    /** Sends one JSON dataset to every active sink; a single sink failure never blocks the others. */
    private void publishText(List<PwaDataSink> active, String datasetKey, String fileBaseName, String json) {
        for (PwaDataSink sink : active) {
            try {
                sink.publishText(datasetKey, fileBaseName, json);
            } catch (Exception e) {
                log.error("[PWA Publisher] {} sink failed for {}: {}", sink.name(), datasetKey, e.getMessage());
            }
        }
    }

    private void publishBinary(List<PwaDataSink> active, String datasetKey, String fileBaseName, byte[] content) {
        for (PwaDataSink sink : active) {
            try {
                sink.publishBinary(datasetKey, fileBaseName, content);
            } catch (Exception e) {
                log.error("[PWA Publisher] {} sink failed for {}: {}", sink.name(), datasetKey, e.getMessage());
            }
        }
    }

    private synchronized void mergePendingTarget(PublishTarget target) {
        pendingTarget = combineTargets(pendingTarget, target);
        publishRequested.set(true);
    }

    private PublishTarget combineTargets(PublishTarget current, PublishTarget requested) {
        if (current == PublishTarget.NONE) {
            return requested;
        }
        if (requested == PublishTarget.NONE) {
            return current;
        }
        if (current == PublishTarget.ALL || requested == PublishTarget.ALL) {
            return PublishTarget.ALL;
        }
        if (current == requested) {
            return current;
        }
        if ((current == PublishTarget.AREAS && requested == PublishTarget.MAP) ||
            (current == PublishTarget.MAP && requested == PublishTarget.AREAS)) {
            return PublishTarget.AREAS;
        }
        return PublishTarget.ALL;
    }

    private boolean shouldPublishAreas(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.AREAS;
    }

    private boolean shouldPublishMap(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.MAP;
    }

    private boolean shouldPublishCategories(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.CATEGORIES;
    }

    private boolean shouldPublishFieldListTypes(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.FIELD_LIST_TYPES;
    }

    private boolean shouldPublishInventoryTypes(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.INVENTORY_TYPES;
    }

    private boolean shouldPublishLocations(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.LOCATIONS;
    }

    private boolean shouldPublishSystems(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.SYSTEMS;
    }

    private boolean shouldPublishLotoPoints(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.LOTO_POINTS;
    }

    private boolean shouldPublishSdsChemicals(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.SDS_CHEMICALS;
    }

    private boolean shouldPublishMonitoredAreas(PublishTarget target) {
        return target == PublishTarget.ALL || target == PublishTarget.MONITORED_AREAS;
    }

    /**
     * The active list only. An area somebody removed, or whose permit closed, is not something a
     * phone should be prompting anyone to go and test.
     */
    private String buildMonitoredAreasJson() throws IOException {
        return objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(airMonitoringService.list(false));
    }

    private String buildAreasJson() throws IOException {
        // Same row shape as the live hub endpoint (PwaReferenceDataService.getWorkAreas) — this
        // snapshot is the PWA's offline stand-in for it, so any field the picker relies on
        // (areaTypeName, locationUnitFilters, isConfinedSpace) must be present in both.
        Map<Long, List<Long>> lotoIds = PwaReferenceDataService.constantLotoIdsByArea(workAreaRepo);
        List<Map<String, Object>> areas = workAreaRepo.findAllWithLocations().stream()
                .map(wa -> PwaReferenceDataService.toWorkAreaMap(wa, lotoIds.getOrDefault(wa.getId(), List.of())))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(areas);
    }

    private String buildCategoriesJson() throws IOException {
        List<com.dk_power.power_plant_java.entities.categories.Value> categories;
        try {
            categories = valueService.getValuesByCategory("Work Category");
        } catch (RuntimeException e) {
            // Category may not exist yet on fresh DB (seeding in progress) — return empty array
            log.debug("[PWA Publisher] Work Category not found yet, returning empty list");
            categories = List.of();
        }
        // Each category carries its standard hazard profile. Without it the PWA can only seed hazards
        // from the work type while ONLINE (via getWorkCategoryProfileByName), so an offline
        // submission would silently produce a request with fewer hazards than the same work typed
        // in at a desk — the worst kind of difference to have.
        List<Map<String, Object>> result = categories.stream()
                .map(cat -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", cat.getId());
                    row.put("name", cat.getName() != null ? cat.getName() : "");
                    workCategoryProfileRepo.findByWorkCategory_Id(cat.getId()).ifPresent(profile -> {
                        try {
                            row.put("standardHazards", profile.getStandardHazards());
                            row.put("standardHotWorkMeasures", profile.getStandardHotWorkMeasures());
                            row.put("standardConfinedSpaceHazards", profile.getStandardConfinedSpaceHazards());
                        } catch (Exception e) {
                            log.warn("[PWA Publisher] Work category '{}' has unreadable profile JSON; "
                                    + "publishing it without a hazard profile", cat.getName(), e);
                        }
                    });
                    return row;
                })
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    private String buildShapesJson() throws IOException {
        List<WorkAreaMapShapeDto> shapes = shapeRepo.findAll().stream()
                .filter(s -> !PLANT_MAP_MARKER.equals(s.getName()))
                .map(workAreaMapper::convertShapeToDto)
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(shapes);
    }

    private byte[] readMapImage() {
        try {
            Path jpgPath = Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg");
            if (Files.exists(jpgPath)) {
                return Files.readAllBytes(jpgPath);
            }
        } catch (IOException e) {
            log.warn("[PWA Publisher] Could not read map image: {}", e.getMessage());
        }
        return null;
    }

    private String buildFieldListTypesJson() throws IOException {
        List<com.dk_power.power_plant_java.entities.categories.Value> types;
        try {
            types = valueService.getValuesByCategory("FieldListType");
        } catch (RuntimeException e) {
            log.debug("[PWA Publisher] FieldListType not found yet, returning empty list");
            types = List.of();
        }
        List<Map<String, Object>> result = types.stream()
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName() != null ? v.getName() : ""))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    private String buildInventoryTypesJson() throws IOException {
        List<com.dk_power.power_plant_java.entities.categories.Value> types;
        try {
            types = valueService.getValuesByCategory("InventoryType");
        } catch (RuntimeException e) {
            log.debug("[PWA Publisher] InventoryType not found yet, returning empty list");
            types = List.of();
        }
        List<Map<String, Object>> result = types.stream()
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName() != null ? v.getName() : ""))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    private String buildLocationsJson() throws IOException {
        List<com.dk_power.power_plant_java.entities.categories.Value> locations;
        try {
            locations = valueService.getValuesByCategory("Location");
        } catch (RuntimeException e) {
            log.debug("[PWA Publisher] Location category not found yet, returning empty list");
            locations = List.of();
        }
        List<Map<String, Object>> result = locations.stream()
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName() != null ? v.getName() : ""))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    /**
     * The plant's SYSTEM vocabulary, so a requester can say "the whole HRSG" rather than hunting for
     * a tag number on something that has none.
     *
     * <p>Reuses the existing {@code System} Value category — the same list the LOTO tag-number
     * generator and {@code LotoPoint.systemValue} already use — rather than inventing a parallel
     * one. It was the one reference list the PWA had no offline copy of.
     *
     * <p>Published by {@code name}, never by alias: several of these values have no alias at all, so
     * an alias-labelled dropdown would show blanks.
     */
    private String buildSystemsJson() throws IOException {
        List<com.dk_power.power_plant_java.entities.categories.Value> systems;
        try {
            systems = valueService.getValuesByCategory("System");
        } catch (RuntimeException e) {
            log.debug("[PWA Publisher] System category not found yet, returning empty list");
            systems = List.of();
        }
        List<Map<String, Object>> result = systems.stream()
                .filter(v -> v.getName() != null && !v.getName().isBlank())
                .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    private String buildLotoPointsJson() throws IOException {
        List<LotoPoint> points = lotoPointRepo.findAll();
        List<Map<String, Object>> result = points.stream()
                .map(lp -> {
                    java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", lp.getId());
                    map.put("tagNumber", lp.getTagNumber() != null ? lp.getTagNumber() : "");
                    map.put("description", lp.getDescription() != null ? lp.getDescription() : "");
                    map.put("specificLocation", lp.getSpecificLocation() != null ? lp.getSpecificLocation() : "");
                    map.put("eqType", lp.getEqType() != null ? lp.getEqType().getName() : "");
                    map.put("locationId", lp.getLocation() != null ? lp.getLocation().getId() : null);
                    return (Map<String, Object>) map;
                })
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    /**
     * Snapshot of every active SDS chemical (Incoming + Pending + Filed) — the PWA's "Check existing
     * chemicals" panel reads this when the hub is unreachable. Removed/deleted chemicals are skipped
     * (the {@code @Where(deleted IS NOT TRUE)} clause filters out soft-deletes; the status filter
     * keeps the snapshot lean and aligned with what the hub's {@code /active} endpoint returns).
     */
    private String buildSdsChemicalsJson() throws IOException {
        List<SdsChemical> chemicals = sdsChemicalRepo.findByStatus_NameIn(
                List.of("Incoming", "Pending", "Filed"));
        List<Map<String, Object>> result = chemicals.stream()
                .map(c -> {
                    java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", c.getId());
                    map.put("names", c.getNames() != null ? c.getNames() : "");
                    map.put("primaryName", SdsChemicalMapper.primaryName(c.getNames()));
                    map.put("locations", c.getLocations() != null ? c.getLocations() : "");
                    map.put("bookNumber", c.getBookNumber());
                    map.put("sectionNumber", c.getSectionNumber());
                    map.put("statusName", c.getStatus() != null ? c.getStatus().getName() : "");
                    return (Map<String, Object>) map;
                })
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }
}
