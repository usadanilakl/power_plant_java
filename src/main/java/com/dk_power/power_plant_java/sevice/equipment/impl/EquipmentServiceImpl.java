package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.stream.Location;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
@Transactional
public class EquipmentServiceImpl implements EquipmentService {
    private final EquipmentRepo equipmentRepo;
    private final EquipmentMapper equipmentMapper;
    private final SessionFactory sessionFactory;
    private final ValueService valueService;
    private final CategoryService categoryService;
    private final FileServiceImpl fileService;
    private final LotoPointService lotoPointService;



    @Override
    public Equipment getEntity() {
        return new Equipment();
    }

    @Override
    public EquipmentDto getDto() {
        return new EquipmentDto();
    }

    @Override
    public EquipmentRepo getRepo() {
        return equipmentRepo;
    }

    @Override
    public EquipmentMapper getMapper() {
        return equipmentMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
    public List<Equipment> getByCoords(String coord){
        return equipmentRepo.findByCoordinates(coord);
    }


    public Equipment saveForTransfer(Equipment transfer) {

        List<Equipment> points = equipmentRepo.findByCoordinates(transfer.getCoordinates());
        for (Equipment point : points) {
            if(
                    point != null &&
                    point.getTagNumber()!=null &&
                    transfer.getTagNumber()!=null &&
                    point.getTagNumber().equals(transfer.getTagNumber())
                ) {
                    transfer.setId(point.getId());
                }
        }

        if(transfer.getVendor()!=null) transfer.setVendor(valueService.valueSetup("Vendor",transfer.getVendor().getName()) );
        if(transfer.getEqType()!=null) transfer.setEqType(valueService.valueSetup("Equipment Type",transfer.getEqType().getName()) );


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

    @Override
    public void combineDuplicates(String tagNumber) {
        List<Equipment> byTagNumber = equipmentRepo.findByTagNumber(tagNumber);
        String descr = "";
        String loc = "";
        for(Equipment e:byTagNumber){
//            if(e.getDescription()!=null) System.out.println(e.getDescription());
//            if(e.getEqType()!=null) System.out.println(e.getEqType().getId());
//            if(e.getSystem()!=null) System.out.println(e.getSystem().getId());
//            if(e.getSpecificLocation()!=null) System.out.println(e.getSpecificLocation());
            if(e.getLocation()!=null) loc +=e.getLocation().getId()+", ";
            descr += e.getDescription()+",";

        }

        System.out.println(descr);
        System.out.println(loc);



    }

    @Override
    public List<Equipment> getTagNumberDuplicates() {
        List<String> duplicateTagNumbers = equipmentRepo.findDuplicateTagNumbers();
        List<Equipment> result = new ArrayList<>();
        duplicateTagNumbers.forEach(e->result.addAll(equipmentRepo.findByTagNumber(e)));
        return result;
    }

    @Override
    public List<Equipment> getByTagNumber(String tag) {
        return equipmentRepo.findByTagNumber(tag);
    }

    public void saveAllForTransfer(List<Equipment> transfers){
        transfers.forEach(this::saveForTransfer);
    }

    @Override
    public EquipmentDto convertToDto(Equipment entity) {
        return getMapper().convertToDto(entity);
    }
    @Override
    public Equipment convertToEntity(EquipmentDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public Equipment update(Equipment entity) {
        if(entity!=null){
            Set<LotoPoint> savedLotoPoints = new HashSet<>();
            for (LotoPoint lotoPoint : entity.getLotoPoints()) {
                lotoPoint.getEquipmentList().add(entity);
                savedLotoPoints.add(lotoPointService.save(lotoPoint));
            }
            entity.setLotoPoints(savedLotoPoints);
            FileObject mainFile = entity.getMainFile();
            mainFile.addPoint(entity);
            fileService.save(mainFile);

        }
        return save(entity);
    }
    @Override
    public Equipment update(String id) {
        return EquipmentService.super.update(id);
    }

//    @Override
//    public Equipment save(Equipment entity) {
//        Equipment oldEntity = getEntityById(entity.getId());
//
//        // Identify LotoPoints to be removed
//        Set<LotoPoint> existingLotoPoints = new HashSet<>(oldEntity.getLotoPoints());
//        Set<LotoPoint> updatedLotoPoints = entity.getLotoPoints();
//
//        // Find LotoPoints to remove
//        existingLotoPoints.removeAll(updatedLotoPoints);
//
//        // Remove the LotoPoints from the old entity
//        for (LotoPoint lotoPoint : existingLotoPoints) {
//            lotoPoint.removeEquipment(entity);
//            lotoPointService.save(lotoPoint);
//        }
//
//        //Save new equipment
//        Set<LotoPoint> savedLotoPoints = new HashSet<>();
//        for (LotoPoint lotoPoint : entity.getLotoPoints()) {
//            lotoPoint.addEquipment(entity);
//            savedLotoPoints.add(lotoPointService.save(lotoPoint));
//        }
//        entity.setLotoPoints(savedLotoPoints);
//
//        //Save FileObject
//        FileObject mainFile = entity.getMainFile();
//        mainFile.addPoint(entity);
//
//        //remove equipment from removed files
//        List<FileObject> filesToRemove = new ArrayList<>(oldEntity.getFiles());
//        filesToRemove.removeAll(entity.getFiles());
//        for (FileObject f : filesToRemove) {
//            f.removePoint(entity);
//            fileService.save(f);
//        }
//
//        fileService.save(mainFile);
//        return equipmentRepo.save(entity);
//    }

//    @Override
//    public Equipment save(EquipmentDto dto) {
//        Equipment entity = convertToEntity(dto);
//        return save(entity);
//    }
    @Override
    public List<Equipment> getByVendor(Value oldVal) {
        return equipmentRepo.findByVendor(oldVal);
    }
    @Override
    public List<Equipment> getByEqType(Value oldVal) {
        return equipmentRepo.findByEqType(oldVal);
    }
    @Override
    public List<Equipment> getBySystem(Value oldVal) {
        return equipmentRepo.findBySystem(oldVal);
    }
    @Override
    public List<Equipment> getByLocation(Value oldVal) {
        return equipmentRepo.findByLocation(oldVal);
    }

    @Override
    public List<Equipment> getByValue(Value val) {
        List<Equipment> result = new ArrayList<>();
        String cat = val.getCategory().getAlias();
        if(cat.equals("vendor")) result.addAll(getByVendor(val));
        if(cat.equals("system")) result.addAll(getBySystem(val));
        if(cat.equals("eqType")) result.addAll(getByEqType(val));
        if(cat.equals("location")) result.addAll(getByLocation(val));
        return result;
    }

    @Override
    public void refactor(Value old, Value _new) {
        String cat = old.getCategory().getAlias();
        for (Equipment f : getByValue(old)) {
            if(cat.equals("vendor"))f.setVendor(_new);
            if(cat.equals("system"))f.setSystem(_new);
            if(cat.equals("eqType"))f.setEqType(_new);
            if(cat.equals("location"))f.setLocation(_new);
            save(f);
        }
    }



//    @Override
//    public Equipment softDelete(Equipment entity) {
//        FileObject mainFile = entity.getMainFile();
//        mainFile.getPoints().stream().map(e->{if(e.getId() == entity.getId()) fileService.softDelete(e);})
//    }
}
