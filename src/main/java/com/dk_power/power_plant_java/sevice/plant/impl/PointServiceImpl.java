package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PointServiceImpl extends GroupServiceImpl<Point>{
    private final PointRepo repo;
    private final VendorServiceImpl vendorService;
    private final SystemServiceImpl systemService;
    private final EquipmentTypeServiceImpl equipmentTypeService;
    private final LocationServiceImpl locationService;
    private final FileServiceImpl fileService;
    private final UniversalMapper mapper;
    public PointServiceImpl(PointRepo repo, VendorServiceImpl vendorService, SystemServiceImpl systemService, EquipmentTypeServiceImpl equipmentTypeService, LocationServiceImpl locationService, @Lazy FileServiceImpl fileService, UniversalMapper mapper) {
        super(repo,mapper);
        this.repo = repo;
        this.vendorService = vendorService;
        this.systemService = systemService;
        this.equipmentTypeService = equipmentTypeService;
        this.locationService = locationService;
        this.fileService = fileService;
        this.mapper = mapper;
    }

    @Override
    public Point saveForTransfer(Point transfer) {
        if(transfer.getVendor()!=null) vendorService.saveForTransfer(transfer.getVendor());
        if(transfer.getSystem()!=null) systemService.saveForTransfer(transfer.getSystem());
        if(transfer.getLocation()!=null) locationService.saveForTransfer(transfer.getLocation());
        if(transfer.getEqType()!=null) equipmentTypeService.saveForTransfer(transfer.getEqType());
        Point entity = repo.findByLabel(transfer.getLabel());
        if(entity!=null) transfer.setId(entity.getId());
        List<FileObject> files = fileService.getIfNumberContains(transfer.getPid());
        if(files!=null&&files.size()>1) files.forEach(e-> System.out.println(e));
        FileObject file = null;
        if(files!=null && files.size()>0)  file = files.get(0);

        if(file==null){
            file = new FileObject();
            file.setFileNumber(transfer.getPid());
            System.out.println(file.getFileNumber());
        }
        file.addPoint(entity);
        fileService.save(file);
        transfer.setMainFile(file);

        return save(transfer);
    }
    public void saveAllForTransfer(List<Point> transers){
        transers.forEach(this::saveForTransfer);
    }

}
