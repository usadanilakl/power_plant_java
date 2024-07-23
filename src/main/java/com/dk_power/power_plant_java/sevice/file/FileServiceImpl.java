package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class FileServiceImpl implements FileService {
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
    public List<FileDtoLight> getAllLight() {
        return fileRepo.getAllLight();
    }

    @Override
    public FileObject getByFileLink(String fileLink) {
        return fileRepo.findByFileLink(fileLink);
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

    @Override
    public FileObject convertToEntity(FileDto dto) {
        return fileMapper.convertToEntity(dto);
    }

    @Override
    public FileDto convertToDto(FileObject entity) {
        return fileMapper.convertToDto(entity);
    }
    @Override
    public List<FileObject> getByVendor(Value oldVal) {
        return fileRepo.findByVendor(oldVal);
    }
    @Override
    public List<FileObject> getBySystem(Value oldVal) {
        return fileRepo.findBySystem(oldVal);
    }
    @Override
    public List<FileObject> getByFileType(Value oldVal) {
        return fileRepo.findByFileType(oldVal);
    }

    @Override
    public List<FileObject> getByValue(Value val) {
        List<FileObject> result = new ArrayList<>();
        String cat = val.getCategory().getAlias();
        if(cat.equals("vendor")) result.addAll(getByVendor(val));
        if(cat.equals("system")) result.addAll(getBySystem(val));
        if(cat.equals("fileType")) result.addAll(getByFileType(val));
        return result;
    }

    @Override
    public void refactor(Value old, Value _new) {
        String cat = old.getCategory().getAlias();
        for (FileObject f : getByValue(old)) {
            if(cat.equals("vendor"))f.setVendor(_new);
            if(cat.equals("system"))f.setSystem(_new);
            if(cat.equals("fileType"))f.setFileType(_new);
            save(f);
        }
    }
}
