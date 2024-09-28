package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.repository.equipment.HighlightRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HighlightService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Service
@AllArgsConstructor
@Transactional
public class HighlightServiceImpl implements HighlightService {
    private final HighlightRepo highlightRepo;
    private final HighlightMapper highlightMapper;
    private final SessionFactory sessionFactory;
    private final EquipmentService equipmentService;
    private final FileService fileService;
    private final TransferExcecutionService transferExcecutionService;
    private final HeatTraceService heatTraceService;


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
//        Iterator<Equipment> eqIterator = byTagNumber.iterator();
//        while (eqIterator.hasNext()){
//            Equipment e = eqIterator.next();
//            e.getHeatTraceList().stream().forEach(ht -> {
//                if (!ht.getEquipmentList().contains(keeper)) {
//                    ht.getEquipmentList().add(keeper);
//                }
////                ht.getEquipmentList().removeIf(eq -> eq.getId().equals(e.getId()) && !eq.getId().equals(keeper.getId()));
//                heatTraceService.save(ht);
//            });
//        }
//        byTagNumber.forEach(e->{
//            if(!e.getId().equals(keeper.getId())){
//                e.getHeatTraceList().forEach(ht->{
//                    ht.getEquipmentList().add(keeper);
//                    heatTraceService.save(ht);
//                });
//            }
//        });
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
    @Override
    public void fixCoordinates(){
        for (Equipment e : equipmentService.getAll()) {
            if(e.getCoordinates().contains("undefined") ||e.getCoordinates().contains("null")){
                System.out.println(e.getCoordinates() + " " + e.getTagNumber() + " " + e.getMainFile().getDocNumber());
                if(e.getCoordinates().contains("startX:null")){
                    e.setNote("missing x coords");
                    equipmentService.softDelete(e);
                    continue;
                }
                e.setCoordinates(e.getCoordinates().replaceAll("undefined","").replaceAll("null",""));
                equipmentService.save(e);
            }
        }
    }
    public void fixOriginalSize(){
        for (Equipment e : equipmentService.getAll()) {
            if(e.getOriginalPictureSize()==null || e.getOriginalPictureSize().contains("undefined") ||e.getOriginalPictureSize().contains("null")){
                System.out.println(e.getTagNumber() + " was deleted");
                e.setNote("was deleted because no original size");
                equipmentService.softDelete(e);
                equipmentService.save(e);
            }
        }
    }
    public void performTransfer(){
        transferExcecutionService.addDocNumberToExistingFiles();
        fixConnectorsBeforeTranser();
        fixCoordinates();
        fixOriginalSize();

        List<Equipment> connector = equipmentService.getAll().stream().filter(e -> e.getEqType() != null && e.getEqType().getName().equalsIgnoreCase("connector")).toList();
        connector.forEach(this::transferConnectorToHighlights);

        List<String> duplicateTagStrings = equipmentService.getDuplicateTagStrings();
        Set<String> setOfDuplicates = new HashSet<>(duplicateTagStrings);
        setOfDuplicates.forEach(this::combineDuplicatesAndCreateHighlights);


        List<String> coords = getAll().stream().map(h -> h.getCoordinates() + h.getFile().getFileNumber()).toList();
        List<Equipment> all = equipmentService.getAll();
        all.forEach(e->{
            String coord = e.getCoordinates()+ e.getMainFile().getFileNumber();
            if(!coords.contains(coord)){
                transferEqToHighlights(e);
            }
        });


        System.out.println("Done");
    }
}
