package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class FileServiceImpl implements FileService{
    private final FileRepo fileRepo;
    private final LotoPointService lotoPointService;
    private final FileMapper fileMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
    private final ValueService valueService;


    public List<String> getVendors() {
        return fileRepo.getVendors();
    }
    public List<FileObject> getFilesByVendor(String value) {
        return fileRepo.findByVendor(value);
    }
    public List<FileDto> getAllDtos(String ext) {
        return getAll().stream().map(e->fileMapper.convertToDto(e,ext)).toList();
    }
    public List<FileDto> getAllDtos() {
        return getAll().stream().map(fileMapper::convertToDto).toList();
    }
    public List<String> getSystems() {
        return fileRepo.getSystems();
    }
    public FileObject saveForTransfer(FileDto transfer){
        FileObject file = convertToEntity(transfer);
        if(file.getFileType()!=null)file.setFileType(valueService.valueSetup("File Type",transfer.getFileType().getName()));
        if(file.getVendor()!=null)file.setVendor(valueService.valueSetup("Vendor",file.getVendor().getName()));
        file.setBaseLink("uploads");
        file.setExtension("jpg");
        file.buildFileLink();
        return save(file);
    }

    @Override
    public List<FileDto> getAllLight() {
        return fileRepo.getAllLight();
    }

    public List<FileObject> getIfNumberContains(String pid) {
        return fileRepo.findByFileNumberContaining(pid);
    }
    public FileObject getFileByNumber(String s) {
        return fileRepo.findByFileNumber(s);
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
        return fileRepo;
    }
    @Override
    public FileMapper getMapper() {
        return fileMapper;
    }
    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
