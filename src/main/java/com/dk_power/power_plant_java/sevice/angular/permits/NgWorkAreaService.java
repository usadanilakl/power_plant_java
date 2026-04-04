package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.permits.WorkAreaMapShape;
import com.dk_power.power_plant_java.mappers.permits.WorkAreaMapper;
import com.dk_power.power_plant_java.repository.permits.*;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.sync.ManagedEntityFileSyncService;
import com.dk_power.power_plant_java.util.PdfConverter;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgWorkAreaService implements NgCrudService<WorkArea, WorkAreaDto, WorkAreaRepo, WorkAreaMapper> {
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapShapeRepo shapeRepo;
    private final WorkAreaMapper workAreaMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ValueService valueService;
    private final SafeWorkRepo safeWorkRepo;
    private final HotWorkRepo hotWorkRepo;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final WorkAreaGitHubPublisher gitHubPublisher;
    private final ManagedEntityFileSyncService managedEntityFileSyncService;

    @org.springframework.beans.factory.annotation.Value("${files.root.path}")
    private String filesRootPath;
    @org.springframework.beans.factory.annotation.Value("${files.relative.path}")
    private String filesRelativePath;

    private static final String PLANT_MAP_MARKER = "__PLANT_MAP__";
    private static final String WORK_AREA_MAP_ENTITY_TYPE = "WorkAreaMap";
    private static final String PLANT_MAP_TOKEN_PREFIX = "plant-map-sync:";

    @Override
    public WorkAreaRepo getRepo() { return workAreaRepo; }

    @Override
    public WorkAreaMapper getMapper() { return workAreaMapper; }

    @Override
    public SessionFactory getSessionFactory() { return sessionFactory; }

    @Override
    public WorkAreaDto getDto() { return new WorkAreaDto(); }

    @Override
    public WorkArea getEntity() { return new WorkArea(); }

    @Override
    public EntityManager getEntityManager() { return entityManager; }

    @Override
    public Class<WorkArea> getEntityClass() { return WorkArea.class; }

    // --- WorkArea CRUD ---

    public WorkAreaDto saveFromDto(WorkAreaDto dto) {
        WorkArea entity = workAreaMapper.convertToEntity(dto);

        // Handle areaType via ValueService
        if (dto.getAreaType() != null && dto.getAreaType().getId() != null) {
            Value areaType = valueService.getEntityById(dto.getAreaType().getId().toString());
            entity.setAreaType(areaType);
        }

        // Handle constantLotos
        if (dto.getConstantLotoIds() != null && !dto.getConstantLotoIds().isEmpty()) {
            Set<LotoStandard> lotos = dto.getConstantLotoIds().stream()
                    .map(id -> entityManager.find(LotoStandard.class, id))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            entity.setConstantLotos(lotos);
        } else {
            entity.setConstantLotos(new HashSet<>());
        }

        // Handle locations (Location Values)
        if (dto.getLocationIds() != null) {
            Set<Value> locations = dto.getLocationIds().stream()
                    .map(id -> entityManager.find(Value.class, id))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            entity.setLocations(locations);
        }

        WorkArea saved = workAreaRepo.save(entity);
        gitHubPublisher.publishAll();
        return workAreaMapper.convertToDto(saved);
    }

    public List<WorkAreaDto> getAllDtoList() {
        return workAreaRepo.findAll().stream()
                .map(workAreaMapper::convertToDto)
                .collect(Collectors.toList());
    }

    public WorkAreaDto getDtoByIdTyped(Long id) {
        WorkArea entity = workAreaRepo.findById(id).orElse(null);
        return workAreaMapper.convertToDto(entity);
    }

    public List<WorkAreaDto> getByAreaType(Long typeId) {
        return workAreaRepo.findByAreaType_Id(typeId).stream()
                .map(workAreaMapper::convertToDto)
                .collect(Collectors.toList());
    }

    // --- Permit Counts ---

    public Map<String, Object> getActivePermitCounts(Long workAreaId) {
        Map<String, Object> counts = new HashMap<>();
        counts.put("workAreaId", workAreaId);
        counts.put("safeWorkCount", countActivePermitsByWorkArea(safeWorkRepo, workAreaId));
        counts.put("hotWorkCount", countActivePermitsByWorkArea(hotWorkRepo, workAreaId));
        counts.put("confinedSpaceCount", countActivePermitsByWorkArea(confinedSpaceRepo, workAreaId));
        return counts;
    }

    public List<Map<String, Object>> getAllWithPermitCounts() {
        return workAreaRepo.findAll().stream().map(area -> {
            Map<String, Object> item = new HashMap<>();
            item.put("workArea", workAreaMapper.convertToDto(area));
            item.put("safeWorkCount", countActivePermitsByWorkArea(safeWorkRepo, area.getId()));
            item.put("hotWorkCount", countActivePermitsByWorkArea(hotWorkRepo, area.getId()));
            item.put("confinedSpaceCount", countActivePermitsByWorkArea(confinedSpaceRepo, area.getId()));
            return item;
        }).collect(Collectors.toList());
    }

    private long countActivePermitsByWorkArea(Object repo, Long workAreaId) {
        try {
            Long count = (Long) entityManager.createQuery(
                            "SELECT COUNT(e) FROM " + getEntityNameForRepo(repo) +
                                    " e WHERE e.workArea.id = :workAreaId AND e.permitStatus.name = 'Active' AND e.deleted IS NOT TRUE")
                    .setParameter("workAreaId", workAreaId)
                    .getSingleResult();
            return count != null ? count : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private String getEntityNameForRepo(Object repo) {
        if (repo instanceof SafeWorkRepo) return "SafeWork";
        if (repo instanceof HotWorkRepo) return "HotWork";
        if (repo instanceof ConfinedSpaceRepo) return "ConfinedSpace";
        return "SafeWork";
    }

    // --- Map Shape CRUD ---

    public WorkAreaMapShapeDto saveShape(WorkAreaMapShapeDto dto) {
        WorkAreaMapShape entity = workAreaMapper.convertShapeToEntity(dto);
        WorkAreaMapShape saved = shapeRepo.save(entity);
        syncShapeAssignments(saved, dto.getWorkAreaIds());
        gitHubPublisher.publishAll();
        return workAreaMapper.convertShapeToDto(saved);
    }

    public List<WorkAreaMapShapeDto> getAllShapes() {
        return shapeRepo.findAll().stream()
                .filter(shape -> !PLANT_MAP_MARKER.equals(shape.getName()))
                .map(workAreaMapper::convertShapeToDto)
                .collect(Collectors.toList());
    }

    public void deleteShape(Long id) {
        shapeRepo.findById(id).ifPresent(shape -> {
            workAreaRepo.findByShape_Id(shape.getId()).forEach(area -> area.setShape(null));
            shape.setDeleted(true);
            shapeRepo.save(shape);
        });
        gitHubPublisher.publishAll();
    }

    private void syncShapeAssignments(WorkAreaMapShape shape, List<Long> requestedWorkAreaIds) {
        if (shape == null || shape.getId() == null || requestedWorkAreaIds == null) {
            return;
        }

        Set<Long> requestedIds = requestedWorkAreaIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<WorkArea> currentlyAssigned = workAreaRepo.findByShape_Id(shape.getId());
        for (WorkArea area : currentlyAssigned) {
            if (!requestedIds.contains(area.getId())) {
                area.setShape(null);
            }
        }

        if (!requestedIds.isEmpty()) {
            for (Long workAreaId : requestedIds) {
                WorkArea area = workAreaRepo.findById(workAreaId).orElse(null);
                if (area != null) {
                    area.setShape(shape);
                }
            }
        }
    }

    // --- Plant Map Image ---

    public String uploadMapImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are accepted");
        }

        // Split PDF (take first page only) and convert to JPG
        List<File> pages = PdfConverter.splitPdfIntoSinglePageFiles(file, "plant-map");
        if (pages.isEmpty()) {
            throw new IOException("Failed to process PDF");
        }
        File pdfFile = pages.get(0);

        try {
            // Save PDF to profile-specific uploads dir
            Path pdfDir = Paths.get(filesRootPath, "pdf", "work-area-map");
            Files.createDirectories(pdfDir);
            Path pdfDest = pdfDir.resolve("plant-map.pdf");
            Files.copy(pdfFile.toPath(), pdfDest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Convert to JPG and save
            File jpgFile = PdfConverter.convertPdfToJpg(pdfFile);
            if (jpgFile != null && jpgFile.exists()) {
                Path jpgDir = Paths.get(filesRootPath, "jpg", "work-area-map");
                Files.createDirectories(jpgDir);
                Path jpgDest = jpgDir.resolve("plant-map.jpg");
                Files.copy(jpgFile.toPath(), jpgDest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                Files.deleteIfExists(jpgFile.toPath());
            }

            // Clean up extra pages if multi-page PDF
            for (File page : pages) {
                Files.deleteIfExists(page.toPath());
            }
        } catch (IOException e) {
            // Clean up temp files on error
            for (File page : pages) {
                try { Files.deleteIfExists(page.toPath()); } catch (IOException ignored) {}
            }
            throw e;
        }

        // Build the relative file link
        String fileLink = filesRelativePath + "/pdf/work-area-map/plant-map.pdf";

        // Persist the path in a special WorkAreaMapShape record
        WorkAreaMapShape marker = shapeRepo.findByName(PLANT_MAP_MARKER);
        if (marker == null) {
            marker = new WorkAreaMapShape();
            marker.setName(PLANT_MAP_MARKER);
        }
        marker.setCoordinates(fileLink);
        String mapSyncToken = createMapSyncToken();
        marker.setLabel(mapSyncToken);
        marker = shapeRepo.save(marker);

        syncMapFiles(marker.getId());
        persistLocalMapSyncToken(mapSyncToken);

        gitHubPublisher.publishAll();
        return buildMapImageUrl(mapSyncToken);
    }

    public String getMapImagePath() {
        Path jpgPath = Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg");
        Path pdfPath = Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.pdf");
        String localToken = readLocalMapSyncToken();
        if (Files.exists(jpgPath)) {
            WorkAreaMapShape marker = shapeRepo.findByName(PLANT_MAP_MARKER);
            String remoteToken = extractMapSyncToken(marker);
            if (remoteToken == null || Objects.equals(remoteToken, localToken)) {
                return buildMapImageUrl(localToken);
            }
        }

        WorkAreaMapShape marker = shapeRepo.findByName(PLANT_MAP_MARKER);
        if (marker == null || marker.getId() == null) {
            return Files.exists(jpgPath) ? buildMapImageUrl(localToken) : null;
        }

        String remoteToken = extractMapSyncToken(marker);
        boolean hasLocalMap = Files.exists(jpgPath);
        boolean needsRefresh = remoteToken != null && !Objects.equals(remoteToken, localToken);

        if (hasLocalMap && needsRefresh) {
            try {
                clearTempMapFiles();
                managedEntityFileSyncService.downloadEntityFiles(
                        WORK_AREA_MAP_ENTITY_TYPE,
                        marker.getId(),
                        this::resolveTempMapFileDestination);
                if (promoteTempMapFiles()) {
                    persistLocalMapSyncToken(remoteToken);
                    return buildMapImageUrl(remoteToken);
                }
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                        .warn("Failed to refresh work-area map files locally: {}", e.getMessage());
            } finally {
                clearTempMapFiles();
            }

            return buildMapImageUrl(localToken);
        }

        try {
            managedEntityFileSyncService.downloadEntityFiles(
                    WORK_AREA_MAP_ENTITY_TYPE,
                    marker.getId(),
                    this::resolveMapFileDestination);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to hydrate work-area map files locally: {}", e.getMessage());
        }

        if (Files.exists(jpgPath)) {
            if (remoteToken != null) {
                persistLocalMapSyncToken(remoteToken);
            }
            return buildMapImageUrl(remoteToken);
        }
        return null;
    }

    private void syncMapFiles(Long markerId) {
        Path pdfPath = Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.pdf");
        Path jpgPath = Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg");
        try {
            managedEntityFileSyncService.replaceTrackedFiles(
                    WORK_AREA_MAP_ENTITY_TYPE,
                    markerId,
                    List.of(pdfPath, jpgPath));
        } catch (Exception e) {
            // Keep local map upload successful even if sync transport is temporarily unavailable.
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to sync work-area map files to server: {}", e.getMessage());
        }
    }

    private Path resolveMapFileDestination(ManagedEntityFileSyncService.RemoteFileDescriptor remoteFile) {
        String fileName = remoteFile.fileName() == null ? "" : remoteFile.fileName().toLowerCase();
        if (fileName.endsWith(".pdf")) {
            return Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.pdf");
        }
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
            return Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg");
        }
        return null;
    }

    private Path resolveTempMapFileDestination(ManagedEntityFileSyncService.RemoteFileDescriptor remoteFile) {
        String fileName = remoteFile.fileName() == null ? "" : remoteFile.fileName().toLowerCase();
        if (fileName.endsWith(".pdf")) {
            return Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.next.pdf");
        }
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
            return Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.next.jpg");
        }
        return null;
    }

    private String createMapSyncToken() {
        return PLANT_MAP_TOKEN_PREFIX + System.currentTimeMillis();
    }

    private String extractMapSyncToken(WorkAreaMapShape marker) {
        if (marker == null || marker.getLabel() == null || marker.getLabel().isBlank()) {
            return null;
        }
        return marker.getLabel().startsWith(PLANT_MAP_TOKEN_PREFIX) ? marker.getLabel() : null;
    }

    private String buildMapImageUrl(String mapSyncToken) {
        String path = filesRelativePath + "/jpg/work-area-map/plant-map.jpg";
        if (mapSyncToken == null || mapSyncToken.isBlank()) {
            return path;
        }
        return path + "?v=" + mapSyncToken;
    }

    private Path getMapSyncTokenFile() {
        return Paths.get(filesRootPath, "jpg", "work-area-map", ".plant-map-sync-token");
    }

    private void persistLocalMapSyncToken(String mapSyncToken) {
        if (mapSyncToken == null || mapSyncToken.isBlank()) {
            return;
        }
        try {
            Path tokenFile = getMapSyncTokenFile();
            Files.createDirectories(tokenFile.getParent());
            Files.writeString(tokenFile, mapSyncToken, StandardCharsets.UTF_8);
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to persist work-area map sync token locally: {}", e.getMessage());
        }
    }

    private String readLocalMapSyncToken() {
        Path tokenFile = getMapSyncTokenFile();
        if (!Files.exists(tokenFile)) {
            return null;
        }
        try {
            return Files.readString(tokenFile, StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to read work-area map sync token locally: {}", e.getMessage());
            return null;
        }
    }

    private void deleteLocalMapFiles(Path jpgPath, Path pdfPath) {
        try {
            Files.deleteIfExists(jpgPath);
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to delete stale work-area JPG map: {}", e.getMessage());
        }
        try {
            Files.deleteIfExists(pdfPath);
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to delete stale work-area PDF map: {}", e.getMessage());
        }
    }

    private boolean promoteTempMapFiles() {
        Path tempJpgPath = Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.next.jpg");
        Path tempPdfPath = Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.next.pdf");
        Path jpgPath = Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.jpg");
        Path pdfPath = Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.pdf");

        if (!Files.exists(tempJpgPath)) {
            return false;
        }

        try {
            Files.createDirectories(jpgPath.getParent());
            Files.move(tempJpgPath, jpgPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            if (Files.exists(tempPdfPath)) {
                Files.createDirectories(pdfPath.getParent());
                Files.move(tempPdfPath, pdfPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(NgWorkAreaService.class)
                    .warn("Failed to promote refreshed work-area map files: {}", e.getMessage());
            return false;
        }
    }

    private void clearTempMapFiles() {
        try {
            Files.deleteIfExists(Paths.get(filesRootPath, "jpg", "work-area-map", "plant-map.next.jpg"));
        } catch (IOException ignored) {
        }
        try {
            Files.deleteIfExists(Paths.get(filesRootPath, "pdf", "work-area-map", "plant-map.next.pdf"));
        } catch (IOException ignored) {
        }
    }
}
