package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.util.FileUtil;
import com.dk_power.power_plant_java.util.PdfConverter;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NgFileService implements NgCrudService<FileObject, FileDto,FileRepo, FileMapper> {
    private final FileRepo fileRepo;
    private final FileMapper fileMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Value("${files.root.path}")
    String filesRootPath;
    @Value("${files.relative.path}")
    String filesRelativePath;

    @Override
    public FileObject getEntity() {
        return new FileObject()  ;
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



    public Page<FileDto> complexSearch(String searchString, int page, int size){
        Map<String,String> searchCriteria = new HashMap<>();
        searchCriteria.put("fileNumber", searchString);
        searchCriteria.put("name", searchString);
        searchCriteria.put("fileType.name", searchString);
        searchCriteria.put("vendor.name", searchString);
        searchCriteria.put("relatedSystems", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
//        return complexSearch(sc).stream().map(this::toDto).toList();
        return complexSearch(sc, page, size, "fileNumber", "asc",false);
    }

    public Optional<FileDto> findById(Long id) {
        Optional<FileObject> byId = fileRepo.findById(id);
        return byId.map(this::toDto);
    }

public FileDto findByFileLink(String imageUrl) {
    // Remove "http://localhost:port/" if present
    String url = imageUrl.trim().replaceFirst("^(https?://localhost(:\\d+)?)/", "");
    FileObject byFileLink = fileRepo.findByFileLink(url);
    if(byFileLink == null) throw new RuntimeException("File not found for link: " + imageUrl);
    // Now use the cleaned url to find the FileObject
    return this.toDto(byFileLink);
}

    public String uploadFile(MultipartFile file, String fileLink, boolean override) throws IOException {
        Path path = Paths.get(filesRootPath,fileLink);
        return FileUtil.uploadFileToLocal(file, path.toString(), override);
    }

    public String uploadFile(File file, String fileLink, boolean override) throws IOException {
        Path path = Paths.get(filesRootPath,fileLink);
        return FileUtil.uploadFileToLocal(file, path.toString(), override);
    }

    public List<String> separateAndUploadPdfFileWithConversion(MultipartFile file, String fileLink, boolean override) throws IOException {
        if(!Objects.requireNonNull(file.getOriginalFilename()).endsWith(".pdf")) {
            throw new RuntimeException("File must be a PDF");
        }
        List<File> files = PdfConverter.splitPdfIntoSinglePageFiles(file);
        Path fileLinkPath = Paths.get(fileLink);
        Path parentPath = fileLinkPath.getParent();
        String pdfPath = parentPath != null ? parentPath.toString() : "";
        String jpgPath = pdfPath.replaceAll("pdf","jpg");

        List<String> fileLinks = new ArrayList<>();
        for(File pdf : files) {
            fileLinks.add(uploadFile(pdf, fileLink, override));
            File jpg = PdfConverter.convertPdfToJpg(pdf);
            fileLinks.add(uploadFile(jpg, jpgPath, override));
        }

        return fileLinks;
    }

    public FileDto updateFile(FileIdDto fileDto) {
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
        FileObject entity = toEntity(dto);
        String extension = FileUtil.getFileExtension(entity.getFileLink());
        entity.setBaseLink(filesRelativePath);
        entity.setExtension(extension);
        String folder = entity.buildFolder();
        String fileLink = entity.buildFileLink();
        return save(entity);
    }

    public List<FileDto> processPidFile(FileIdDto fileDto, MultipartFile file, boolean override) throws IOException {
        String fileExtension = FileUtil.getFileExtension(fileDto.getFileLink());
//        String folder = fileDto.buildFolder();
        List<String> strings = separateAndUploadPdfFileWithConversion(file, fileDto.getFileLink(), override);
        return null;
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
        FileObject file = getEntityById(id);
        try {
            FileUtil.deleteFile(Paths.get(file.getFileLink()));
        } catch (IOException e) {
            e.printStackTrace();
        }
        return NgCrudService.super.softDelete(file);
    }
}
