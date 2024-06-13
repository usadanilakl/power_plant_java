package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.*;
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
    public PointServiceImpl(PointRepo repo, VendorServiceImpl vendorService, SystemServiceImpl systemService, EquipmentTypeServiceImpl equipmentTypeService, LocationServiceImpl locationService, FileServiceImpl fileService, UniversalMapper mapper) {
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
        vendorService.saveForTransfer(transfer.getVendor());
        systemService.saveForTransfer(transfer.getSystem());
        locationService.saveForTransfer(transfer.getLocation());
        equipmentTypeService.saveForTransfer(transfer.getEqType());
        fileService.saveForTransfer(transfer.getMainFile());
        Point entity = repo.findByLabel(transfer.getLabel());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }
    public void saveAllForTransfer(List<Point> transers){
        transers.forEach(this::saveForTransfer);
    }

}
