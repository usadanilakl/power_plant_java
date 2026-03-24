package com.dk_power.power_plant_java.sevice.angular.engraver;

import com.dk_power.power_plant_java.dto.engraver.EngraverTemplateDto;
import com.dk_power.power_plant_java.entities.engraver.EngraverTemplate;
import com.dk_power.power_plant_java.mappers.engraver.EngraverTemplateMapper;
import com.dk_power.power_plant_java.repository.engraver.EngraverTemplateRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.sync.ManagedEntityFileSyncService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgEngraverTemplateService implements NgCrudService<EngraverTemplate, EngraverTemplateDto, EngraverTemplateRepo, EngraverTemplateMapper> {
    private final EngraverTemplateRepo repo;
    private final EngraverTemplateMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ManagedEntityFileSyncService managedEntityFileSyncService;

    public static final String ENGRAVER_TEMPLATE_ENTITY_TYPE = "EngraverTemplate";

    @Value("${engraver.data.path:engraver_data}")
    private String engraverDataPath;

    @Override public EngraverTemplateRepo getRepo() { return repo; }
    @Override public EngraverTemplateMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public EngraverTemplateDto getDto() { return new EngraverTemplateDto(); }
    @Override public EngraverTemplate getEntity() { return new EngraverTemplate(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<EngraverTemplate> getEntityClass() { return EngraverTemplate.class; }

    @Override
    public List<EngraverTemplateDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public EngraverTemplateDto createTemplate(EngraverTemplateDto dto) {
        EngraverTemplate entity = mapper.convertToEntity(dto);
        EngraverTemplate saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public EngraverTemplateDto updateTemplate(String id, EngraverTemplateDto dto) {
        dto.setId(Long.parseLong(id));
        EngraverTemplate entity = mapper.convertToEntity(dto);
        EngraverTemplate saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public EngraverTemplateDto getTemplateById(String id) {
        EngraverTemplate entity = getEntityById(id);
        return mapper.convertToDto(entity);
    }

    public List<EngraverTemplateDto> findByTagSizeAndDataStructure(String tagSize, String dataStructure) {
        return repo.findByTagSizeAndDataStructure(tagSize, dataStructure)
                .stream().map(mapper::convertToDto).toList();
    }

    public List<EngraverTemplateDto> findByTagSize(String tagSize) {
        return repo.findByTagSize(tagSize)
                .stream().map(mapper::convertToDto).toList();
    }

    /**
     * Scans the engraverDataPath directory for .lbrn2 files and creates
     * EngraverTemplate entities for any that don't already have a matching entity.
     * Only runs if no templates exist in the database.
     *
     * Filename convention examples:
     *   "4-tags-text-only 2x1.lbrn2" -> batchSize=4, tagSize="2x1", dataStructure="standard"
     *   "2-tags-with-qr 2x3.lbrn2"  -> batchSize=2, tagSize="2x3", dataStructure="standard"
     *   "2-tags-text-only 2x3.lbrn2" -> batchSize=2, tagSize="2x3", dataStructure="standard"
     */
    public void seedFromExistingFiles() {
        if (!repo.findAll().isEmpty()) {
            log.info("EngraverTemplate table already has entries, skipping seed.");
            return;
        }

        File dir = new File(engraverDataPath);
        if (!dir.exists() || !dir.isDirectory()) {
            log.warn("Engraver data path does not exist or is not a directory: {}", engraverDataPath);
            return;
        }

        File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".lbrn2"));
        if (files == null || files.length == 0) {
            log.info("No .lbrn2 files found in {}", engraverDataPath);
            return;
        }

        Pattern batchPattern = Pattern.compile("^(\\d+)-");
        Pattern tagSizePattern = Pattern.compile("(\\d+x\\d+)");

        for (File file : files) {
            String filename = file.getName();
            String nameWithoutExt = filename.replace(".lbrn2", "");

            EngraverTemplate template = new EngraverTemplate();
            template.setFilename(filename);
            template.setName(nameWithoutExt);
            template.setDataStructure("standard");
            template.setIsDefault(false);
            template.setWithQr(filename.toLowerCase().contains("with-qr"));

            // Parse batch size from leading number
            Matcher batchMatcher = batchPattern.matcher(filename);
            if (batchMatcher.find()) {
                template.setBatchSize(Integer.parseInt(batchMatcher.group(1)));
            } else {
                template.setBatchSize(1);
            }

            // Parse tag size (e.g. "2x3", "2x1")
            Matcher tagSizeMatcher = tagSizePattern.matcher(filename);
            if (tagSizeMatcher.find()) {
                template.setTagSize(tagSizeMatcher.group(1));
            }

            repo.save(template);
            log.info("Seeded EngraverTemplate from file: {}", filename);
        }
    }

    public String getEngraverDataPath() {
        return engraverDataPath;
    }

    public List<String> getAvailableTemplateFilenames() {
        return repo.findAll().stream()
                .map(EngraverTemplate::getFilename)
                .filter(filename -> filename != null && !filename.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public Path resolveTemplatePath(String filename) throws IOException {
        Path dataDir = Paths.get(engraverDataPath).toAbsolutePath();
        Files.createDirectories(dataDir);
        return dataDir.resolve(filename);
    }

    public void syncTemplateFile(Long templateId, Path templatePath) throws IOException {
        managedEntityFileSyncService.replaceTrackedFiles(
                ENGRAVER_TEMPLATE_ENTITY_TYPE,
                templateId,
                List.of(templatePath));
    }

    public Path ensureTemplateFileAvailable(String filename) throws IOException {
        Path localPath = resolveTemplatePath(filename);
        if (Files.exists(localPath)) {
            return localPath;
        }

        EngraverTemplate template = repo.findFirstByFilename(filename).orElse(null);
        if (template == null || template.getId() == null) {
            throw new IOException("Template metadata not found for file: " + filename);
        }

        managedEntityFileSyncService.downloadEntityFiles(
                ENGRAVER_TEMPLATE_ENTITY_TYPE,
                template.getId(),
                remoteFile -> filename.equals(remoteFile.fileName()) ? localPath : null);

        if (!Files.exists(localPath)) {
            throw new IOException("Template file not available locally or via sync: " + filename);
        }

        return localPath;
    }

    public void deleteTemplate(String id) {
        EngraverTemplate entity = getEntityById(id);
        if (entity == null) {
            return;
        }
        managedEntityFileSyncService.deleteTrackedFiles(ENGRAVER_TEMPLATE_ENTITY_TYPE, entity.getId());
        softDelete(entity);
    }
}
