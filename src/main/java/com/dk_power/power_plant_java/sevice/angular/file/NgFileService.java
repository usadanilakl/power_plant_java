package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.util.FileUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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

    public String uploadFile(MultipartFile file, String fileLink) throws IOException {
        Path path = Paths.get(filesRootPath,fileLink);
        return FileUtil.uploadFileToLocal(file, path.toString(), false);
    }

    public FileDto updateFile(FileDto fileDto) {
        throw new RuntimeException("Not implemented yet");

    }
}
