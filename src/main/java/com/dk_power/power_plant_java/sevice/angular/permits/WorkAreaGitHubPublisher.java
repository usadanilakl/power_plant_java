package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.mappers.permits.WorkAreaMapper;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
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
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapShapeRepo shapeRepo;
    private final WorkAreaMapper workAreaMapper;
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

    @Async
    public void publishAll() {
        if (!publishInProgress.compareAndSet(false, true)) {
            log.info("[PWA Publisher] Publish already in progress, skipping");
            return;
        }
        try {
            // Write locally for dev builds
            Path dataDir = Paths.get(pwaDataPath);
            Files.createDirectories(dataDir);

            String areasJson = buildAreasJson();
            String shapesJson = buildShapesJson();
            byte[] imageBytes = readMapImage();

            // Local writes
            Files.writeString(dataDir.resolve("work-areas.json"), areasJson);
            Files.writeString(dataDir.resolve("work-area-shapes.json"), shapesJson);
            if (imageBytes != null) {
                Files.copy(Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg"),
                        dataDir.resolve("work-area-map-image.jpg"), StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("[PWA Publisher] Local files written to {}", dataDir);

            // Push to GitHub for live PWA
            pushToGitHub(areasJson, shapesJson, imageBytes);

        } catch (Exception e) {
            log.error("[PWA Publisher] Failed: {}", e.getMessage(), e);
        } finally {
            publishInProgress.set(false);
        }
    }

    private String buildAreasJson() throws IOException {
        List<Map<String, Object>> areas = workAreaRepo.findAll().stream()
                .map(area -> Map.<String, Object>of("id", area.getId(), "name", area.getName() != null ? area.getName() : ""))
                .collect(Collectors.toList());
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(areas);
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

    private void pushToGitHub(String areasJson, String shapesJson, byte[] imageBytes) {
        try {
            GHRepository repo = gitHub.getRepository(pwaGitHubRepo);

            pushTextFile(repo, "data/work-areas.json", areasJson);
            pushTextFile(repo, "data/work-area-shapes.json", shapesJson);
            if (imageBytes != null) {
                pushBinaryFile(repo, "data/work-area-map-image.jpg", imageBytes);
            }

            log.info("[PWA Publisher] GitHub repo {} updated", pwaGitHubRepo);
        } catch (Exception e) {
            log.error("[PWA Publisher] GitHub push failed (local files still written): {}", e.getMessage());
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
        } catch (Exception e) {
            repo.createContent(content, "Create " + path, path);
            log.info("[PWA Publisher] Created {} on GitHub", path);
        }
    }
}
