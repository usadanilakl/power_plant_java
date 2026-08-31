package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.angular.file.upload.UploadStrategy;
import com.dk_power.power_plant_java.sevice.angular.file.upload.UploadStrategyRegistry;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.file.TrashService;
import com.dk_power.power_plant_java.util.FileUtil;
import com.dk_power.power_plant_java.util.PerceptualHashUtil;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NgFileService implements NgCrudService<FileObject, FileDto, FileRepo, FileMapper> {
    private final FileRepo fileRepo;
    private final FileMapper fileMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final NgEquipmentService equipmentService;
    private final Logger logger = LoggerFactory.getLogger(NgFileService.class);
    private final MeterRegistry meterRegistry;
    private final ExcelReaderService excelReaderService;
    private final NgValueService valueService;
    
    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final TrashService trashService;
    private final UploadStrategyRegistry uploadStrategyRegistry;
    // Field injection (not constructor) so we can use @Lazy — FileObjectSyncHandler
    // pulls in HubFileService which pulls file services back through the sync
    // chain. Lombok's @RequiredArgsConstructor does NOT copy @Lazy onto the
    // generated constructor parameter (no lombok.config copyableAnnotations
    // in this repo), so constructor-injected @Lazy silently didn't work.
    // Field-injected @Lazy is the pattern used by NgFileCloneService for the
    // same dep — same rationale.
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler fileObjectSyncHandler;

    @Value("${files.root.path}")
    String filesRootPath;
    @Value("${files.relative.path}")
    String filesRelativePath;
    @Value("${project.root}")
    String projectRootPath;

    /**
     * Resolve a path that includes a baseLink prefix (e.g., "uploads/jpg/PID/vendor/file.jpg")
     * to the actual filesystem path using the profile-specific filesRootPath.
     * Strips the first path component (baseLink) and resolves the remainder against filesRootPath.
     */
    /**
     * Compute the SHA-256 of a FileObject's canonical source file on disk.
     * The "canonical source" is the file at {@code fileObject.getExtension()} —
     * i.e. for a PDF upload that's the pdf, for a direct png upload that's the png.
     * Must be called AFTER {@link #applyUploadResult} has populated the extension.
     *
     * Returns null if the source file can't be read — callers should still save the
     * entity; the hash will be filled in next time the file is (re)uploaded.
     */
    private String computeSourceHash(FileObject fileObject) {
        return computeSourceHashDiagnostic(fileObject, null);
    }

    /**
     * Same as {@link #computeSourceHash} but optionally writes the skip reason
     * to {@code reasonOut} (length-1 array) so the backfill can categorize misses.
     * Reasons: "no-extension", "no-filelink", "missing-on-disk", "io-error".
     */
    private String computeSourceHashDiagnostic(FileObject fileObject, String[] reasonOut) {
        try {
            String sourceExt = fileObject.getExtension();
            if (sourceExt == null || sourceExt.isBlank()) {
                if (reasonOut != null) reasonOut[0] = "no-extension";
                return null;
            }
            String sourceLink = fileObject.buildFileLink(sourceExt);
            if (sourceLink == null) {
                if (reasonOut != null) reasonOut[0] = "no-filelink";
                return null;
            }
            Path sourcePath = resolveToFileSystem(sourceLink);
            if (!Files.exists(sourcePath)) {
                if (reasonOut != null) reasonOut[0] = "missing-on-disk:" + sourcePath;
                return null;
            }
            return computeSha256(Files.readAllBytes(sourcePath));
        } catch (IOException e) {
            if (reasonOut != null) reasonOut[0] = "io-error:" + e.getMessage();
            logger.warn("Failed to compute source hash for FileObject #{}: {}",
                    fileObject.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Compute the aHash perceptual hash of the file's visual content.
     * For raster files: hashes the file directly. For PDFs: hashes the first
     * page's generated JPG (only available when the pdf-split strategy ran).
     * Returns null when no visual rendering is available (e.g. xlsx, docx, stl).
     */
    private String computePerceptualHash(FileObject fileObject) {
        try {
            String ext = fileObject.getExtension();
            if (ext == null) return null;
            String lower = ext.toLowerCase();

            // Image file: hash directly
            if (isRasterExtension(lower)) {
                Path p = resolveToFileSystem(fileObject.buildFileLink(lower));
                if (p != null && Files.exists(p)) {
                    return PerceptualHashUtil.computeHash(p.toFile());
                }
            }

            // PDF: hash the first-page JPG if it exists (pdf-split strategy generated it)
            if ("pdf".equals(lower)) {
                String jpgLink = fileObject.buildFileLink("jpg");
                if (jpgLink != null) {
                    Path jpg = resolveToFileSystem(jpgLink);
                    if (Files.exists(jpg)) {
                        return PerceptualHashUtil.computeHash(jpg.toFile());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to compute perceptual hash for FileObject #{}: {}",
                    fileObject.getId(), e.getMessage());
        }
        return null;
    }

    private boolean isRasterExtension(String ext) {
        return "png".equals(ext) || "jpg".equals(ext) || "jpeg".equals(ext)
                || "tif".equals(ext) || "tiff".equals(ext) || "bmp".equals(ext)
                || "gif".equals(ext) || "webp".equals(ext);
    }

    /**
     * Decide whether to split + convert a PDF upload to JPG.
     * Precedence: explicit param > fileType.convertToJpg > true (legacy default).
     */
    private boolean resolveConvertToJpg(Boolean explicit, com.dk_power.power_plant_java.entities.categories.Value fileType) {
        if (explicit != null) return explicit;
        if (fileType != null && fileType.getConvertToJpg() != null) return fileType.getConvertToJpg();
        return true;
    }

    /**
     * Decide whether to split a multi-page PDF upload into one FileObject per page.
     * Precedence: explicit param > fileType.convertToJpg (historical proxy) > true.
     *
     * Historically split was implicit in {@code convertToJpg} — this fallback keeps
     * that behavior for callers that don't pass an explicit split flag.
     */
    private boolean resolveSplitMultiPage(Boolean explicit, com.dk_power.power_plant_java.entities.categories.Value fileType) {
        if (explicit != null) return explicit;
        if (fileType != null && fileType.getConvertToJpg() != null) return fileType.getConvertToJpg();
        return true;
    }

    /**
     * SHA-256 hex of the given bytes. Used to set {@code FileObject.fileHash}
     * on the canonical source file so sync can detect content changes.
     */
    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private Path resolveToFileSystem(String pathWithBaseLink) {
        String normalized = pathWithBaseLink.replace("\\", "/");
        int firstSlash = normalized.indexOf('/');
        if (firstSlash >= 0) {
            String relativePart = normalized.substring(firstSlash + 1);
            return Paths.get(filesRootPath).resolve(relativePart);
        }
        return Paths.get(filesRootPath).resolve(pathWithBaseLink);
    }

    @Override
    public FileObject getEntity() {
        return new FileObject();
    }

    @Override
    public FileDto getDto() {
        return new FileDto();
    }

    @Override
    public FileRepo getRepo() {
        return this.fileRepo;
    }

    @Override
    public FileMapper getMapper() {
        return this.fileMapper;
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<FileObject> getEntityClass() {
        return FileObject.class;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public FileDto toDto(FileObject entity) {
        return fileMapper.convertToDto(entity);
    }

    public FileDto toDtoLight(FileObject entity) {
        return fileMapper.convertToDtoLight(entity);
    }

    /**
     * Search + map to light DTOs inside one @Transactional so the new @ManyToMany
     * `systems` and `tags` collections can be initialized lazily without throwing.
     * The controller's prior pattern — query in service, .map(toDtoLight) in controller
     * — runs the map outside the query's transaction, which breaks lazy access.
     *
     * Forces collection initialization (one batched query per collection per page,
     * thanks to @BatchSize=50) so the subsequent convertToDtoLight access is a no-op
     * read instead of a session-less proxy load.
     */
    @Transactional(readOnly = true)
    public Page<FileDto> searchAsLightDto(SearchCriteria criteria, Pageable pageable, boolean andLogicEnabled) {
        Page<FileObject> page = complexSearchWithPagination(fileRepo, criteria, pageable, andLogicEnabled);
        for (FileObject f : page.getContent()) {
            if (f.getSystems() != null) f.getSystems().size();
            if (f.getTags() != null) f.getTags().size();
        }
        return page.map(this::toDtoLight);
    }

    /**
     * Get files by search criteria for export.
     * Uses the complex search without pagination to get all matching results.
     */
    public List<FileObject> getBySearchCriteria(SearchCriteria criteria) {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        boolean andLogicEnabled = criteria.getColumnFilterLogic() == null ||
                !criteria.getColumnFilterLogic().values().stream().anyMatch("OR"::equalsIgnoreCase);
        Page<FileObject> results = complexSearchWithPagination(fileRepo, criteria, pageable, andLogicEnabled);
        return results.getContent();
    }

    /**
     * Get files by list of IDs for export.
     */
    public List<FileObject> getByIds(List<Long> ids) {
        return fileRepo.findAllById(ids);
    }

    /**
     * Paginated load for the initial file table. Uses {@code fileRepo.findAll}
     * (full managed entities) rather than the projection-based path so the new
     * @ManyToMany {@code systems} / {@code tags} collections actually have lazy
     * proxies that can be initialized — projection-built FileObjects come from
     * tuple constructors and only carry default empty HashSets, so a .size()
     * touch would not trigger any load. Mapping runs inside this @Transactional
     * method so the lazy access succeeds.
     *
     * <p>Uses {@code toDtoLight} (not {@code toDto}) so the response omits the
     * heavy {@code points} (EquipmentDto[]) / {@code highlights} / {@code heatTraceList}
     * arrays. List/table views don't need them; the form fetches the full DTO
     * via {@code /ng/files/{id}} on edit. Roughly 5–10× smaller payload per row.
     */
    public Page<FileDto> findAllPaginatedAsDto(Pageable pageable) {
        Page<FileObject> entities = fileRepo.findAll(pageable);
        for (FileObject f : entities.getContent()) {
            if (f.getSystems() != null) f.getSystems().size();
            if (f.getTags() != null) f.getTags().size();
        }
        return entities.map(this::toDtoLight);
    }

    public Page<FileDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("fileNumber", searchString);
        searchCriteria.put("name", searchString);
        searchCriteria.put("fileType.name", searchString);
        searchCriteria.put("vendor.name", searchString);
        searchCriteria.put("relatedSystems", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        Sort.Direction direction = Sort.Direction.fromString("asc");
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "fileNumber"));
        Page<FileObject> itemsPage = complexSearchWithPagination(getRepo(), sc, pageable, false);
        // Pre-init the new @ManyToMany collections so toDtoLight emits them.
        // The class-level @Transactional keeps the session open during mapping;
        // without these touches the mapper's isInitialized guard skips them and
        // global search results lose Systems/Tags in the table.
        for (FileObject f : itemsPage.getContent()) {
            if (f.getSystems() != null) f.getSystems().size();
            if (f.getTags() != null) f.getTags().size();
        }
        return itemsPage.map(this::toDtoLight);
    }

    public Optional<FileDto> findDtoById(Long id) {
        Optional<FileObject> byId = fileRepo.findById(id);
        // Force-init the new @ManyToMany collections within the open session.
        // The mapper's Hibernate.isInitialized guard would otherwise skip them
        // (returning null in the DTO, which the frontend treats as "leave alone")
        // and the form would never display the saved systems/tags.
        byId.ifPresent(f -> {
            if (f.getSystems() != null) f.getSystems().size();
            if (f.getTags() != null) f.getTags().size();
        });
        return byId.map(this::toDto);
    }

    private FileObject getFileByNumber(String fileNumber) {
        return fileRepo.findFirstByFileNumberOrderByIdAsc(fileNumber);
    }

    public FileDto findByFileLink(String imageUrl) {
        // Remove "http://localhost:port/" if present
        String url = imageUrl.trim().replaceFirst("^(https?://localhost(:\\d+)?)/", "");
        FileObject byFileLink = fileRepo.findFirstByFileLinkOrderByIdAsc(url);
        if (byFileLink == null) throw new RuntimeException("File not found for link: " + imageUrl);
        // Now use the cleaned url to find the FileObject
        return this.toDto(byFileLink);
    }

    public String uploadFile(MultipartFile file, String fileLink, boolean override) throws IOException {
        Path path = resolveToFileSystem(fileLink);
        return FileUtil.uploadFileToLocal(file, path.toString(), override);
    }

    public String uploadFile(File file, String fileLink, boolean override) throws IOException {
        Path path = resolveToFileSystem(fileLink);
        return FileUtil.uploadFileToLocal(file, path.toString(), override);
    }

    public FileDto create(FileIdDto fileDto) {
        meterRegistry.counter("files.createdDto").increment();
        FileObject entity = convertIdDtoToEntity(fileDto);
        String extension = FileUtil.getFileExtension(entity.getFileLink());
        entity.setBaseLink(filesRelativePath);
        entity.setExtension(extension);
        String folder = entity.buildFolder();
        String fileLink = entity.buildFileLink();
        return toDto(save(entity));
    }

    @Override
    public FileObject create(FileDto dto) {
        meterRegistry.counter("files.createdEntity").increment();
        FileObject entity = toEntity(dto);
        String extension = FileUtil.getFileExtension(entity.getFileLink());
        entity.setBaseLink(filesRelativePath);
        entity.setExtension(extension);
        String folder = entity.buildFolder();
        String fileLink = entity.buildFileLink();
        return save(entity);
    }

    public List<FileDto> processPidFile(FileIdDto fileDto, MultipartFile file, boolean override) throws IOException {
        return processPidFile(fileDto, file, override, null, null);
    }

    /** Legacy 4-arg overload: split follows convertToJpg. */
    public List<FileDto> processPidFile(FileIdDto fileDto, MultipartFile file, boolean override, Boolean convertToJpg) throws IOException {
        return processPidFile(fileDto, file, override, convertToJpg, null);
    }

    /**
     * @param convertToJpg   explicit override for PDF→JPG conversion. {@code null}
     *                       falls back to the fileType's {@code convertToJpg} policy
     *                       (and ultimately to {@code true} for backwards compat).
     * @param splitMultiPage explicit override for splitting multi-page PDFs into one
     *                       FileObject per page. {@code null} falls back to fileType
     *                       policy — historically the same field as convertToJpg.
     */
    public List<FileDto> processPidFile(FileIdDto fileDto, MultipartFile file, boolean override,
                                        Boolean convertToJpg, Boolean splitMultiPage) throws IOException {

        if (file == null) throw new RuntimeException("File is required");

        String originalFilename = file.getOriginalFilename();
        String fileNumber = fileMapper.convertFileNumberArrayToString(fileDto.getFileNumber());
        if (originalFilename == null) {
            throw new RuntimeException("Original filename is null");
        }
        String fileExtension = FileUtil.getFileExtension(originalFilename).toLowerCase();
        uploadStrategyRegistry.validate(fileExtension);

        // Hash the ORIGINAL uploaded bytes here, before any strategy/PdfBox processing.
        // PdfBox re-writes PDFs when it splits pages, producing different bytes each run —
        // hashing the post-strategy disk file would mean uploading the same source twice
        // produces different fileHash values, breaking duplicate detection.
        String originalSourceHash = computeSha256(file.getBytes());

        String baseName = fileNumber != null && !fileNumber.isEmpty() ? fileNumber : originalFilename;

        // Revise branch: snapshot the pre-existing entity's OLD identifiers BEFORE
        // convertIdDtoToEntity mutates the managed instance in place. We need the OLD
        // fileNumber/type/vendor to (a) locate current on-disk siblings, (b) relocate them
        // if the user renamed on the same submission, and (c) build an UploadTarget whose
        // target path already contains the current file — so FileUtil's -revN collision
        // suffix fires instead of silently orphaning the old file.
        boolean isRevise = !override && fileDto.getId() != null && fileDto.getId() != 0;
        String oldBaseName = null;
        String oldFileTypeName = null;
        String oldVendorName = null;
        if (isRevise) {
            FileObject preExisting = fileRepo.findById(fileDto.getId()).orElse(null);
            if (preExisting != null) {
                oldBaseName = stripRevSuffix(preExisting.getFileNumber());
                oldFileTypeName = preExisting.getFileType() != null ? preExisting.getFileType().getName() : null;
                oldVendorName = preExisting.getVendor() != null ? preExisting.getVendor().getName() : null;
            } else {
                isRevise = false;
            }
        }

        // Template entity carries the target metadata (fileType, vendor, name, etc.)
        FileObject template = convertIdDtoToEntity(fileDto);
        template.setBaseLink(filesRelativePath);

        if (template.getFileType() == null || template.getVendor() == null) {
            throw new RuntimeException("fileType and vendor are required");
        }

        // For revise: strip any -revN off the incoming/existing base name and, if the
        // user also renamed/re-typed/re-vendored on the same submission, move the whole
        // sibling group (X.pdf + X-rev1.pdf + …) to the new location BEFORE writing the
        // new bytes. Then the strategy's -revN detector finds the moved siblings and
        // increments correctly instead of orphaning them at the old path.
        //
        // Also mutates template.fileNumber to the stripped base name so applyUploadResult's
        // later setFileNumber("X-revK") produces "X-revK" — not the cascading "X-rev1-revK".
        String targetBaseName = baseName;
        if (isRevise) {
            String newBase = stripRevSuffix(template.getFileNumber());
            String newType = template.getFileType().getName();
            String newVendor = template.getVendor().getName();
            boolean identifiersChanged = !Objects.equals(oldBaseName, newBase)
                    || !Objects.equals(oldFileTypeName, newType)
                    || !Objects.equals(oldVendorName, newVendor);
            if (identifiersChanged) {
                relocateSiblingsForRevise(oldBaseName, oldFileTypeName, oldVendorName, template, newBase);
            }
            template.setFileNumber(newBase);
            targetBaseName = newBase;
        }

        UploadStrategy.UploadTarget target = new UploadStrategy.UploadTarget(
                targetBaseName,
                template.getFileType().getName(),
                template.getVendor().getName(),
                resolveConvertToJpg(convertToJpg, template.getFileType()),
                resolveSplitMultiPage(splitMultiPage, template.getFileType())
        );
        UploadStrategy strategy = uploadStrategyRegistry.get(fileExtension);
        List<UploadStrategy.UploadedFile> uploaded = strategy.upload(file, target, override);

        List<FileDto> fileDtos = new ArrayList<>();
        if (uploaded.size() == 1) {
            UploadStrategy.UploadedFile u = uploaded.get(0);
            applyUploadResult(template, u);
            template.setFileHash(originalSourceHash);
            template.setPerceptualHash(computePerceptualHash(template));
            fileDtos.add(toDto(save(template)));
        } else {
            for (UploadStrategy.UploadedFile u : uploaded) {
                FileObject newFile = new FileObject();
                newFile.setName(template.getName());
                newFile.setFileType(template.getFileType());
                newFile.setVendor(template.getVendor());
                newFile.setSystem(template.getSystem());
                newFile.setBaseLink(filesRelativePath);
                applyUploadResult(newFile, u);
                newFile.setFileHash(originalSourceHash);
                newFile.setPerceptualHash(computePerceptualHash(newFile));
                fileDtos.add(toDto(save(newFile)));
            }
        }
        return fileDtos;
    }

    /**
     * Apply the on-disk outcome of an upload to a FileObject: sets fileNumber,
     * primary extension, all extensions, folder, and fileLink.
     *
     * The {@code extensions} CSV is REPLACED with the upload's authoritative list
     * (not merged). This prevents stale formats from a previous upload leaking
     * through — e.g. overriding an old PDF with a PNG must not leave "pdf,jpg,png"
     * in the field, otherwise {@link FileObject#getFileLink()} would still resolve
     * to the old pdf path.
     */
    private void applyUploadResult(FileObject fileObject, UploadStrategy.UploadedFile uploaded) {
        fileObject.setFileNumber(uploaded.fileNumber());
        fileObject.setExtension(uploaded.sourceExtension());
        fileObject.setExtensions(String.join(",", uploaded.allExtensions()));
        fileObject.buildFolder();
        fileObject.buildFileLink();
    }

    /** Strip a trailing "-revN" (any digits) so we can re-derive the base identity. */
    private static String stripRevSuffix(String name) {
        if (name == null) return null;
        return name.replaceFirst("-rev\\d+$", "");
    }

    /**
     * Revise-branch helper: relocate the existing on-disk sibling group ({@code X.pdf,
     * X-rev1.pdf, X-rev1.jpg, …}) from the OLD (fileType, vendor, baseName) folder to
     * the NEW folder, renaming each to {@code newBaseName} while preserving that
     * file's {@code -revN} suffix and extension. Used when the user renames / re-types
     * / re-vendors on the same submission as a revise, so the strategy's {@code -revN}
     * collision suffix fires at the NEW path (instead of writing the new bytes
     * unversioned at an empty new path and orphaning the old file).
     */
    private void relocateSiblingsForRevise(String oldBaseName,
                                           String oldFileTypeName,
                                           String oldVendorName,
                                           FileObject newEntity,
                                           String newBaseName) throws IOException {
        if (oldBaseName == null || oldFileTypeName == null || oldVendorName == null) return;
        // Build a lightweight lookup entity that mirrors the OLD on-disk layout.
        // Using the passed newEntity would already be mutated to the new type/vendor,
        // so we can't reuse getFilesWithAllExtensions(newEntity) here.
        List<String> exts = newEntity.getExtensionsArray();
        if (exts.isEmpty() && newEntity.getExtension() != null && !newEntity.getExtension().isEmpty()) {
            exts = List.of(newEntity.getExtension());
        }
        for (String ext : exts) {
            // OLD folder path built from OLD identifiers.
            Path oldFolder = Paths.get(filesRootPath,
                    newEntity.getBaseLink() + "/" + ext + "/" + oldFileTypeName + "/" + oldVendorName);
            if (!Files.exists(oldFolder)) continue;
            List<File> siblings = FileUtil.getRevisionsByFileNumber(oldBaseName, oldFolder.toString());
            for (File oldFile : siblings) {
                String newName = FileUtil.renameFileWithRevisions(oldFile, newBaseName);
                Path newPath = Paths.get(filesRootPath, newEntity.buildRelativeFolder(ext)).resolve(newName);
                logger.info("Revise-relocate: {} -> {}", oldFile.toPath(), newPath);
                FileUtil.moveFileAndCleanup(oldFile.toPath(), newPath);
            }
        }
    }

    /**
     * Process multiple files at once. All files share the same fileType and vendor.
     * File number is derived from each original filename (without extension). File
     * name uses {@code sharedFileName} if provided, otherwise the original filename.
     *
     * Accepts any extension on the whitelist; per-file handling is dispatched via
     * {@link UploadStrategyRegistry} — PDFs go through the page-split strategy,
     * everything else through direct upload.
     */
    public List<FileDto> processMultipleFiles(List<MultipartFile> files, Long fileTypeId, Long vendorId, String sharedFileName) throws IOException {
        return processMultipleFiles(files, fileTypeId, vendorId, sharedFileName, null, null);
    }

    /** Legacy 5-arg overload: split follows convertToJpg. */
    public List<FileDto> processMultipleFiles(List<MultipartFile> files, Long fileTypeId, Long vendorId, String sharedFileName, Boolean convertToJpg) throws IOException {
        return processMultipleFiles(files, fileTypeId, vendorId, sharedFileName, convertToJpg, null);
    }

    public List<FileDto> processMultipleFiles(List<MultipartFile> files, Long fileTypeId, Long vendorId, String sharedFileName, Boolean convertToJpg, Boolean splitMultiPage) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new RuntimeException("No files provided");
        }

        var fileType = valueRepo.findById(fileTypeId)
                .orElseThrow(() -> new RuntimeException("File type not found with id: " + fileTypeId));
        var vendor = valueRepo.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + vendorId));

        boolean useSharedName = sharedFileName != null && !sharedFileName.trim().isEmpty();
        String effectiveSharedName = useSharedName ? sharedFileName.trim() : null;
        boolean effectiveConvertToJpg = resolveConvertToJpg(convertToJpg, fileType);
        boolean effectiveSplitMultiPage = resolveSplitMultiPage(splitMultiPage, fileType);

        List<FileDto> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                logger.warn("Skipping file with null filename");
                continue;
            }

            String extension = FileUtil.getFileExtension(originalFilename).toLowerCase();
            uploadStrategyRegistry.validate(extension);

            // Hash original input bytes (before any PdfBox processing that rewrites the file).
            String originalSourceHash = computeSha256(file.getBytes());

            String fileNameWithoutExtension = FileUtil.getNameFromPathWithoutExtension(originalFilename);
            String effectiveName = useSharedName ? effectiveSharedName : fileNameWithoutExtension;

            UploadStrategy.UploadTarget target = new UploadStrategy.UploadTarget(
                    fileNameWithoutExtension,
                    fileType.getName(),
                    vendor.getName(),
                    effectiveConvertToJpg,
                    effectiveSplitMultiPage
            );
            UploadStrategy strategy = uploadStrategyRegistry.get(extension);
            List<UploadStrategy.UploadedFile> uploaded = strategy.upload(file, target, false);

            if (uploaded.size() == 1) {
                FileObject fileObject = new FileObject();
                fileObject.setName(effectiveName);
                fileObject.setFileType(fileType);
                fileObject.setVendor(vendor);
                fileObject.setBaseLink(filesRelativePath);
                applyUploadResult(fileObject, uploaded.get(0));
                fileObject.setFileHash(originalSourceHash);
                fileObject.setPerceptualHash(computePerceptualHash(fileObject));
                uploadedFiles.add(toDto(save(fileObject)));
            } else {
                for (UploadStrategy.UploadedFile u : uploaded) {
                    FileObject newFile = new FileObject();
                    // Honor sharedFileName for every split page, not just single-page uploads
                    newFile.setName(effectiveName);
                    newFile.setFileType(fileType);
                    newFile.setVendor(vendor);
                    newFile.setBaseLink(filesRelativePath);
                    applyUploadResult(newFile, u);
                    newFile.setFileHash(originalSourceHash);
                    newFile.setPerceptualHash(computePerceptualHash(newFile));
                    uploadedFiles.add(toDto(save(newFile)));
                }
            }

            logger.info("Processed file: {} -> {} file objects", originalFilename, uploaded.size());
        }

        logger.info("Multi-upload completed: {} files uploaded, {} file objects created",
                files.size(), uploadedFiles.size());
        return uploadedFiles;
    }

    /** @deprecated use {@link #processMultipleFiles(List, Long, Long, String)} — kept for source compat. */
    @Deprecated
    public List<FileDto> processMultiplePdfFiles(List<MultipartFile> files, Long fileTypeId, Long vendorId, String sharedFileName) throws IOException {
        return processMultipleFiles(files, fileTypeId, vendorId, sharedFileName);
    }

    public FileDto updateFileObject(FileIdDto file) {
        if (file.getId() == null || file.getId() == 0) throw new RuntimeException("Id is required");

        FileObject oldEntity = getEntityById(file.getId());
        String oldFileNumber = oldEntity.getFileNumber();
        String oldFileType = oldEntity.getFileType().getName();
        String oldVendor = oldEntity.getVendor().getName();
        String oldExtensions = oldEntity.getExtensions();
        String oldExtension = oldEntity.getExtension();
        String oldBaseLink = oldEntity.getBaseLink();

        List<File> extensionFiles = getFilesWithAllExtensions(oldEntity);

        // convertIdDtoToEntity loads the SAME managed entity and mutates it in place
        FileObject updatedEntity = convertIdDtoToEntity(file);
        updatedEntity.buildFileLink();

        logger.info("updateFileObject: old=[number={}, type={}, vendor={}] new=[number={}, type={}, vendor={}] filesFound={}",
                oldFileNumber, oldFileType, oldVendor,
                updatedEntity.getFileNumber(),
                updatedEntity.getFileType() != null ? updatedEntity.getFileType().getName() : "null",
                updatedEntity.getVendor() != null ? updatedEntity.getVendor().getName() : "null",
                extensionFiles.size());

        // Check if relevant fields have changed
        boolean needsFileUpdate = !oldFileNumber.equals(updatedEntity.getFileNumber()) ||
                !oldFileType.equals(updatedEntity.getFileType().getName()) ||
                !oldVendor.equals(updatedEntity.getVendor().getName());

        if (needsFileUpdate && extensionFiles.isEmpty()) {
            logger.warn("File update needed but no physical files found at old path! " +
                    "extensions={}, extension={}, baseLink={}",
                    oldExtensions, oldExtension, oldBaseLink);
        }

        if (needsFileUpdate) {
            // Move files to new locations
            for (File oldFile : extensionFiles) {
                String extension = FileUtil.getFileExtension(oldFile.getName());
                String name = FileUtil.renameFileWithRevisions(oldFile, updatedEntity.getFileNumber());
                String newPath = Paths.get(filesRootPath, updatedEntity.buildRelativeFolder(extension), name).toString();
                try {
                    logger.info("Moving file: {} -> {}", oldFile.toPath(), newPath);
                    FileUtil.moveFileAndCleanup(oldFile.toPath(), Paths.get(newPath));
                } catch (IOException e) {
                    throw new RuntimeException("Failed to move file: " + oldFile.getName(), e);
                }
            }

            // Update revision files if they exist
//            for (File revisionFile : revisions) {
//                int revisionNumber = FileUtil.extractRevisionNumber(revisionFile.getName());
//                String extension = FileUtil.getFileExtension(revisionFile.getName());
//                String newRevisionPath = Paths.get(projectRootPath, updatedEntity.buildFileLink(extension))
//                        .toString().replace("." + extension, "-rev" + revisionNumber + "." + extension);
//                try {
//                        FileUtil.moveFileAndCleanup(revisionFile.toPath(), Paths.get(newRevisionPath));
//                } catch (IOException e) {
//                    throw new RuntimeException("Failed to move revision file: " + revisionFile.getName(), e);
//                }
//            }
        }

        // Save the updated entity
        FileObject savedEntity = save(updatedEntity);

        return toDto(savedEntity);
    }


    private List<File> getFilesWithAllExtensions(FileObject file) {
        List<File> files = new ArrayList<>();
        List<String> exts = file.getExtensionsArray();
        // Fall back to singular extension field if extensions (plural) is not set
        if (exts.isEmpty() && file.getExtension() != null && !file.getExtension().isEmpty()) {
            exts = List.of(file.getExtension());
        }
        for (String extension : exts) {
            Path folder = Paths.get(filesRootPath, file.buildRelativeFolder(extension));
            if (Files.exists(folder)) {
                files.addAll(FileUtil.getRevisionsByFileNumber(file.getFileNumber(), folder.toString()));
            }
        }
        return files;
    }

    private List<File> getFilesWithAllExtensions(FileDto file) {
        List<File> files = new ArrayList<>();
        for (String extension : file.getExtensions()) {
            Path folder = resolveToFileSystem(file.buildFileLink(extension)).getParent();
            if (Files.exists(folder)) {
                files.addAll(FileUtil.getRevisionsByFileNumber(file.getFileNumberAsString(), folder.toString()));
            }
        }
        return files;
    }

    private List<File> getFilesWithAllExtensions(String link, List<String> extensions) {
        List<File> files = new ArrayList<>();
        for (String extension : extensions) {
            String currentExtension = FileUtil.getFileExtension(link);
            Path folder = resolveToFileSystem(link.replaceAll(currentExtension, extension)).getParent();
            if (Files.exists(folder)) {
                files.addAll(FileUtil.getRevisionsByFileNumber(FileUtil.getNameFromPathWithoutExtension(link), folder.toString()));
            }
        }
        return files;
    }


    public FileObject convertIdDtoToEntity(FileIdDto fileDto) {
        return fileMapper.convertIdDtoToEntity(fileDto);
    }

    public Map<String, Object> checkFileExists(String fileLink) {
        boolean exists = FileUtil.checkFileExists(Paths.get(filesRootPath, fileLink));
        Map<String, Object> result = new HashMap<>();
        result.put("exists", exists);
        result.put("fileLink", fileLink);
        return result;
    }

    @Override
    public FileObject hardDelete(Long id) {
        FileObject file = null;
        try {
            file = deleteRelatedFiles(id);
        } catch (IOException e) {
            e.printStackTrace();
        }
        if (file == null) throw new RuntimeException("Failed to delete related files");
        return NgCrudService.super.softDelete(file);
    }

    public FileObject deleteRelatedFiles(Long id) throws IOException {
        FileObject file = getEntityById(id);
        List<File> filesWithAllExtensions = getFilesWithAllExtensions(file);
        for (File f : filesWithAllExtensions) {
            // Use trash service instead of permanent deletion
            trashService.moveToTrash(f.toPath(), "user");
        }
        return file;
    }


    /**
     * Per-type bulk load for {@code CurrentFileService.loadAllFilesByType} (left
     * menu + file map cache). Uses {@code toDtoLight} so the per-type payload
     * doesn't carry every file's {@code points: EquipmentDto[]} — for a PID
     * file with 50 equipment, the heavy DTO is ~10× the light one. The form
     * still gets the full DTO on edit via {@code /ng/files/{id}}.
     */
    public List<FileDto> getByFileType(String fileType) {
        List<FileObject> entities = fileRepo.findByFileType_Name(fileType);
        // Pre-init the new @ManyToMany collections inside the @Transactional method
        // so the mapper's isInitialized guard passes — without this the tree-menu
        // grouping by tag and the multi-system column would show empty for
        // existing files (and a save would wipe joins).
        for (FileObject f : entities) {
            if (f.getSystems() != null) f.getSystems().size();
            if (f.getTags() != null) f.getTags().size();
        }
        return entities.stream().map(this::toDtoLight).toList();
    }

    /** Distinct fileType names actually used by FileObjects in the database. */
    public List<String> getDistinctFileTypeNames() {
        return fileRepo.getDistinctFileTypeNames();
    }

    /** Files whose extension matches any of the given values. Eager-fetches fileType + vendor to avoid lazy loading. */
    public List<FileDto> findByExtensions(List<String> extensions) {
        return fileRepo.findByExtensionIn(extensions).stream().map(this::toDtoLight).toList();
    }

    /**
     * Find potential duplicates of an upload candidate.
     *
     * @param fileNumber       file number tokens (joined by __SEP__) being uploaded
     * @param fileHash         SHA-256 of the source bytes (optional, set after upload)
     * @param perceptualHash   aHash of the visual content (optional, set after upload)
     * @param excludeId        FileObject ID to skip (the one just uploaded), null to include all
     * @param phashThreshold   max Hamming distance to consider "visually similar"
     *                         (dHash typical: 6 for "same", 12 for "similar")
     * @return categorized matches
     */
    public DuplicateReport findDuplicates(List<String> fileNumber, String fileHash,
                                          String perceptualHash, Long excludeId, int phashThreshold) {
        DuplicateReport report = new DuplicateReport();

        // 1. Exact byte match
        if (fileHash != null && !fileHash.isBlank()) {
            fileRepo.findByFileHash(fileHash).stream()
                    .filter(f -> excludeId == null || !excludeId.equals(f.getId()))
                    .forEach(f -> report.exactMatches.add(toDtoLight(f)));
        }

        // 2. Visual match via perceptual hash + Hamming distance
        if (perceptualHash != null && !perceptualHash.isBlank()) {
            fileRepo.findAllWithPerceptualHash().forEach(f -> {
                if (excludeId != null && excludeId.equals(f.getId())) return;
                if (perceptualHash.equals(f.getPerceptualHash())) return; // already in exact set possibly
                int d = com.dk_power.power_plant_java.util.PerceptualHashUtil
                        .hammingDistance(perceptualHash, f.getPerceptualHash());
                if (d <= phashThreshold) {
                    VisualMatch m = new VisualMatch();
                    m.file = toDtoLight(f);
                    m.hammingDistance = d;
                    report.visualMatches.add(m);
                }
            });
            report.visualMatches.sort((a, b) -> Integer.compare(a.hammingDistance, b.hammingDistance));
        }

        // 3. Name match: full-string normalized comparison. Levenshtein distance
        //    against the FULL joined file number — the old per-token approach was
        //    far too loose for hierarchical numbers like "94.03.32.100-PD-0013-001.08.INF.08.01"
        //    where individual tokens ("94", "PD", "001") appear in thousands of files.
        if (fileNumber != null && !fileNumber.isEmpty()) {
            String normalizedInput = com.dk_power.power_plant_java.util.StringSimilarityUtil.normalize(
                    String.join("__SEP__", fileNumber.stream()
                            .filter(java.util.Objects::nonNull)
                            .toList())
            );
            if (!normalizedInput.isEmpty()) {
                java.util.Set<Long> seen = new java.util.HashSet<>();
                report.exactMatches.forEach(d -> seen.add(d.getId()));
                report.visualMatches.forEach(m -> seen.add(m.file.getId()));

                // Width filter: only consider candidates whose length is in the ballpark.
                // This avoids running Levenshtein against the entire table.
                int len = normalizedInput.length();
                int widthSlack = Math.max(nameDistanceThreshold + 2, len / 3);
                int minLen = Math.max(1, len - widthSlack);
                int maxLen = len + widthSlack;

                for (FileObject f : fileRepo.findAllWithFileNumber()) {
                    if (excludeId != null && excludeId.equals(f.getId())) continue;
                    if (seen.contains(f.getId())) continue;
                    String candidate = com.dk_power.power_plant_java.util.StringSimilarityUtil.normalize(f.getFileNumber());
                    if (candidate.isEmpty()) continue;
                    if (candidate.length() < minLen || candidate.length() > maxLen) continue;

                    int distance = com.dk_power.power_plant_java.util.StringSimilarityUtil
                            .levenshtein(normalizedInput, candidate);
                    if (distance <= nameDistanceThreshold) {
                        NameMatch nm = new NameMatch();
                        nm.file = toDtoLight(f);
                        nm.distance = distance;
                        report.nameMatches.add(nm);
                        seen.add(f.getId());
                    }
                }
                report.nameMatches.sort((a, b) -> Integer.compare(a.distance, b.distance));
            }
        }

        return report;
    }

    /** Max Levenshtein distance for a file-number to count as a potential duplicate. */
    private static final int nameDistanceThreshold = 5;

    public static class DuplicateReport {
        public List<FileDto> exactMatches = new ArrayList<>();
        public List<VisualMatch> visualMatches = new ArrayList<>();
        /** Files whose normalized fileNumber is within {@link #nameDistanceThreshold} of the input. */
        public List<NameMatch> nameMatches = new ArrayList<>();
    }

    public static class VisualMatch {
        public FileDto file;
        public int hammingDistance;
    }

    public static class NameMatch {
        public FileDto file;
        /** Levenshtein distance from the queried file number. 0 = exact. */
        public int distance;
    }

    // ===== Revisions (disk-based) =====
    // The "Revise" action writes a "-revN" file ALONGSIDE the original on disk
    // (e.g. X.pdf + X-rev1.pdf) but keeps a single FileObject row pointing at the
    // latest. So revisions are physical sibling files, NOT separate DB rows —
    // grouping by DB row finds nothing. We surface them by walking the uploads
    // tree once and grouping files by their on-disk base (path minus extension
    // and "-revN" suffix). Both the table and tree views consume this one map,
    // so neither needs per-row filesystem scans.

    private static final java.util.regex.Pattern REV_SUFFIX =
            java.util.regex.Pattern.compile("-rev(\\d+)$");

    /**
     * One revision of a document, aggregating every on-disk format (pdf, jpg, …)
     * for that revision number so the viewer can offer a format toggle.
     */
    public static class RevisionInfo {
        /** N from the "-revN" suffix; 0 for the original (no suffix). */
        public int revisionNumber;
        /** Base filename (incl. -revN, no extension) for display. */
        public String fileName;
        /** extension (lowercase, no dot) -> resolvable baseLink-prefixed link. */
        public Map<String, String> formats = new HashMap<>();
    }

    /**
     * Map of {@code <fileType>/<vendor>/<base-name> -> [revisions]} for every on-disk
     * document with more than one revision. The key is format-agnostic (the leading
     * format folder — pdf/jpg/… — is dropped) so a revision's pdf and jpg variants
     * collapse into one entry. The client reproduces the key from a row's fileLink
     * (drop the baseLink and format-folder segments, strip extension and -revN).
     * Each list is sorted original-first.
     */
    public Map<String, List<RevisionInfo>> getRevisionsMap() {
        Path root = Paths.get(filesRootPath);
        if (!Files.exists(root)) return new HashMap<>();
        // key -> (revisionNumber -> RevisionInfo)
        Map<String, Map<Integer, RevisionInfo>> grouped = new HashMap<>();
        try (java.util.stream.Stream<Path> walk = Files.walk(root)) {
            walk.filter(Files::isRegularFile).forEach(p -> {
                String rel = root.relativize(p).toString().replace("\\", "/");
                int firstSlash = rel.indexOf('/');
                if (firstSlash < 0) return; // file directly under root — not a managed file
                String afterFormat = rel.substring(firstSlash + 1); // drop format folder (pdf/jpg/…)
                String fileName = p.getFileName().toString();
                String ext = extensionOf(fileName);
                if (ext.isEmpty()) return;
                String key = REV_SUFFIX.matcher(stripExtension(afterFormat)).replaceFirst("");
                int revNum = FileUtil.extractRevisionNumber(fileName);

                RevisionInfo ri = grouped
                        .computeIfAbsent(key, k -> new HashMap<>())
                        .computeIfAbsent(revNum, n -> {
                            RevisionInfo r = new RevisionInfo();
                            r.revisionNumber = n;
                            r.fileName = stripExtension(fileName);
                            return r;
                        });
                ri.formats.put(ext, filesRelativePath + "/" + rel);
            });
        } catch (IOException e) {
            logger.warn("getRevisionsMap: walk of {} failed: {}", filesRootPath, e.getMessage());
        }

        Map<String, List<RevisionInfo>> result = new HashMap<>();
        for (Map.Entry<String, Map<Integer, RevisionInfo>> e : grouped.entrySet()) {
            if (e.getValue().size() <= 1) continue; // need >1 distinct revision number
            List<RevisionInfo> list = new ArrayList<>(e.getValue().values());
            list.sort(Comparator.comparingInt(r -> r.revisionNumber));
            result.put(e.getKey(), list);
        }
        return result;
    }

    private static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 ? fileName.substring(dot + 1).toLowerCase() : "";
    }

    private static String stripExtension(String s) {
        int slash = s.lastIndexOf('/');
        int dot = s.lastIndexOf('.');
        return dot > slash ? s.substring(0, dot) : s;
    }

    /**
     * Generate the JPG derivative for a PDF FileObject if it's missing.
     * No-op if the jpg already exists. Thread-safe per fileId via the
     * {@code ensureJpgLocks} map.
     *
     * @return the FileObject's jpg fileLink (resolvable client-side)
     * @throws IOException if the source pdf is missing or conversion fails
     */
    public String ensureJpgExists(Long fileId) throws IOException {
        FileObject file = getEntityById(fileId);
        if (file == null) throw new RuntimeException("File not found: " + fileId);
        if (file.getFileType() == null || file.getVendor() == null) {
            throw new RuntimeException("FileObject missing fileType/vendor — cannot resolve paths");
        }

        String jpgLink = file.buildFileLink("jpg");
        Path jpgPath = resolveToFileSystem(jpgLink);
        if (Files.exists(jpgPath)) {
            ensureJpgListedOnEntity(file);
            return jpgLink;
        }

        // Per-fileId lock so two concurrent requests don't both convert.
        Object lock = ensureJpgLocks.computeIfAbsent(fileId, k -> new Object());
        synchronized (lock) {
            // Re-check inside the lock — another thread may have generated it.
            if (Files.exists(jpgPath)) {
                ensureJpgListedOnEntity(file);
                return jpgLink;
            }
            return doGenerateJpg(file, jpgLink, jpgPath);
        }
    }

    /**
     * Force-regenerate the JPG for a FileObject regardless of whether one
     * exists on disk. Used by the "Re-generate JPG" recovery action (context
     * menu / file form / admin batch) — the mitigation for JPGs corrupted by
     * the pre-fix {@code PdfConverter.splitPdfIntoSinglePageFiles} bug where
     * multi-page splits shared the source's last-page render across every
     * output JPG (see {@link com.dk_power.power_plant_java.util.PdfConverter}).
     *
     * <p>Explicitly queues the new bytes for sync via
     * {@link com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler#queueFileUpload}
     * because a pure jpg-file overwrite does NOT touch any FieldChange-tracked
     * column, so the FieldChangeEntityListener → queueFileUpload auto-trigger
     * would not fire — the peer would keep the corrupt JPG on next pull.
     *
     * <p>Refreshes the perceptual hash after conversion — the stored hash
     * described the broken JPG and would poison future dedup/scan runs.
     */
    public String regenerateJpg(Long fileId) throws IOException {
        FileObject file = getEntityById(fileId);
        if (file == null) throw new RuntimeException("File not found: " + fileId);
        if (file.getFileType() == null || file.getVendor() == null) {
            throw new RuntimeException("FileObject missing fileType/vendor — cannot resolve paths");
        }

        String jpgLink = file.buildFileLink("jpg");
        Path jpgPath = resolveToFileSystem(jpgLink);

        Object lock = ensureJpgLocks.computeIfAbsent(fileId, k -> new Object());
        synchronized (lock) {
            // Don't pre-delete the JPG — doGenerateJpg writes to a temp path
            // and then Files.move(..., REPLACE_EXISTING) into place, which is
            // an atomic overwrite. Pre-deleting would leave the entity in an
            // unrecoverable state if the conversion then failed (source PDF
            // missing / disk full / render exception): the extensions CSV
            // still advertises jpg but no JPG exists on disk.
            String result = doGenerateJpg(file, jpgLink, jpgPath);

            // Recompute perceptual hash — stored value described the broken JPG.
            try {
                file.setPerceptualHash(computePerceptualHash(file));
                save(file);
            } catch (RuntimeException ex) {
                logger.warn("regenerateJpg: perceptual-hash refresh failed for #{}: {}",
                        fileId, ex.getMessage());
            }

            // Explicit sync notification — jpg-only overwrites don't emit
            // FieldChange rows, so the FieldChangeEntityListener → sync
            // auto-trigger never fires. Route through the mode-aware
            // dispatcher (NOT queueFileUpload directly), so hub-mode calls
            // registerFilesOnHub and client-mode queues the upload — matches
            // the NgFileCloneService pattern.
            try {
                fileObjectSyncHandler.onLocalFileObjectChanged(file, false);
            } catch (RuntimeException ex) {
                logger.warn("regenerateJpg: sync-notify failed for FileObject #{}: {}",
                        fileId, ex.getMessage());
            }
            return result;
        }
    }

    /**
     * Bulk force-regenerate. Loops per-id calling {@link #regenerateJpg};
     * one failure doesn't abort the batch — failures are collected and
     * returned so the admin panel can surface a per-file audit.
     */
    public RegenResult regenerateJpgs(List<Long> ids) {
        int success = 0;
        List<Map<String, Object>> failures = new ArrayList<>();
        for (Long id : ids) {
            try {
                regenerateJpg(id);
                success++;
            } catch (Exception e) {
                String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                failures.add(Map.of("id", id, "error", msg));
                logger.warn("regenerateJpgs: id={} failed: {}", id, msg);
            }
        }
        return new RegenResult(ids == null ? 0 : ids.size(), success, failures);
    }

    public record RegenResult(int total, int successCount, List<Map<String, Object>> failures) {}

    /**
     * Heuristically identify FileObjects likely hit by the pre-fix multi-page
     * JPG bug: groups of split-page rows (fileNumber ending in
     * {@code _page_N}) where every row in the group shares one perceptual
     * hash. Legitimate multi-page P&IDs virtually never have identical
     * content on every page, so a uniform hash across the group is the
     * bug's fingerprint.
     *
     * <p><strong>Min group size &ge; {@value #SCAN_BROKEN_MIN_GROUP_SIZE}</strong>
     * to keep false positives low. Two-page docs where both pages share a
     * template (cover sheet + repeat, blank spacer, etc.) match the same
     * "identical hashes" fingerprint as a real bug hit but are far more
     * common. A 3+ page doc with EVERY page pixel-identical is much rarer
     * for real content, so the floor buys precision at the cost of missing
     * two-page bug victims — those still get caught by the per-file
     * "Re-generate JPG" context-menu action.
     *
     * <p>Silently skips groups where any member lacks a perceptual hash
     * (the hash-backfill hasn't reached them yet — scan again later).
     * Returns the IDs the admin panel can preview + pass to
     * {@link #regenerateJpgs}.
     */
    public static final int SCAN_BROKEN_MIN_GROUP_SIZE = 3;

    public List<Long> scanBrokenJpgs() {
        java.util.regex.Pattern pageSuffix = java.util.regex.Pattern.compile("_page_\\d+$");
        Map<String, List<FileObject>> groups = new HashMap<>();
        for (FileObject f : fileRepo.findAllWithPerceptualHash()) {
            String fn = f.getFileNumber();
            if (fn == null) continue;
            if (!pageSuffix.matcher(fn).find()) continue;
            String base = pageSuffix.matcher(fn).replaceFirst("");
            groups.computeIfAbsent(base, k -> new ArrayList<>()).add(f);
        }
        List<Long> broken = new ArrayList<>();
        for (List<FileObject> pages : groups.values()) {
            if (pages.size() < SCAN_BROKEN_MIN_GROUP_SIZE) continue;
            Set<String> hashes = pages.stream()
                    .map(FileObject::getPerceptualHash)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            // Every member has a hash AND all hashes are identical → bug fingerprint.
            if (hashes.size() == 1 && hashes.iterator().next() != null
                    && pages.stream().allMatch(f -> f.getPerceptualHash() != null)) {
                pages.forEach(f -> broken.add(f.getId()));
            }
        }
        logger.info("scanBrokenJpgs: {} likely-broken FileObject id(s) across {} split-page group(s) (min-group={})",
                broken.size(), groups.size(), SCAN_BROKEN_MIN_GROUP_SIZE);
        return broken;
    }

    /**
     * Convert the source PDF to JPG and move to {@code jpgPath}. Caller must
     * hold the per-file lock. Extracted from {@link #ensureJpgExists} so
     * {@link #regenerateJpg} can reuse the same convert-and-move path
     * without duplicating the PDF-resolution + createDirectories + move
     * choreography.
     */
    private String doGenerateJpg(FileObject file, String jpgLink, Path jpgPath) throws IOException {
        String pdfLink = file.buildFileLink("pdf");
        Path pdfPath = resolveToFileSystem(pdfLink);
        if (!Files.exists(pdfPath)) {
            throw new IOException("Source PDF not found at " + pdfPath + " — cannot generate JPG");
        }
        File pdfSource = pdfPath.toFile();
        File generatedJpg = com.dk_power.power_plant_java.util.PdfConverter.convertPdfToJpg(pdfSource);
        if (generatedJpg == null) {
            throw new IOException("PDF→JPG conversion returned null for " + pdfPath);
        }
        Files.createDirectories(jpgPath.getParent());
        Files.move(generatedJpg.toPath(), jpgPath,
                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        ensureJpgListedOnEntity(file);
        logger.info("Generated JPG for FileObject #{} at {}", file.getId(), jpgPath);
        return jpgLink;
    }

    // =========================================================================
    // Rotate JPG (in-place, syncs to peers)
    // =========================================================================

    /**
     * Rotate the JPG derivative of a FileObject in place by {@code degrees}
     * (must be one of 90 / 180 / 270 — other values are refused so the caller
     * can't accidentally submit an arbitrary tilt that would break shape math).
     *
     * <p>Only touches the .jpg — the source .pdf stays as-is. Shapes on the
     * file are drawn against the JPG's dimensions (see
     * {@code equipment.originalPictureSize}), so rotating just the JPG doesn't
     * corrupt existing coordinate math. After rotation the perceptual hash is
     * refreshed and the sync channel is notified so peers pull the corrected
     * JPG. Same pattern as {@link #regenerateJpg}.
     *
     * <p>NOTE: existing shape overlays will be positioned against the OLD
     * orientation — the user is expected to Ctrl+A + drag / re-align shapes
     * after rotation. This is by design: automatic shape re-orientation would
     * mangle files where the user wants to rotate the underlying image but
     * keep annotations at their original screen locations.
     */
    public String rotateJpg(Long fileId, int degrees) throws IOException {
        if (degrees != 90 && degrees != 180 && degrees != 270) {
            throw new RuntimeException("Rotation degrees must be 90, 180, or 270 — got " + degrees);
        }
        FileObject file = getEntityById(fileId);
        if (file == null) throw new RuntimeException("File not found: " + fileId);
        if (file.getFileType() == null || file.getVendor() == null) {
            throw new RuntimeException("FileObject missing fileType/vendor — cannot resolve JPG path");
        }

        String jpgLink = file.buildFileLink("jpg");
        Path jpgPath = resolveToFileSystem(jpgLink);
        if (!Files.exists(jpgPath)) {
            throw new IOException("No JPG on disk at " + jpgPath + " — generate one first");
        }

        Object lock = ensureJpgLocks.computeIfAbsent(fileId, k -> new Object());
        synchronized (lock) {
            java.awt.image.BufferedImage src = javax.imageio.ImageIO.read(jpgPath.toFile());
            if (src == null) throw new IOException("Failed to decode JPG at " + jpgPath);

            // Always encode the destination as TYPE_INT_RGB. JPEG can't carry alpha, and
            // ImageIO's writer returns false (silently) on any alpha-bearing source type
            // (TYPE_INT_ARGB, TYPE_4BYTE_ABGR, TYPE_INT_ARGB_PRE) or TYPE_CUSTOM — with
            // that boolean ignored, the empty temp file would then atomic-move over the
            // good on-disk JPG and destroy it. Coercing to TYPE_INT_RGB up front means
            // there is always a writer.
            int destW = (degrees == 180) ? src.getWidth() : src.getHeight();
            int destH = (degrees == 180) ? src.getHeight() : src.getWidth();
            java.awt.image.BufferedImage rotated =
                    new java.awt.image.BufferedImage(destW, destH, java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g = rotated.createGraphics();
            try {
                java.awt.geom.AffineTransform at = new java.awt.geom.AffineTransform();
                // Translate so the rotated image origin lands at (0,0) of the destination.
                if (degrees == 90) {
                    at.translate(src.getHeight(), 0);
                } else if (degrees == 180) {
                    at.translate(src.getWidth(), src.getHeight());
                } else { // 270
                    at.translate(0, src.getWidth());
                }
                at.rotate(Math.toRadians(degrees));
                g.drawImage(src, at, null);
            } finally {
                g.dispose();
            }

            // Write to temp then atomic-move so a failed encode doesn't leave a truncated JPG.
            // If ImageIO.write returns false, the temp file is still 0 bytes — abort BEFORE
            // the atomic move so the previously-good JPG stays intact.
            Path tempOut = Files.createTempFile("rotate-", ".jpg");
            try {
                boolean ok = javax.imageio.ImageIO.write(rotated, "jpg", tempOut.toFile());
                if (!ok) {
                    throw new IOException("No JPEG writer for rotated image (src type=" + src.getType() +
                            ", file #" + fileId + ") — original JPG on disk preserved");
                }
                Files.move(tempOut, jpgPath, StandardCopyOption.REPLACE_EXISTING);
            } finally {
                Files.deleteIfExists(tempOut);
            }

            // Emit a content-affecting FieldChange so peers actually pull the new bytes.
            // FileObjectSyncHandler.processIncomingSyncChanges gates queueFileDownload on
            // `hasContentChange = fileHash|extensions` — a perceptualHash-only change is
            // NOT enough (see FileObjectSyncHandler:325-326). We refresh perceptualHash
            // AND idempotently re-set extensions to itself so the FieldChange row for
            // "extensions" fires, triggering peers to pull the rotated JPG.
            try {
                file.setPerceptualHash(computePerceptualHash(file));
                String exts = file.getExtensions();
                if (exts != null) file.setExtensions(exts); // dirty the field so @PostUpdate emits
                save(file);
            } catch (RuntimeException ex) {
                logger.warn("rotateJpg: field refresh failed for #{}: {}", fileId, ex.getMessage());
            }
            try {
                fileObjectSyncHandler.onLocalFileObjectChanged(file, false);
            } catch (RuntimeException ex) {
                logger.warn("rotateJpg: sync-notify failed for FileObject #{}: {}", fileId, ex.getMessage());
            }
            logger.info("Rotated JPG for FileObject #{} by {}° at {}", fileId, degrees, jpgPath);
            return jpgLink;
        }
    }

    // =========================================================================
    // Split-page RESTORE / RE-ATTACH
    // =========================================================================
    // Scenario: a multi-page PDF was originally split into N FileObject entities
    // (each with fileNumber "{base}_page_K"). Later, ALL on-disk copies (.pdf +
    // .jpg + revisions) go missing from every node — client and hub — but the
    // entities and their downstream relationships (LOTO points, coordinates,
    // permits) are intact. The user locates a fresh copy of the source PDF and
    // wants to re-attach its pages to the EXISTING entity IDs (creating new
    // entities would lose every downstream FK).
    //
    // Reattach preserves entity identity by design: fileNumber / fileType /
    // vendor / id / all relationships are untouched — only the on-disk bytes
    // and content hashes are refreshed. Sync propagates via the same hook
    // regenerateJpg uses (onLocalFileObjectChanged → per-entity file upload).

    /**
     * Group siblings by the split-page base name. For a FileObject named
     * {@code "X_page_2"} this returns every FileObject named {@code X_page_1},
     * {@code X_page_2}, … {@code X_page_N} that shares the same fileType +
     * vendor. Sorted by page index ascending. Excludes soft-deleted rows via
     * the default {@code @Where} filter.
     *
     * <p>Used by the frontend restore dialog to auto-populate the target list
     * from any one member of the group.
     */
    public List<FileDto> findSplitSiblings(Long fileId) {
        FileObject anchor = getEntityById(fileId);
        if (anchor == null) throw new RuntimeException("File not found: " + fileId);
        String base = stripPageSuffix(anchor.getFileNumber());
        if (base == null || base.equals(anchor.getFileNumber())) {
            // Not a split-page entity — no siblings to enumerate.
            return List.of(toDto(anchor));
        }
        java.util.regex.Pattern siblingPattern = java.util.regex.Pattern.compile(
                java.util.regex.Pattern.quote(base) + "_page_(\\d+)$");
        Long typeId = anchor.getFileType() != null ? anchor.getFileType().getId() : null;
        Long vendorId = anchor.getVendor() != null ? anchor.getVendor().getId() : null;
        List<FileObject> candidates = fileRepo.findByFileNumberContaining(base);
        return candidates.stream()
                .filter(f -> f.getFileNumber() != null && siblingPattern.matcher(f.getFileNumber()).matches())
                .filter(f -> typeId == null || (f.getFileType() != null && typeId.equals(f.getFileType().getId())))
                .filter(f -> vendorId == null || (f.getVendor() != null && vendorId.equals(f.getVendor().getId())))
                .sorted((a, b) -> {
                    int ap = extractPageIndex(a.getFileNumber());
                    int bp = extractPageIndex(b.getFileNumber());
                    return Integer.compare(ap, bp);
                })
                .map(this::toDto)
                .toList();
    }

    private static String stripPageSuffix(String fn) {
        if (fn == null) return null;
        return fn.replaceFirst("_page_\\d+$", "");
    }

    private static int extractPageIndex(String fn) {
        if (fn == null) return Integer.MAX_VALUE;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("_page_(\\d+)$").matcher(fn);
        return m.find() ? Integer.parseInt(m.group(1)) : Integer.MAX_VALUE;
    }

    /**
     * Re-attach a source PDF to a set of EXISTING split-page FileObject IDs.
     * The source is split into N pages; each page's bytes are written to the
     * corresponding target entity's on-disk path (page 1 → target with the
     * lowest page suffix, etc.). No new entities are created.
     *
     * <p>Fails hard when the source's page count doesn't match {@code targetIds.size()}
     * — the user must confirm the right source before submit to avoid mis-assigning
     * pages. Also fails if targets don't share fileType + vendor.
     *
     * <p>Per-target: writes the PDF, converts + writes the JPG, refreshes
     * fileHash + perceptualHash + extensions CSV, saves the entity, and calls
     * {@code onLocalFileObjectChanged} so the sync channel uploads the fresh
     * bytes to the hub (client mode) or registers with HubFileService (hub mode).
     */
    public ReattachResult reattachSplit(MultipartFile source, List<Long> targetIds) throws IOException {
        if (source == null || source.isEmpty()) throw new RuntimeException("Source PDF is required");
        if (targetIds == null || targetIds.isEmpty()) throw new RuntimeException("At least one target ID is required");

        String origName = source.getOriginalFilename();
        if (origName == null || !origName.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Source must be a .pdf file");
        }

        // Load + sort targets by page index; validate all present and share fileType/vendor.
        List<FileObject> targets = new ArrayList<>();
        for (Long id : targetIds) {
            FileObject t = getEntityById(id);
            if (t == null) throw new RuntimeException("Target FileObject not found: " + id);
            if (t.getFileType() == null || t.getVendor() == null) {
                throw new RuntimeException("Target #" + id + " missing fileType/vendor — cannot resolve on-disk path");
            }
            targets.add(t);
        }
        Long typeId = targets.get(0).getFileType().getId();
        Long vendorId = targets.get(0).getVendor().getId();
        for (FileObject t : targets) {
            if (!typeId.equals(t.getFileType().getId()) || !vendorId.equals(t.getVendor().getId())) {
                throw new RuntimeException("All targets must share the same fileType and vendor (" +
                        "mismatch at #" + t.getId() + ")");
            }
        }

        // SECURITY / DATA-INTEGRITY: enforce that every target belongs to a single
        // {base}_page_N split group. Without this guard, a caller can POST arbitrary
        // targetIds that share fileType+vendor but represent unrelated drawings —
        // the loop would then overwrite each with a page from the source PDF and
        // sync the corrupt bytes fleet-wide. The frontend restore dialog already
        // gates via findSplitSiblings; the REST endpoint must too.
        String base0 = stripPageSuffix(targets.get(0).getFileNumber());
        if (base0 == null || base0.isEmpty() || base0.equals(targets.get(0).getFileNumber())) {
            throw new RuntimeException("Target #" + targets.get(0).getId() +
                    " is not part of a {base}_page_N split group — reattach only works on split-page entities");
        }
        java.util.regex.Pattern groupPattern = java.util.regex.Pattern.compile(
                java.util.regex.Pattern.quote(base0) + "_page_\\d+$");
        for (FileObject t : targets) {
            String fn = t.getFileNumber();
            if (fn == null || !groupPattern.matcher(fn).matches()) {
                throw new RuntimeException("Target #" + t.getId() + " (fileNumber=" + fn +
                        ") is not part of the same split group as base '" + base0 + "'");
            }
        }
        targets.sort((a, b) -> Integer.compare(extractPageIndex(a.getFileNumber()), extractPageIndex(b.getFileNumber())));

        // Split source into pages in an owned temp dir so cleanup is deterministic.
        File tempDir = Files.createTempDirectory("reattach-").toFile();
        List<Map<String, Object>> perTarget = new ArrayList<>();
        int successCount = 0;
        try {
            // Use the first target's base name for split-file naming so the temp files
            // have meaningful names in logs.
            String tempBase = stripPageSuffix(targets.get(0).getFileNumber());
            List<File> pages = com.dk_power.power_plant_java.util.PdfConverter
                    .splitPdfIntoSinglePageFiles(source, tempBase != null ? tempBase : "reattach", tempDir);

            if (pages.size() != targets.size()) {
                throw new RuntimeException("Source has " + pages.size() + " page(s) but " +
                        targets.size() + " target(s) selected. Cancel and pick the correct source PDF.");
            }

            for (int i = 0; i < targets.size(); i++) {
                FileObject target = targets.get(i);
                File pdfPage = pages.get(i);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", target.getId());
                row.put("fileNumber", target.getFileNumber());
                row.put("page", i + 1);
                try {
                    // Serialize per-file writes against concurrent rotateJpg / ensureJpg /
                    // regenerateJpg on the same entity — they all target the same on-disk
                    // paths and would otherwise race on Files.move + hash-save, leaving the
                    // stored fileHash out of sync with disk (see reviewer finding MEDIUM #6).
                    Object perFileLock = ensureJpgLocks.computeIfAbsent(target.getId(), k -> new Object());
                    synchronized (perFileLock) {
                        // Write PDF at the target's on-disk path.
                        String pdfLink = target.buildFileLink("pdf");
                        Path pdfPath = resolveToFileSystem(pdfLink);
                        Files.createDirectories(pdfPath.getParent());
                        Files.copy(pdfPage.toPath(), pdfPath, StandardCopyOption.REPLACE_EXISTING);

                        // Convert and write JPG at the target's on-disk JPG path.
                        File jpg = com.dk_power.power_plant_java.util.PdfConverter.convertPdfToJpg(pdfPage);
                        if (jpg == null) throw new IOException("PDF→JPG conversion returned null for page " + (i + 1));
                        String jpgLink = target.buildFileLink("jpg");
                        Path jpgPath = resolveToFileSystem(jpgLink);
                        Files.createDirectories(jpgPath.getParent());
                        Files.move(jpg.toPath(), jpgPath, StandardCopyOption.REPLACE_EXISTING);

                        // Refresh entity metadata (extensions list, hash) so peers pull fresh content.
                        // Hash the split-page bytes on disk so a peer's integrity check post-download
                        // matches what we just wrote (peer downloads and re-hashes to verify).
                        target.setFileHash(computeSha256(Files.readAllBytes(pdfPath)));
                        target.setPerceptualHash(computePerceptualHash(target));
                        if (target.getExtensions() == null || !target.getExtensions().contains("pdf")) {
                            target.addExtension("pdf");
                        }
                        if (!target.getExtensions().contains("jpg")) {
                            target.addExtension("jpg");
                        }
                        save(target);

                        // Sync — bytes need to reach peers/hub. Mirrors regenerateJpg's pattern.
                        try {
                            fileObjectSyncHandler.onLocalFileObjectChanged(target, false);
                        } catch (RuntimeException ex) {
                            logger.warn("reattachSplit: sync-notify failed for #{}: {}",
                                    target.getId(), ex.getMessage());
                        }
                    }

                    row.put("status", "restored");
                    successCount++;
                } catch (IOException | RuntimeException e) {
                    row.put("status", "failed");
                    row.put("error", e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
                    logger.warn("reattachSplit: page {} → #{} failed: {}", i + 1, target.getId(), e.getMessage());
                }
                perTarget.add(row);
            }
        } finally {
            // Best-effort cleanup of the temp split files.
            try {
                File[] leftovers = tempDir.listFiles();
                if (leftovers != null) for (File f : leftovers) Files.deleteIfExists(f.toPath());
                Files.deleteIfExists(tempDir.toPath());
            } catch (IOException e) {
                logger.debug("reattachSplit: temp cleanup failed for {}: {}", tempDir, e.getMessage());
            }
        }
        // Unused variable removal — keep hash for potential future audit hook.
        return new ReattachResult(targets.size(), successCount, perTarget);
    }

    public record ReattachResult(int total, int successCount, List<Map<String, Object>> perTarget) {}

    /** Add "jpg" to the entity's extensions CSV if not already there. */
    private void ensureJpgListedOnEntity(FileObject file) {
        String exts = file.getExtensions();
        if (exts == null || !exts.toLowerCase().contains("jpg")) {
            file.addExtension("jpg");
            // Update perceptual hash now that a JPG exists, if it didn't before.
            if (file.getPerceptualHash() == null) {
                file.setPerceptualHash(computePerceptualHash(file));
            }
            save(file);
        }
    }

    private final java.util.concurrent.ConcurrentHashMap<Long, Object> ensureJpgLocks =
            new java.util.concurrent.ConcurrentHashMap<>();

    // ===== Backfill Hashes (background task on dedicated thread) =====
    // Runs in the background because:
    //   1. Hashing every file can take many minutes (disk I/O bound).
    //   2. NgFileService is @Transactional at class level — so any public method
    //      opens a transaction → acquires a connection from the pool. If the
    //      backfill runs on the calling thread, that connection is held for the
    //      entire run, triggering HikariCP leak warnings.
    //   3. Synchronous HTTP requests would hit Spring's async timeout long
    //      before the work finishes.
    //
    // We use an explicit single-thread ExecutorService rather than @Async
    // because @Async on a self-invocation (calling our own @Async method from
    // another method in this class) bypasses the Spring proxy and silently
    // becomes synchronous — that was the prior bug.
    //
    // startBackfillHashes is marked @Transactional(propagation = NOT_SUPPORTED)
    // so the HTTP request thread does NOT open a transaction while spawning
    // the worker. Each per-file save inside the worker runs in its own short
    // transaction via TransactionTemplate, keeping connection holds tiny.

    private final BackfillState backfillState = new BackfillState();
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.transaction.PlatformTransactionManager backfillTxManager;
    private final java.util.concurrent.ExecutorService backfillExecutor =
            java.util.concurrent.Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "file-hash-backfill");
                t.setDaemon(true);
                return t;
            });

    /**
     * Kick off a backfill in the background. Returns immediately with the live state.
     *
     * @param recomputePerceptual when true, recomputes {@code perceptualHash} for every
     *                            file that has a rendered JPG — used when the hash
     *                            algorithm itself changes (e.g. aHash → dHash) so old
     *                            values get replaced. When false, only fills gaps.
     */
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public BackfillState startBackfillHashes(int limit, boolean recomputePerceptual) {
        synchronized (backfillState) {
            if (backfillState.running) {
                return backfillState.snapshot(); // already running, return current state
            }
            backfillState.reset(limit);
            backfillState.recomputePerceptual = recomputePerceptual;
            backfillState.running = true;
        }
        backfillExecutor.submit(() -> runBackfillAsync(limit, recomputePerceptual));
        return backfillState.snapshot();
    }

    /** Live snapshot of the backfill progress. */
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public BackfillState getBackfillStatus() {
        return backfillState.snapshot();
    }

    /**
     * The actual hashing loop. Runs on the {@code file-hash-backfill} thread; uses
     * {@link #backfillTxManager} via TransactionTemplate so each per-file save is a
     * tiny short-lived transaction (connection released between files).
     */
    public void runBackfillAsync(int limit, boolean recomputePerceptual) {
        org.springframework.transaction.support.TransactionTemplate tx =
                new org.springframework.transaction.support.TransactionTemplate(backfillTxManager);
        try {
            // When recomputing perceptual hashes (algorithm change), walk ALL files;
            // otherwise only those missing one of the hashes.
            List<Long> candidateIds = tx.execute(status -> recomputePerceptual
                    ? fileRepo.findAllIds()
                    : fileRepo.findIdsNeedingHash());
            if (candidateIds == null) candidateIds = List.of();

            backfillState.total = candidateIds.size();

            int processed = 0;
            for (Long id : candidateIds) {
                if (limit > 0 && processed >= limit) break;
                processed++;
                backfillState.processed = processed;

                try {
                    tx.execute(status -> {
                        FileObject f = fileRepo.findById(id).orElse(null);
                        if (f == null) {
                            backfillState.missingOnDisk++;
                            backfillState.skipEntityMissing++;
                            return null;
                        }
                        if (f.getFileType() == null || f.getVendor() == null) {
                            backfillState.missingOnDisk++;
                            backfillState.skipNoTypeOrVendor++;
                            recordSample(backfillState.sampleSkipped, "id=" + id + " no fileType/vendor");
                            return null;
                        }
                        boolean changed = false;
                        if (f.getFileHash() == null || f.getFileHash().isBlank()) {
                            String[] reason = new String[1];
                            String h = computeSourceHashDiagnostic(f, reason);
                            if (h != null) {
                                f.setFileHash(h);
                                changed = true;
                            } else {
                                backfillState.missingOnDisk++;
                                String r = reason[0] == null ? "unknown" : reason[0];
                                if (r.startsWith("no-extension")) backfillState.skipNoExtension++;
                                else if (r.startsWith("no-filelink")) backfillState.skipNoFileLink++;
                                else if (r.startsWith("missing-on-disk")) backfillState.skipFileMissing++;
                                else if (r.startsWith("io-error")) backfillState.skipIoError++;
                                recordSample(backfillState.sampleSkipped, "id=" + id + " " + r);
                            }
                        }
                        boolean needsPerceptual = recomputePerceptual
                                || f.getPerceptualHash() == null
                                || f.getPerceptualHash().isBlank();
                        if (needsPerceptual) {
                            String p = computePerceptualHash(f);
                            if (p != null && !p.equals(f.getPerceptualHash())) {
                                f.setPerceptualHash(p);
                                changed = true;
                            }
                        }
                        if (changed) {
                            fileRepo.save(f);
                            backfillState.updated++;
                        }
                        return null;
                    });
                } catch (Exception e) {
                    logger.warn("Backfill: failed to hash file id={}: {}", id, e.getMessage());
                    backfillState.errors++;
                }
            }
        } catch (Exception e) {
            logger.error("Backfill: aborted with error", e);
            backfillState.errors++;
        } finally {
            synchronized (backfillState) {
                backfillState.running = false;
                backfillState.finishedAt = System.currentTimeMillis();
            }
            logger.info("Backfill finished: processed={} updated={} missingOnDisk={} errors={} recomputePerceptual={}",
                    backfillState.processed, backfillState.updated, backfillState.missingOnDisk, backfillState.errors, recomputePerceptual);
        }
    }

    private static final int SAMPLE_SKIPPED_CAP = 10;

    /** Append to a sample list, bounded so we don't grow unbounded across runs. */
    private static void recordSample(List<String> sample, String line) {
        synchronized (sample) {
            if (sample.size() < SAMPLE_SKIPPED_CAP) sample.add(line);
        }
    }

    /** Mutable state shared between the background task and status queries. */
    public static class BackfillState {
        public volatile boolean running;
        public volatile int total;
        public volatile int processed;
        public volatile int updated;
        public volatile int missingOnDisk;
        public volatile int errors;
        public volatile int limit;
        public volatile boolean recomputePerceptual;
        public volatile long startedAt;
        public volatile long finishedAt;

        /** Sub-categories of {@code missingOnDisk} so the user knows what to fix. */
        public volatile int skipEntityMissing;
        public volatile int skipNoTypeOrVendor;
        public volatile int skipNoExtension;
        public volatile int skipNoFileLink;
        public volatile int skipFileMissing;
        public volatile int skipIoError;

        /** First few skipped files with their reason — for triage in the admin UI. */
        public final List<String> sampleSkipped = new java.util.ArrayList<>();

        synchronized void reset(int limit) {
            this.running = false;
            this.total = 0;
            this.processed = 0;
            this.updated = 0;
            this.missingOnDisk = 0;
            this.errors = 0;
            this.limit = limit;
            this.recomputePerceptual = false;
            this.startedAt = System.currentTimeMillis();
            this.finishedAt = 0L;
            this.skipEntityMissing = 0;
            this.skipNoTypeOrVendor = 0;
            this.skipNoExtension = 0;
            this.skipNoFileLink = 0;
            this.skipFileMissing = 0;
            this.skipIoError = 0;
            synchronized (this.sampleSkipped) {
                this.sampleSkipped.clear();
            }
        }

        synchronized BackfillState snapshot() {
            BackfillState s = new BackfillState();
            s.running = this.running;
            s.total = this.total;
            s.processed = this.processed;
            s.updated = this.updated;
            s.missingOnDisk = this.missingOnDisk;
            s.errors = this.errors;
            s.limit = this.limit;
            s.recomputePerceptual = this.recomputePerceptual;
            s.startedAt = this.startedAt;
            s.finishedAt = this.finishedAt;
            s.skipEntityMissing = this.skipEntityMissing;
            s.skipNoTypeOrVendor = this.skipNoTypeOrVendor;
            s.skipNoExtension = this.skipNoExtension;
            s.skipNoFileLink = this.skipNoFileLink;
            s.skipFileMissing = this.skipFileMissing;
            s.skipIoError = this.skipIoError;
            synchronized (this.sampleSkipped) {
                s.sampleSkipped.addAll(this.sampleSkipped);
            }
            return s;
        }
    }

    public List<FileDto> getByFileType(com.dk_power.power_plant_java.entities.categories.Value fileType) {
        return fileRepo.findByFileType(fileType).stream().map(this::toDto).toList();
    }

    public List<FileDto> getByFileType(String fileType, List<String> fields) {
        return findAllWithProjection(fields).stream()
                .filter(file -> file.getFileType() != null && file.getFileType().getName().toLowerCase().contains(fileType.toLowerCase()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<FileObject> refactorValues(com.dk_power.power_plant_java.entities.categories.Value oldValue, com.dk_power.power_plant_java.entities.categories.Value newValue) {
        logger.info("refactorValues called: oldValue={} (id={}), newValue={} (id={})",
            oldValue.getName(), oldValue.getId(), newValue.getName(), newValue.getId());

        // First, find all files that will be affected and capture their OLD paths before updating
        List<FileObject> filesToUpdate = findByValue(oldValue);
        logger.info("Found {} files to update", filesToUpdate.size());

        Map<Long, String> oldFileLinks = new HashMap<>();
        Map<Long, List<String>> fileExtensions = new HashMap<>();

        for (FileObject file : filesToUpdate) {
            // Use the stored fileLink field directly, not getFileLink() which rebuilds it
            // If stored fileLink is null, fall back to building it
            String storedLink = file.getStoredFileLink();
            String builtLink = file.getFileLink();
            String oldLink = (storedLink != null && !storedLink.isEmpty()) ? storedLink : builtLink;
            oldFileLinks.put(file.getId(), oldLink);
            fileExtensions.put(file.getId(), file.getExtensionsArray());
            logger.info("Captured for file {}: storedLink={}, builtLink={}, using={}",
                file.getId(), storedLink, builtLink, oldLink);
        }

        // Now update the entity references (this changes vendor/fileType to newValue)
        List<FileObject> fileObjects = NgCrudService.super.refactorValues(oldValue, newValue);
        logger.info("After refactorValues, {} files were updated", fileObjects.size());

        // Move the actual files using the captured OLD paths
        for (FileObject file : fileObjects) {
            String oldLink = oldFileLinks.get(file.getId());
            if (oldLink == null) {
                logger.warn("No old link found for file {}, skipping", file.getId());
                continue;
            }

            // Build the new path based on the updated entity
            String newPath = file.buildFileLink();
            logger.info("File {}: oldLink={}, newPath={}", file.getId(), oldLink, newPath);

            String currentExtension = FileUtil.getFileExtension(oldLink);
            List<String> extensions = fileExtensions.get(file.getId());
            logger.info("File {}: extensions={}", file.getId(), extensions);

            List<File> filesWithAllExtensions = getFilesWithAllExtensions(oldLink, extensions);
            logger.info("File {}: found {} physical files to move", file.getId(), filesWithAllExtensions.size());

            for (File f : filesWithAllExtensions) {
                String extension = FileUtil.getFileExtension(f.getName());
                try {
                    Path targetPath = resolveToFileSystem(newPath.replaceAll(currentExtension, extension));
                    logger.info("Moving file from {} to {}", f.toPath(), targetPath);
                    // Only try to move if source file exists
                    if (f.exists()) {
                        FileUtil.moveFileAndCleanup(f.toPath(), targetPath);
                        logger.info("Successfully moved file to {}", targetPath);
                    } else {
                        logger.warn("Source file does not exist, skipping move: {}", f.getPath());
                    }
                } catch (IOException e) {
                    String errorMsg = e.getMessage() != null ? e.getMessage() : "Failed to move file: " + f.getName();
                    logger.error("Error moving file {} to new location: {}", f.getName(), errorMsg);
                    throw new RuntimeException("Failed to transfer file '" + f.getName() + "': " + errorMsg, e);
                }
            }
        }

        return fileObjects.stream().map(file -> {
            file.buildFileLink();
            file.buildFolder();
            return save(file);
        }).toList();
    }

    public void updateFileStructureWithNewValue(com.dk_power.power_plant_java.entities.categories.Value value, String newName) {
        Category category = value.getCategory();
        if (category != null && category.getName().equals("File Type")) {
            String oldName = value.getName();
            try {
                Path rootPath = Paths.get(filesRootPath);
                Files.walk(rootPath, 1) // Limit depth to 2 to avoid going too deep
                        .filter(Files::isDirectory)
                        .forEach(path -> {
                            Path folderToRename = path.resolve(oldName);
                            if (Files.exists(folderToRename)) {
                                try {
                                    Path newPath = path.resolve(newName);
                                    Files.move(folderToRename, newPath);
                                    logger.info("Renamed folder from {} to {}", folderToRename, newPath);
                                } catch (IOException e) {
                                    logger.error("Failed to rename folder from {} to {}", folderToRename, path.resolve(newName), e);
                                }
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories", e);
            }
        } else if (category != null && category.getName().equals("Vendor")) {
            String oldName = value.getName();
            try {
                Path rootPath = Paths.get(filesRootPath);
                Files.walk(rootPath, 3) // Depth 3 to reach the vendor folders
                        .filter(Files::isDirectory)
                        .forEach(path -> {
                            // Check if this is a vendor folder (at depth 3)
                            if (path.getNameCount() - rootPath.getNameCount() == 3 && path.getFileName().toString().equals(oldName)) {
                                try {
                                    Path newPath = path.resolveSibling(newName);
                                    Files.move(path, newPath);
                                    logger.info("Renamed vendor folder from {} to {}", path, newPath);
                                } catch (IOException e) {
                                    logger.error("Failed to rename vendor folder from {} to {}", path, path.resolveSibling(newName), e);
                                }
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories", e);
            }
        }
    }

    /**
     * Move files when a Vendor or File Type name changes during sync.
     * This is used in peer-to-peer mode where files need to be moved locally
     * (not downloaded from a central server).
     *
     * @param oldName the old name (from FieldChange.oldValue)
     * @param newName the new name (from the updated Value entity)
     * @param categoryName the category name ("Vendor" or "File Type")
     */
    public void moveFilesForValueNameChange(String oldName, String newName, String categoryName) {
        if (oldName == null || oldName.isEmpty() || newName == null || newName.isEmpty()) {
            logger.warn("moveFilesForValueNameChange: oldName or newName is null/empty");
            return;
        }

        if (oldName.equals(newName)) {
            logger.debug("moveFilesForValueNameChange: oldName equals newName '{}', nothing to do", oldName);
            return;
        }

        logger.info("Moving files for {} name change: '{}' -> '{}'", categoryName, oldName, newName);

        if ("File Type".equals(categoryName)) {
            try {
                Path rootPath = Paths.get(filesRootPath);
                // File type folders are at depth 2: uploads/{extension}/{fileType}
                Files.walk(rootPath, 2)
                        .filter(Files::isDirectory)
                        .filter(path -> path.getFileName().toString().equals(oldName))
                        .forEach(path -> {
                            try {
                                Path newPath = path.resolveSibling(newName);
                                if (!Files.exists(newPath)) {
                                    Files.move(path, newPath);
                                    logger.info("Moved file type folder from {} to {}", path, newPath);
                                } else {
                                    // Target exists, need to merge
                                    logger.info("Target folder {} exists, merging contents", newPath);
                                    mergeDirectories(path, newPath);
                                }
                            } catch (IOException e) {
                                logger.error("Failed to move file type folder from {} to {}: {}",
                                    path, path.resolveSibling(newName), e.getMessage());
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories for File Type move: {}", e.getMessage());
            }
        } else if ("Vendor".equals(categoryName)) {
            try {
                Path rootPath = Paths.get(filesRootPath);
                // Vendor folders are at depth 3: uploads/{extension}/{fileType}/{vendor}
                Files.walk(rootPath, 3)
                        .filter(Files::isDirectory)
                        .filter(path -> path.getNameCount() - rootPath.getNameCount() == 3)
                        .filter(path -> path.getFileName().toString().equals(oldName))
                        .forEach(path -> {
                            try {
                                Path newPath = path.resolveSibling(newName);
                                if (!Files.exists(newPath)) {
                                    Files.move(path, newPath);
                                    logger.info("Moved vendor folder from {} to {}", path, newPath);
                                } else {
                                    // Target exists, need to merge
                                    logger.info("Target folder {} exists, merging contents", newPath);
                                    mergeDirectories(path, newPath);
                                }
                            } catch (IOException e) {
                                logger.error("Failed to move vendor folder from {} to {}: {}",
                                    path, path.resolveSibling(newName), e.getMessage());
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories for Vendor move: {}", e.getMessage());
            }
        }
    }

    /**
     * Merge contents of source directory into target directory.
     * Files in source are moved to target. Source directory is deleted after merge.
     */
    private void mergeDirectories(Path source, Path target) throws IOException {
        Files.walk(source)
                .filter(Files::isRegularFile)
                .forEach(file -> {
                    try {
                        Path relativePath = source.relativize(file);
                        Path targetFile = target.resolve(relativePath);
                        Files.createDirectories(targetFile.getParent());
                        Files.move(file, targetFile, StandardCopyOption.REPLACE_EXISTING);
                        logger.debug("Merged file {} to {}", file, targetFile);
                    } catch (IOException e) {
                        logger.warn("Failed to merge file {}: {}", file, e.getMessage());
                    }
                });
        // Delete empty source directory
        deleteDirectoryRecursively(source);
    }

    /**
     * Delete old file structure folders after a Value entity name change from sync.
     * This is called when a Vendor or File Type name is changed on another machine
     * and synced to this machine. Files have already been copied to the new location
     * by the file sync system, so we just need to clean up the old folders.
     *
     * @param oldName the old name (from FieldChange.oldValue)
     * @param categoryName the category name ("Vendor" or "File Type")
     */
    public void deleteOldFileStructureAfterSync(String oldName, String categoryName) {
        if (oldName == null || oldName.isEmpty()) {
            return;
        }

        logger.info("Deleting old file structure after sync: {} (category: {})", oldName, categoryName);

        if ("File Type".equals(categoryName)) {
            try {
                Path rootPath = Paths.get(filesRootPath);
                Files.walk(rootPath, 1)
                        .filter(Files::isDirectory)
                        .forEach(path -> {
                            Path folderToDelete = path.resolve(oldName);
                            if (Files.exists(folderToDelete)) {
                                try {
                                    deleteDirectoryRecursively(folderToDelete);
                                    logger.info("Deleted old file type folder: {}", folderToDelete);
                                } catch (IOException e) {
                                    logger.error("Failed to delete old file type folder: {}", folderToDelete, e);
                                }
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories for File Type cleanup", e);
            }
        } else if ("Vendor".equals(categoryName)) {
            try {
                Path rootPath = Paths.get(filesRootPath);
                Files.walk(rootPath, 3)
                        .filter(Files::isDirectory)
                        .forEach(path -> {
                            // Check if this is a vendor folder (at depth 3)
                            if (path.getNameCount() - rootPath.getNameCount() == 3 && path.getFileName().toString().equals(oldName)) {
                                try {
                                    deleteDirectoryRecursively(path);
                                    logger.info("Deleted old vendor folder: {}", path);
                                } catch (IOException e) {
                                    logger.error("Failed to delete old vendor folder: {}", path, e);
                                }
                            }
                        });
            } catch (IOException e) {
                logger.error("Error while traversing directories for Vendor cleanup", e);
            }
        }
    }

    /**
     * Recursively delete a directory and all its contents.
     */
    private void deleteDirectoryRecursively(Path directory) throws IOException {
        if (Files.exists(directory)) {
            Files.walk(directory)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            logger.warn("Failed to delete: {}", path, e);
                        }
                    });
        }
    }

    public List<FileObject> getFilesWithNoExtension() {
        return fileRepo.findByExtensionsIsNullOrBlank();
    }

    public List<EquipmentDto> getEquipmentByFile(String fileId) {
        FileObject entityById = getEntityById(fileId);
        if (entityById == null) return Collections.emptyList();
        return entityById.getPoints().stream().map(equipmentService::toDto).toList();
    }


    //File Uploading Methods

    public void createObjectsFromDirectoryUsingMetaDataExcel(String folder, String type, String extension, String vendor,String system) {
        String root = System.getProperty("user.dir").replaceAll("\\\\","/");
        folder =root+"/" +folder.replaceAll("\\\\","/");
        System.out.println(folder);
        List<File> listOfFiles = FileUtil.getFilesFromDirectory(folder);
        System.out.println("Found: " + listOfFiles.size() + " files");
        File excel = listOfFiles.stream().filter(e->e.getName().contains("metadata.xl")).findFirst().orElse(null);
        List<Map<String, String>> metadata = null;
        if(excel!=null)metadata = excelReaderService.readExcelFile(folder + "/" + excel.getName());

        for (File file : listOfFiles) {
            String fileNumber = null;
            if(file.getName().contains(extension)) fileNumber = file.getName().substring(0,file.getName().indexOf(extension)-1);
            FileObject f = getFileByNumber(fileNumber);
            if(f==null && file.getName().contains(extension)){
                f = new FileObject();
                f.setBaseLink(filesRelativePath);
                f.setExtension(extension);
                f.addExtension(extension);
                f.setFileType(valueService.createValue("File Type",type));
                f.setVendor(valueService.createValue("Vendor",vendor));
                f.setFileNumber(fileNumber);
                System.out.println(f.getFileNumber());
                f.buildFileLink(extension);
                f.buildFolder(extension);
                f.setRelatedSystems(system);

                if(metadata!=null){
                    Map<String, String> details = metadata.stream().filter(e -> file.getName().contains(e.get("Document No."))).findFirst().orElse(null);
                    if(details!=null){
                        if(details.get("Title")!=null && !details.get("Title").trim().isEmpty())f.setName(details.get("Title"));
                        if(details.get("VDN")!=null && !details.get("VDN").trim().isEmpty()){
                            f.setDocNum(details.get("VDN").trim());
                            List<String> strings = new ArrayList<>();
                            strings.add(details.get("Document No.").trim());
                            strings.add(f.getDocNum());
                            String s = fileMapper.convertFileNumberArrayToString(strings);
                            f.setFileNumber(s);
                        }
                        if(details.get("Tag No")!=null && !details.get("Tag No").trim().isEmpty()) f.setRelatedTags(details.get("Tag No"));
                    }

                }
                // Rename here after all changes
                String newFileName = f.getFileNumber() +"."+ extension;
                Path source = file.toPath();
                Path target = source.resolveSibling(newFileName);
                try {
                    Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("Renamed to: " + newFileName);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                save(f);

            }else{
//                throw new RuntimeException("File with this name already exists");
                System.out.println("Skipped: " + file.getName());
            }
        }

    }

    public List<FileObject> getFilesWithRelatedTags() {
        return fileRepo.findByRelatedTagsIsNotNull();
    }

    public FileDto getFileByLink(String fileLink) {
        String pdfLink = fileLink.replaceAll("jpg","pdf");
        FileObject entityByFileLink = fileRepo.findFirstByFileLinkOrderByIdAsc(pdfLink);
        System.out.println(entityByFileLink);
        if(entityByFileLink == null){
            String fileNumber = FileObject.getFileNumberFromLink(fileLink);
            System.out.println("FileNumber: " + fileNumber);
            entityByFileLink = fileRepo.findFirstByFileNumberOrderByIdAsc(fileNumber);
            System.out.println(entityByFileLink);
        }
        if (entityByFileLink == null) return null;
        return toDto(entityByFileLink);
    }


    @Transactional
    public void cleanUpFileTypeValueDuplicates() {
        System.out.println("valueService.getValuesByCategory(\"File Type\").size() = " + valueService.getValuesByCategory("File Type").size());
        Map<String, com.dk_power.power_plant_java.entities.categories.Value> cache = new HashMap<>();
        // Preload existing 'File Type' values
        valueService.getValuesByCategory("File Type")
                .forEach(v -> cache.put(v.getName(), v));

        for (FileObject f : getAll()) {
            String name = f.getFileType().getName();

            com.dk_power.power_plant_java.entities.categories.Value val = cache.get(name);
            if (val == null) {
                val = valueService.createValue("File Type", name); // within same transaction
                cache.put(name, val);
            }
            f.setFileType(val);
            save(f);
        }



        deleteUnusedValues();

    }

    @Transactional
    public void deleteUnusedValues() {
        Category category = valueService.getCategoryByNameSafe("FileType");
        if (category != null) {
            for (com.dk_power.power_plant_java.entities.categories.Value value : category.getValues()) {
                if(!getByFileType(value).isEmpty()) throw new RuntimeException("Value '" + value.getName() + "' is still used by File Objects");
            }
                categoryRepo.delete(category);
        }
    }

    // ===== relatedSystems → systems/tags migration =====
    // One-shot conversion of the legacy CSV-of-names `relatedSystems`. Per parsed
    // name: matches an existing Value with Category=System → added to the file's
    // new @ManyToMany `systems` collection; otherwise → added to `tags` (Tag
    // category and Tag values auto-created on demand). NO new System Values are
    // ever created. The primary `system` FK is NOT auto-seeded.
    // Idempotent: HashSet.add returns false for entries already present, so
    // re-running won't double-add or re-emit sync events.

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.transaction.PlatformTransactionManager migrationTxManager;

    /** Mutable result of a migrate-relatedSystems-to-tags run. */
    public static class MigrationResult {
        public boolean dryRun;
        public int filesScanned;
        public int filesUpdated;
        /** Total distinct names found across all relatedSystems CSVs. */
        public int uniqueCsvNames;
        /** Names that match an existing Tag value (will be REUSED, not recreated). */
        public java.util.List<String> tagsExistingNames = new java.util.ArrayList<>();
        /** Names that DON'T match any existing Value (System or Tag) — will be CREATED as Tag values. */
        public java.util.List<String> tagsToCreateNames = new java.util.ArrayList<>();
        /** Names that match an existing System value — will be assigned to `systems` (no new System created). */
        public java.util.List<String> systemsReusedNames = new java.util.ArrayList<>();
        /** Real-run counts. */
        public int tagsAssigned;
        public int systemsAssigned;
        public int errors;
        public long startedAt;
        public long finishedAt;
    }

    /**
     * Migrate legacy {@code relatedSystems} CSV into the new collections.
     *
     * For each distinct name in the CSV:
     *   - if it matches an existing Value with Category=System (case-insensitive) →
     *     assigned to the file's `systems` collection. NO new System values are
     *     ever created by this migration.
     *   - otherwise → assigned to the file's `tags` collection, creating the Tag
     *     value (under Category="Tag") if it doesn't exist yet.
     *
     * The primary `system` FK is NOT auto-seeded into the new `systems` collection;
     * the new collection is populated solely from CSV→System matches.
     *
     * Marked {@code NOT_SUPPORTED} so the HTTP thread does NOT open a long-running
     * transaction (the class is @Transactional). Each file save runs in its own
     * short transaction via TransactionTemplate.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public MigrationResult migrateRelatedSystemsToTags(boolean dryRun) {
        MigrationResult result = new MigrationResult();
        result.dryRun = dryRun;
        result.startedAt = System.currentTimeMillis();

        org.springframework.transaction.support.TransactionTemplate tx =
                new org.springframework.transaction.support.TransactionTemplate(migrationTxManager);

        try {
            // Step 1: load all files + collect unique CSV names + per-file parsed names.
            List<Long> allIds = tx.execute(status -> fileRepo.findAllIds());
            if (allIds == null) allIds = List.of();
            result.filesScanned = allIds.size();

            // Aggregate cross-file with CASE-INSENSITIVE dedupe: lowercased key,
            // first-seen spelling preserved for display. Without this, "Pump" from
            // one file and "pump" from another both end up in the preview lists
            // and trigger two createValue calls (which are idempotent at the DB
            // level via Category.getValueByName but bloat the preview).
            Map<String, String> allByLower = new LinkedHashMap<>();
            Map<Long, Set<String>> namesByFileId = new HashMap<>();

            for (Long id : allIds) {
                tx.execute(status -> {
                    FileObject f = fileRepo.findById(id).orElse(null);
                    if (f == null) return null;
                    Set<String> names = parseTagNamesFromCsv(f.getRelatedSystems());
                    if (!names.isEmpty()) {
                        namesByFileId.put(id, names);
                        for (String n : names) {
                            allByLower.putIfAbsent(n.toLowerCase().trim(), n);
                        }
                    }
                    return null;
                });
            }
            Collection<String> allCsvNames = allByLower.values();
            result.uniqueCsvNames = allByLower.size();

            // Step 2: build lookup maps for existing System and Tag values (case-insensitive).
            Map<String, com.dk_power.power_plant_java.entities.categories.Value> systemByLower = tx.execute(status -> {
                Category cat = valueService.getCategoryByAliasSafe("system");
                if (cat == null) cat = valueService.getCategoryByNameSafe("System");
                Map<String, com.dk_power.power_plant_java.entities.categories.Value> m = new HashMap<>();
                if (cat != null) {
                    for (com.dk_power.power_plant_java.entities.categories.Value v : cat.getValues()) {
                        if (v.getName() != null && !v.getName().isBlank()) {
                            m.put(v.getName().toLowerCase().trim(), v);
                        }
                    }
                }
                return m;
            });
            if (systemByLower == null) systemByLower = new HashMap<>();

            Map<String, com.dk_power.power_plant_java.entities.categories.Value> tagByLower = tx.execute(status -> {
                Category cat = valueService.getCategoryByNameSafe("Tag");
                Map<String, com.dk_power.power_plant_java.entities.categories.Value> m = new HashMap<>();
                if (cat != null) {
                    for (com.dk_power.power_plant_java.entities.categories.Value v : cat.getValues()) {
                        if (v.getName() != null && !v.getName().isBlank()) {
                            m.put(v.getName().toLowerCase().trim(), v);
                        }
                    }
                }
                return m;
            });
            if (tagByLower == null) tagByLower = new HashMap<>();

            // Step 3: classify each unique CSV name → systems-reuse, tags-existing, or tags-to-create.
            for (String name : allCsvNames) {
                String lower = name.toLowerCase().trim();
                if (systemByLower.containsKey(lower)) {
                    result.systemsReusedNames.add(name);
                } else if (tagByLower.containsKey(lower)) {
                    result.tagsExistingNames.add(name);
                } else {
                    result.tagsToCreateNames.add(name);
                }
            }
            java.util.Collections.sort(result.systemsReusedNames, String.CASE_INSENSITIVE_ORDER);
            java.util.Collections.sort(result.tagsExistingNames, String.CASE_INSENSITIVE_ORDER);
            java.util.Collections.sort(result.tagsToCreateNames, String.CASE_INSENSITIVE_ORDER);

            if (dryRun) {
                result.finishedAt = System.currentTimeMillis();
                return result;
            }

            // Step 4 (real run): find-or-create the Tag values we identified.
            final Map<String, com.dk_power.power_plant_java.entities.categories.Value> tagCache = new HashMap<>(tagByLower);
            for (String name : result.tagsToCreateNames) {
                final String n = name;
                try {
                    com.dk_power.power_plant_java.entities.categories.Value tag = tx.execute(status ->
                            valueService.createValue("Tag", n));
                    if (tag != null) tagCache.put(n.toLowerCase().trim(), tag);
                } catch (Exception e) {
                    logger.warn("Migration: failed to create Tag value '{}': {}", n, e.getMessage());
                    result.errors++;
                }
            }

            // Step 5 (real run): per-file mutation in its own short transaction.
            final Map<String, com.dk_power.power_plant_java.entities.categories.Value> finalSystemByLower = systemByLower;
            for (Long id : allIds) {
                try {
                    Boolean changed = tx.execute(status -> {
                        FileObject f = fileRepo.findById(id).orElse(null);
                        if (f == null) return false;
                        boolean mutated = false;
                        Set<String> names = namesByFileId.get(id);
                        if (names != null) {
                            // Values cached across iterations are detached; the file's collection
                            // holds session-managed instances. HashSet uses Object identity, so
                            // .add() on an "already present" value with the same id would still
                            // return true and risk a duplicate row on the next flush. Compare by id.
                            java.util.Set<Long> existingSystemIds = f.getSystems().stream()
                                    .map(com.dk_power.power_plant_java.entities.categories.Value::getId)
                                    .collect(java.util.stream.Collectors.toSet());
                            java.util.Set<Long> existingTagIds = f.getTags().stream()
                                    .map(com.dk_power.power_plant_java.entities.categories.Value::getId)
                                    .collect(java.util.stream.Collectors.toSet());
                            for (String name : names) {
                                String lower = name.toLowerCase().trim();
                                com.dk_power.power_plant_java.entities.categories.Value sysVal = finalSystemByLower.get(lower);
                                if (sysVal != null) {
                                    if (!existingSystemIds.contains(sysVal.getId())) {
                                        f.getSystems().add(sysVal);
                                        existingSystemIds.add(sysVal.getId());
                                        result.systemsAssigned++;
                                        mutated = true;
                                    }
                                    continue;
                                }
                                com.dk_power.power_plant_java.entities.categories.Value tagVal = tagCache.get(lower);
                                if (tagVal != null && !existingTagIds.contains(tagVal.getId())) {
                                    f.getTags().add(tagVal);
                                    existingTagIds.add(tagVal.getId());
                                    result.tagsAssigned++;
                                    mutated = true;
                                }
                            }
                        }
                        if (mutated) {
                            // Force a scalar-field touch so Hibernate dirty-checks the
                            // parent row and @PostUpdate fires → FieldChangeEntityListener
                            // emits the new systems/tags assignments to other clients.
                            // Without this, the migration only writes join-table rows and
                            // sync silently misses them.
                            f.setDateModified(java.time.LocalDateTime.now());
                            fileRepo.save(f);
                        }
                        return mutated;
                    });
                    if (Boolean.TRUE.equals(changed)) result.filesUpdated++;
                } catch (Exception e) {
                    logger.warn("Migration: failed to update FileObject #{}: {}", id, e.getMessage());
                    result.errors++;
                }
            }
        } catch (Exception e) {
            logger.error("Migration: aborted with error", e);
            result.errors++;
        } finally {
            result.finishedAt = System.currentTimeMillis();
        }
        return result;
    }

    /**
     * Parse a {@code relatedSystems} CSV into a CASE-INSENSITIVE deduped set of
     * trimmed names, preserving the first-seen spelling for display. Strips literal
     * square brackets (legacy payloads sometimes saved as {@code [a, b, c]}), splits
     * on comma, trims, drops blanks. So {@code "Pump, pump, PUMP"} → {@code {"Pump"}}.
     */
    private Set<String> parseTagNamesFromCsv(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        String cleaned = csv.replace("[", "").replace("]", "");
        // LinkedHashMap keyed by lowercase, value = first-seen spelling.
        Map<String, String> byLower = new LinkedHashMap<>();
        for (String part : cleaned.split(",")) {
            String t = part.trim();
            if (t.isEmpty()) continue;
            byLower.putIfAbsent(t.toLowerCase(), t);
        }
        return new LinkedHashSet<>(byLower.values());
    }

}
