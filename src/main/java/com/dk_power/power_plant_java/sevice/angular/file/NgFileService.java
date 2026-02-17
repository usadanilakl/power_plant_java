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
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.file.TrashService;
import com.dk_power.power_plant_java.util.FileUtil;
import com.dk_power.power_plant_java.util.PdfConverter;
import com.dk_power.power_plant_java.util.RenamedMultipartFile;
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
        return itemsPage.map(this::toDtoLight);
    }

    public Optional<FileDto> findDtoById(Long id) {
        Optional<FileObject> byId = fileRepo.findById(id);
        return byId.map(this::toDto);
    }

    private FileObject getFileByNumber(String fileNumber) {
        return fileRepo.findByFileNumber(fileNumber);
    }

    public FileDto findByFileLink(String imageUrl) {
        // Remove "http://localhost:port/" if present
        String url = imageUrl.trim().replaceFirst("^(https?://localhost(:\\d+)?)/", "");
        FileObject byFileLink = fileRepo.findByFileLink(url);
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

    public List<String> separateAndUploadPdfFileWithConversion(MultipartFile file, String fileLink, boolean override) throws IOException {
        if (!Objects.requireNonNull(file.getOriginalFilename()).endsWith(".pdf")) {
            throw new RuntimeException("File must be a PDF");
        }
        Path fileLinkPath = Paths.get(fileLink);
        Path parentPath = fileLinkPath.getParent();
        String fileName = FileUtil.getNameFromPathWithoutExtension(fileLinkPath.getFileName().toString());
        String pdfPath = parentPath != null ? parentPath.toString() : "";
        String jpgPath = pdfPath.replaceAll("pdf", "jpg");
        List<File> files = PdfConverter.splitPdfIntoSinglePageFiles(file, fileName);

        List<String> fileLinks = new ArrayList<>();
        for (File pdf : files) {
            try {
                fileLinks.add(uploadFile(pdf, pdfPath, override));
                File jpg = PdfConverter.convertPdfToJpg(pdf);
                uploadFile(jpg, jpgPath, override);
                Files.delete(pdf.toPath());
                Files.delete(jpg.toPath());
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return fileLinks;
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

        if (file == null) throw new RuntimeException("File is required");

        String originalFilename = file.getOriginalFilename();
        String fileNumber = fileMapper.convertFileNumberArrayToString(fileDto.getFileNumber());
        if (originalFilename == null) {
            throw new RuntimeException("Original filename is null");
        }
        String fileExtension = FileUtil.getFileExtension(originalFilename);
        String fileName = fileNumber != null && !fileNumber.isEmpty() ? fileNumber : originalFilename;
        FileObject fileObject = convertIdDtoToEntity(fileDto);
        fileObject.setBaseLink(filesRelativePath);
        fileObject.setExtension(fileExtension);
        String fileLink = fileObject.buildFileLink();
        String folder = fileObject.buildFolder();

        MultipartFile renamedFile = new RenamedMultipartFile(file, fileName + "." + fileExtension);
        List<String> strings = separateAndUploadPdfFileWithConversion(renamedFile, fileLink, override);

        List<FileDto> fileDtos = new ArrayList<>();
        if (strings.size() == 1) {
            String path = strings.get(0);
            String nameFromPath = FileUtil.getNameFromPath(path);
            fileObject.setExtension(FileUtil.getFileExtension(path));
            fileObject.setFileNumber(FileUtil.getNameFromPathWithoutExtension(nameFromPath));
            fileObject.buildFolder();
            fileObject.buildFileLink();
            fileObject.addExtension("pdf");
            fileObject.addExtension("jpg");
            FileObject save = save(fileObject);
            fileDtos.add(toDto(save));
        } else {
            for (String path : strings) {
                String nameFromPath = FileUtil.getNameFromPath(path);
                FileObject newFile = new FileObject();
                newFile.setName(fileObject.getName());
                newFile.setFileType(fileObject.getFileType());
                newFile.setVendor(fileObject.getVendor());
                newFile.setBaseLink(filesRelativePath);
                newFile.setExtension(FileUtil.getFileExtension(path));
                newFile.setFileNumber(FileUtil.getNameFromPathWithoutExtension(nameFromPath));
                newFile.buildFolder();
                newFile.buildFileLink();
                newFile.addExtension("pdf");
                newFile.addExtension("jpg");
                FileObject save = save(newFile);
                fileDtos.add(toDto(save));
            }
        }
        return fileDtos;
    }

    /**
     * Process multiple PDF files at once.
     * All files share the same fileType and vendor.
     * File number is derived from the original filename (without extension).
     * File name uses sharedFileName if provided, otherwise uses original filename.
     */
    public List<FileDto> processMultiplePdfFiles(List<MultipartFile> files, Long fileTypeId, Long vendorId, String sharedFileName) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new RuntimeException("No files provided");
        }

        // Get the Value entities for fileType and vendor
        var fileType = valueRepo.findById(fileTypeId)
                .orElseThrow(() -> new RuntimeException("File type not found with id: " + fileTypeId));
        var vendor = valueRepo.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + vendorId));

        // Determine if we should use a shared file name
        boolean useSharedName = sharedFileName != null && !sharedFileName.trim().isEmpty();
        String effectiveSharedName = useSharedName ? sharedFileName.trim() : null;

        List<FileDto> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                logger.warn("Skipping file with null filename");
                continue;
            }

            // Extract file name without extension to use as fileNumber (always from original filename)
            String fileNameWithoutExtension = FileUtil.getNameFromPathWithoutExtension(originalFilename);
            // Use shared name for "name" field if provided, otherwise use original filename
            String effectiveName = useSharedName ? effectiveSharedName : fileNameWithoutExtension;

            // Create new FileObject
            FileObject fileObject = new FileObject();
            fileObject.setName(effectiveName);
            fileObject.setFileNumber(fileNameWithoutExtension);
            fileObject.setFileType(fileType);
            fileObject.setVendor(vendor);
            fileObject.setBaseLink(filesRelativePath);
            fileObject.setExtension("pdf");

            // Build paths
            String fileLink = fileObject.buildFileLink();
            fileObject.buildFolder();

            // Rename the file to use the extracted name
            MultipartFile renamedFile = new RenamedMultipartFile(file, fileNameWithoutExtension + ".pdf");

            // Process the file (convert to jpg, etc.)
            List<String> processedPaths = separateAndUploadPdfFileWithConversion(renamedFile, fileLink, false);

            // For single-page PDFs, update the existing fileObject
            // For multi-page PDFs, create separate FileObjects for each page
            if (processedPaths.size() == 1) {
                String path = processedPaths.get(0);
                String nameFromPath = FileUtil.getNameFromPath(path);
                fileObject.setExtension(FileUtil.getFileExtension(path));
                fileObject.setFileNumber(FileUtil.getNameFromPathWithoutExtension(nameFromPath));
                fileObject.buildFolder();
                fileObject.buildFileLink();
                fileObject.addExtension("pdf");
                fileObject.addExtension("jpg");
                FileObject saved = save(fileObject);
                uploadedFiles.add(toDto(saved));
            } else {
                // Multi-page PDF - create separate entries for each page
                for (String path : processedPaths) {
                    String nameFromPath = FileUtil.getNameFromPath(path);
                    FileObject newFile = new FileObject();
                    newFile.setName(fileNameWithoutExtension);
                    newFile.setFileType(fileType);
                    newFile.setVendor(vendor);
                    newFile.setBaseLink(filesRelativePath);
                    newFile.setExtension(FileUtil.getFileExtension(path));
                    newFile.setFileNumber(FileUtil.getNameFromPathWithoutExtension(nameFromPath));
                    newFile.buildFolder();
                    newFile.buildFileLink();
                    newFile.addExtension("pdf");
                    newFile.addExtension("jpg");
                    FileObject saved = save(newFile);
                    uploadedFiles.add(toDto(saved));
                }
            }

            logger.info("Processed file: {} -> {} file objects", originalFilename,
                    processedPaths.size() == 1 ? 1 : processedPaths.size());
        }

        logger.info("Multi-upload completed: {} files uploaded, {} file objects created",
                files.size(), uploadedFiles.size());
        return uploadedFiles;
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


    public List<FileDto> getByFileType(String fileType) {
        return fileRepo.findByFileType_Name(fileType).stream().map(this::toDto).toList();
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
        FileObject entityByFileLink = fileRepo.findByFileLink(pdfLink);
        System.out.println(entityByFileLink);
        if(entityByFileLink == null){
            String fileNumber = FileObject.getFileNumberFromLink(fileLink);
            System.out.println("FileNumber: " + fileNumber);
            entityByFileLink = fileRepo.findByFileNumber(fileNumber);
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

}
