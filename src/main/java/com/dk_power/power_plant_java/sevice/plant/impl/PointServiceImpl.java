package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.dto.plant.PointDto;
import com.dk_power.power_plant_java.entities.equipment.Point;
import com.dk_power.power_plant_java.entities2.FileObject;
import com.dk_power.power_plant_java.mappers.PointMapper;
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
    private final PointMapper pointMapper;
    private final UniversalMapper mapper;
    public PointServiceImpl(PointRepo repo, VendorServiceImpl vendorService, SystemServiceImpl systemService, EquipmentTypeServiceImpl equipmentTypeService, LocationServiceImpl locationService, @Lazy FileServiceImpl fileService, PointMapper mapper, UniversalMapper universalMapper) {
        super(repo,universalMapper);
        this.repo = repo;
        this.vendorService = vendorService;
        this.systemService = systemService;
        this.equipmentTypeService = equipmentTypeService;
        this.locationService = locationService;
        this.fileService = fileService;
        this.pointMapper = mapper;
        this.mapper = universalMapper;
    }

    public List<Point> getByCoords(String coord){
        return repo.findByCoordinates(coord);
    }


    public Point saveForTransfer(Point transfer) {

        List<Point> points = repo.findByCoordinates(transfer.getCoordinates());
        for (Point point : points) {
            if(
                    point != null &&
                    point.getLabel()!=null &&
                    transfer.getLabel()!=null &&
                    point.getLabel().equals(transfer.getLabel())
            ) transfer.setId(point.getId());
        }

        vendorService.saveForTransfer(transfer.getVendor());
        equipmentTypeService.saveForTransfer(transfer.getEqType());

        FileObject file = null;
        List<FileObject> files = fileService.getIfNumberContains(transfer.getPid());

        if(files!=null && files.size()==1)  file = files.get(0);
        else if(files!=null&&files.size()>1){
            for (FileObject e : files) {
                if( e.getVendor().getName().equals(transfer.getVendor().getName())) file = e;
            }
        }

        if(file==null){
            file = new FileObject();
            file.setFileNumber(transfer.getPid());
            System.out.println(file.getFileNumber()+" is null");
        }
        file.addPoint(transfer);
        save(transfer);
        fileService.save(file);
        transfer.setMainFile(file);
        transfer.addFile(file);
        return save(transfer);
    }
    public void saveAllForTransfer(List<Point> transers){
        transers.forEach(this::saveForTransfer);
    }

    public PointDto getPointDtoById(Long id) {
        return pointMapper.convertToDto(getById(id));
    }
    public Point updatePoint(PointDto dto){
        return save(pointMapper.convertToEntity(dto));
    }
}
