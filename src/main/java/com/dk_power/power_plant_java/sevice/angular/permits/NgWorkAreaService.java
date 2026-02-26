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

    @org.springframework.beans.factory.annotation.Value("${files.root.path}")
    private String filesRootPath;
    @org.springframework.beans.factory.annotation.Value("${files.relative.path}")
    private String filesRelativePath;

    private static final String PLANT_MAP_MARKER = "__PLANT_MAP__";

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
        gitHubPublisher.publishAll();
        return workAreaMapper.convertShapeToDto(saved);
    }

    public List<WorkAreaMapShapeDto> getAllShapes() {
        return shapeRepo.findAll().stream()
                .map(workAreaMapper::convertShapeToDto)
                .collect(Collectors.toList());
    }

    public void deleteShape(Long id) {
        shapeRepo.findById(id).ifPresent(shape -> {
            shape.setDeleted(true);
            shapeRepo.save(shape);
        });
        gitHubPublisher.publishAll();
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
        shapeRepo.save(marker);

        gitHubPublisher.publishAll();
        return fileLink;
    }

    public String getMapImagePath() {
        WorkAreaMapShape marker = shapeRepo.findByName(PLANT_MAP_MARKER);
        if (marker != null && marker.getCoordinates() != null) {
            return marker.getCoordinates();
        }
        return null;
    }
}
