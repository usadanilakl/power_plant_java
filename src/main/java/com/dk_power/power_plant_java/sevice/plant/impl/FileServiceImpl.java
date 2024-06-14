package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FileServiceImpl extends GroupServiceImpl<FileObject>{
    private final FileRepo repo;
    private final FileTypeServiceImpl fileTypeService;
    private final SystemServiceImpl systemService;
    private final VendorServiceImpl vendorService;
    private final PointServiceImpl pointService;
    public FileServiceImpl(FileRepo repo, UniversalMapper mapper, FileRepo repo1, FileTypeServiceImpl fileTypeService, SystemServiceImpl systemService, VendorServiceImpl vendorService, PointServiceImpl pointService) {
        super(repo, mapper);
        this.repo = repo1;
        this.fileTypeService = fileTypeService;
        this.systemService = systemService;
        this.vendorService = vendorService;
        this.pointService = pointService;
    }
    @Override
    public String delete(Long id) {
        FileObject entity = getById(id);
        String path = entity.getFileLink();
        repo.delete(entity);
        return path;
    }
    public List<String> getVendors() {
        return repo.getVendors();
    }
    public List<FileObject> getFilesByVendor(String value) {
        return repo.findByVendor(value);
    }
    public List<FileDto> getAllDtos() {
        return mapper.convertAll(getAll(),new FileDto());
    }
    public List<String> getSystems() {
        return repo.getSystems();
    }
    public FileObject saveForTransfer(FileObject transfer){
        fileTypeService.saveForTransfer(transfer.getFileType());
        if(transfer.getSystem()!=null)systemService.saveForTransfer(transfer.getSystem());
        if(transfer.getVendor()!=null)vendorService.saveForTransfer(transfer.getVendor());
        if(transfer.getPoints()!=null)pointService.saveAllForTransfer(transfer.getPoints());
        FileObject entity = repo.findByFileNumber(transfer.getFileNumber());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }

    public List<FileObject> getIfNumberContains(String pid) {
        return repo.findByFileNumberContaining(pid);
    }
}
