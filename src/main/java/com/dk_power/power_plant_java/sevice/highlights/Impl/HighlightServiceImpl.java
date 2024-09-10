package com.dk_power.power_plant_java.sevice.highlights.Impl;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.highlights.Highlight;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.repository.highlights.HighlightRepo;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.highlights.HighlightService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;


@Service
@AllArgsConstructor
@Transactional
public class HighlightServiceImpl implements HighlightService {
    private final HighlightRepo highlightRepo;
    private final HighlightMapper highlightMapper;
    private final SessionFactory sessionFactory;
    private final EquipmentService equipmentService;
    private final FileService fileService;


    @Override
    public Highlight getEntity() {
        return new Highlight();
    }

    @Override
    public HighlightDto getDto() {
        return new HighlightDto();
    }

    @Override
    public HighlightRepo getRepo() {
        return highlightRepo;
    }

    @Override
    public HighlightMapper getMapper() {
        return highlightMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }


    @Override
    public void transferEqToHighlights(Equipment equipment) {
        Highlight highlight = new Highlight();
        FileObject mainFile = equipment.getMainFile();
        highlight.setCoordinates(equipment.getCoordinates());
        highlight.setOriginalPictureSize(equipment.getOriginalPictureSize());
        highlight.buildPictureSize();
        highlight.buildCoordinates();
        highlight.setFile(mainFile);
        highlight.setTagNumber(equipment.getTagNumber());
        highlight.setEquipment(equipment);
        save(highlight);
//        equipment.getHighlights().add(highlight);
//        equipmentService.save(equipment);
//        mainFile.getHighlights().add(highlight);
//        fileService.save(mainFile);
    }

    @Override
    public void transferConnectorToHighlights(Equipment equipment) {
        Highlight highlight = new Highlight();
        boolean isExisting = false;
        if(equipment.getHighlights()!=null || equipment.getHighlights().size()!=0){
            for (Highlight e : equipment.getHighlights()){
                if (e.getCoordinates().equalsIgnoreCase(equipment.getCoordinates())) {
                    isExisting = true;
                    break;
                }
            }
        }
        if(!isExisting){
            FileObject mainFile = equipment.getMainFile();
            FileObject connectorFile = fileService.getIfDocNumberContains(equipment.getTagNumber()).get(0);
            highlight.setCoordinates(equipment.getCoordinates());
            highlight.setOriginalPictureSize(equipment.getOriginalPictureSize());
            highlight.buildPictureSize();
            highlight.buildCoordinates();
            highlight.setFile(mainFile);
            highlight.setTagNumber(equipment.getTagNumber());
            highlight.setConnector(connectorFile);
            save(highlight);
            equipment.setNote("Deleted from Equipment to be independent connector");
            equipmentService.softDelete(equipment);
        }

    }
    @Override
    public Equipment combineDuplicatesAndCreateHighlights(String tagNumber) {
        List<Equipment> byTagNumber = equipmentService.getByTagNumber(tagNumber);
        Equipment keeper = byTagNumber.get(0);
        if(keeper.getDescription()==null){
            byTagNumber.forEach(el->{
                if(el.getDescription()!=null) keeper.setDescription(el.getDescription());
            });
        }
        if(keeper.getSpecificLocation()==null){
            byTagNumber.forEach(el->{
                if(el.getSpecificLocation()!=null) keeper.setSpecificLocation(el.getSpecificLocation());
            });
        }
        if(keeper.getLocation()==null){
            byTagNumber.forEach(el->{
                if(el.getLocation()!=null) keeper.setLocation(el.getLocation());
            });
        }
        if(keeper.getEqType()==null){
            byTagNumber.forEach(el->{
                if(el.getEqType()!=null) keeper.setEqType(el.getEqType());
            });
        }
        if(keeper.getSystem()==null){
            byTagNumber.forEach(el->{
                if(el.getSystem()!=null) keeper.setSystem(el.getSystem());
            });
        }
        if(keeper.getVendor()==null){
            byTagNumber.forEach(el->{
                if(el.getVendor()!=null) keeper.setVendor(el.getVendor());
            });
        }
        byTagNumber.forEach(e->{
            e.getLotoPoints().forEach(p->keeper.getLotoPoints().add(p));
            Highlight h = new Highlight();
            h.setCoordinates(e.getCoordinates());
            h.setOriginalPictureSize(e.getOriginalPictureSize());
            h.buildPictureSize();
            h.buildCoordinates();
            h.setEquipment(keeper);
            h.setTagNumber(keeper.getTagNumber());
            h.setFile(e.getMainFile());
            save(h);
        });
        byTagNumber.forEach(e->{
            if(e.getId()!=keeper.getId()){
                e.setNote("Deleted as a duplicate after merging into " + keeper.getId());
                equipmentService.softDelete(e);
            }
        });
        return equipmentService.save(keeper);
    }

    @Override
    public void fixConnectorsBeforeTranser() {
        List<Equipment> connectors = equipmentService.getAll().stream().filter(e -> e.getEqType() != null && e.getEqType().getName().equalsIgnoreCase("connector")).toList();
        System.out.println(connectors.size() + " connectors found");

        connectors.forEach(e->{
            e.setTagNumber(e.getTagNumber().trim());
            if(e.getTagNumber().equals("2080_00007-2")) e.setTagNumber("2080_00007-1");
            if(e.getTagNumber().equals("2080_00009-1"))e.setTagNumber("2080_00009");
            equipmentService.save(e);
            if(e.getTagNumber().equals("T3463AAAA230-2") ||
                    e.getTagNumber().equals("310QK23-028") ||
                    e.getTagNumber().equals("S-80071") ||
                    e.getTagNumber().equals("Drain Note 9")){
                e.setNote("Deleted Connectors to files that are not tagged");
                equipmentService.softDelete(e);
            }




        });
    }
}
