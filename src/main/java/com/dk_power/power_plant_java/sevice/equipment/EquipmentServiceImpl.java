package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.mappers.EquipmentMapper;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class EquipmentServiceImpl implements EquipmentService{
    private final EquipmentRepo equipmentRepo;
    private final EquipmentMapper equipmentMapper;
    private final SessionFactory sessionFactory;
    private final ValueService valueService;
    private final CategoryService categoryService;
    private final FileServiceImpl fileService;



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
                    point.getLabel()!=null &&
                    transfer.getLabel()!=null &&
                    point.getLabel().equals(transfer.getLabel())
                ) transfer.setId(point.getId());
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
    public void saveAllForTransfer(List<Equipment> transfers){
        transfers.forEach(this::saveForTransfer);
    }
}
