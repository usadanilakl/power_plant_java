package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.mappers.permits.WorkAreaMapper;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.HttpException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkAreaGitHubPublisher {
    public enum PublishTarget {
        NONE,
        AREAS,
        MAP,
        CATEGORIES,
        ALL
    }

    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapShapeRepo shapeRepo;
    private final WorkAreaMapper workAreaMapper;
    private final NgValueService valueService;
    private final ObjectMapper objectMapper;
    private final GitHub gitHub;

    @Value("${pwa.data.path:${user.dir}/browser/ng-ui/public/data}")
    private String pwaDataPath;

    @Value("${pwa.github.repo:JacksonGeneration/permits}")
    private String pwaGitHubRepo;

    @Value("${files.root.path}")
    private String filesRootPath;

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

    private void requestPublish(PublishTarget target) {
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

                // Write locally for dev builds
                Path dataDir = Paths.get(pwaDataPath);
                Files.createDirectories(dataDir);

                if (shouldPublishAreas(targetToPublish)) {
                    String areasJson = buildAreasJson();
                    String shapesJson = buildShapesJson();
                    writeAreasLocally(dataDir, areasJson, shapesJson);
                    pushAreasToGitHub(areasJson, shapesJson);
                }

                if (shouldPublishCategories(targetToPublish)) {
                    String categoriesJson = buildCategoriesJson();
                    writeCategoriesLocally(dataDir, categoriesJson);
                    pushCategoriesToGitHub(categoriesJson);
                }

                if (shouldPublishMap(targetToPublish)) {
                    byte[] imageBytes = readMapImage();
                    writeMapLocally(dataDir, imageBytes);
                    pushMapToGitHub(imageBytes);
                }

                log.info("[PWA Publisher] Publish complete for {} to {}", targetToPublish, dataDir);
            } while (publishRequested.get());

        } catch (Exception e) {
            log.error("[PWA Publisher] Failed: {}", e.getMessage(), e);
        } finally {
            publishInProgress.set(false);
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

    private String buildAreasJson() throws IOException {
        List<Map<String, Object>> areas = workAreaRepo.findAll().stream()
                .map(area -> Map.<String, Object>of("id", area.getId(), "name", area.getName() != null ? area.getName() : ""))
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
        List<Map<String, Object>> result = categories.stream()
                .map(cat -> Map.<String, Object>of("id", cat.getId(), "name", cat.getName() != null ? cat.getName() : ""))
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

    private void writeAreasLocally(Path dataDir, String areasJson, String shapesJson) throws IOException {
        Files.writeString(dataDir.resolve("work-areas.json"), areasJson);
        Files.writeString(dataDir.resolve("work-area-shapes.json"), shapesJson);
    }

    private void writeCategoriesLocally(Path dataDir, String categoriesJson) throws IOException {
        Files.writeString(dataDir.resolve("work-categories.json"), categoriesJson);
    }

    private void writeMapLocally(Path dataDir, byte[] imageBytes) throws IOException {
        if (imageBytes == null) {
            return;
        }
        Files.copy(Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg"),
                dataDir.resolve("work-area-map-image.jpg"), StandardCopyOption.REPLACE_EXISTING);
    }

    private void pushAreasToGitHub(String areasJson, String shapesJson) {
        try {
            GHRepository repo = gitHub.getRepository(pwaGitHubRepo);
            pushTextFile(repo, "data/work-areas.json", areasJson);
            pushTextFile(repo, "data/work-area-shapes.json", shapesJson);
            log.info("[PWA Publisher] GitHub repo {} updated for work areas", pwaGitHubRepo);
        } catch (Exception e) {
            log.error("[PWA Publisher] GitHub push failed for work areas (local files still written): {}", e.getMessage(), e);
        }
    }

    private void pushCategoriesToGitHub(String categoriesJson) {
        try {
            GHRepository repo = gitHub.getRepository(pwaGitHubRepo);
            pushTextFile(repo, "data/work-categories.json", categoriesJson);
            log.info("[PWA Publisher] GitHub repo {} updated for work categories", pwaGitHubRepo);
        } catch (Exception e) {
            log.error("[PWA Publisher] GitHub push failed for work categories (local files still written): {}", e.getMessage(), e);
        }
    }

    private void pushMapToGitHub(byte[] imageBytes) {
        if (imageBytes == null) {
            log.info("[PWA Publisher] No map image found, skipping GitHub map publish");
            return;
        }
        try {
            GHRepository repo = gitHub.getRepository(pwaGitHubRepo);
            pushBinaryFile(repo, "data/work-area-map-image.jpg", imageBytes);
            log.info("[PWA Publisher] GitHub repo {} updated for work-area map", pwaGitHubRepo);
        } catch (Exception e) {
            log.error("[PWA Publisher] GitHub push failed for work-area map (local files still written): {}", e.getMessage(), e);
        }
    }

    private void pushTextFile(GHRepository repo, String path, String content) throws IOException {
        byte[] bytes = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        pushBinaryFile(repo, path, bytes);
    }

    private void pushBinaryFile(GHRepository repo, String path, byte[] content) throws IOException {
        try {
            GHContent existing = repo.getFileContent(path);
            existing.update(content, "Update " + path);
            log.info("[PWA Publisher] Updated {} on GitHub", path);
        } catch (HttpException e) {
            if (e.getResponseCode() != 404) {
                throw e;
            }
            repo.createContent(content, "Create " + path, path);
            log.info("[PWA Publisher] Created {} on GitHub", path);
        }
    }
}
