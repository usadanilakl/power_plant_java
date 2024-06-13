package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.*;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class PointServiceImpl extends GroupServiceImpl<Point>{
    private final PointRepo repository;
    private final VendorRepo vendorRepo;
    private final SystemRepo systemRepo;
    private final EquipmentTypeRepo equipmentTypeRepo;
    private final LocationRepo locationRepo;
    private final FileServiceImpl fileService;
    private final UniversalMapper mapper;
    public PointServiceImpl(PointRepo repository, VendorRepo vendorRepo, SystemRepo systemRepo, EquipmentTypeRepo equipmentTypeRepo, LocationRepo locationRepo, FileServiceImpl fileService, UniversalMapper mapper) {
        super(repository,mapper);
        this.repository = repository;
        this.vendorRepo = vendorRepo;
        this.systemRepo = systemRepo;
        this.equipmentTypeRepo = equipmentTypeRepo;
        this.locationRepo = locationRepo;
        this.fileService = fileService;
        this.mapper = mapper;
    }

    @Override
    public Point save(Point entity) {
        vendorRepo.save(entity.getVendor());
        systemRepo.save(entity.getSystem());
        locationRepo.save(entity.getLocation());
        equipmentTypeRepo.save(entity.getEqType());
        fileService.save(entity.getMainFile());
        return repository.save(entity);
    }
}
