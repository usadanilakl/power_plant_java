package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDtoLight;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointMergeService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
    private final LotoPointMergeService lotoPointMergeService;


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

    public List<Equipment> getByCoords(String coord) {
        return equipmentRepo.findByCoordinates(coord);
    }


    public Equipment saveForTransfer(Equipment transfer) {

        List<Equipment> points = equipmentRepo.findByCoordinates(transfer.getCoordinates());
        for (Equipment point : points) {
            if (
                    point != null &&
                            point.getTagNumber() != null &&
                            transfer.getTagNumber() != null &&
                            point.getTagNumber().equals(transfer.getTagNumber())
            ) {
                transfer.setId(point.getId());
            }
        }

        if (transfer.getVendor() != null)
            transfer.setVendor(valueService.valueSetup("Vendor", transfer.getVendor().getName()));
        if (transfer.getEqType() != null)
            transfer.setEqType(valueService.valueSetup("Equipment Type", transfer.getEqType().getName()));


        FileObject file = null;
        List<FileObject> files = fileService.getIfNumberContains(transfer.getPid());

        if (files != null && files.size() == 1) file = files.get(0);
        else if (files != null && files.size() > 1) {
            for (FileObject e : files) {
                if (e.getVendor().getName().equals(transfer.getVendor().getName())) file = e;
            }
        }

        if (file == null) {
            file = new FileObject();
            file.setFileNumber(transfer.getPid());
            System.out.println(file.getFileNumber() + " is null");
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
        for (Equipment e : byTagNumber) {
//            if(e.getDescription()!=null) System.out.println(e.getDescription());
//            if(e.getEqType()!=null) System.out.println(e.getEqType().getId());
//            if(e.getSystem()!=null) System.out.println(e.getSystem().getId());
//            if(e.getSpecificLocation()!=null) System.out.println(e.getSpecificLocation());
            if (e.getLocation() != null) loc += e.getLocation().getId() + ", ";
            descr += e.getDescription() + ",";

        }

        System.out.println(descr);
        System.out.println(loc);


    }

    @Override
    public List<Equipment> getByTagNumber(String tag) {
        return equipmentRepo.findByTagNumber(tag);
    }

    public void saveAllForTransfer(List<Equipment> transfers) {
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
        if (entity != null) {
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
    public List<Equipment> getByEqType(String type) {
        Value value = valueService.getByName(type).stream().filter(v -> v.getName().equals(type)).findFirst().orElse(null);
        if (value == null) return new ArrayList<>();
        return equipmentRepo.findByEqType(value);

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
        if (cat.equals("vendor")) result.addAll(getByVendor(val));
        if (cat.equals("system")) result.addAll(getBySystem(val));
        if (cat.equals("eqType")) result.addAll(getByEqType(val));
        if (cat.equals("location")) result.addAll(getByLocation(val));
        return result;
    }

    @Override
    public Equipment copyEqFromAnotherUnit(Equipment sourcePoint) {

        Equipment processedEq = new Equipment();
        processedEq.setCoordinates(sourcePoint.getCoordinates());
        processedEq.setOriginalPictureSize(sourcePoint.getOriginalPictureSize());
        processedEq.setSystem(sourcePoint.getSystem());
        processedEq.setLocation(sourcePoint.getLocation());
        processedEq.setVendor(sourcePoint.getVendor());
        processedEq.setEqType(sourcePoint.getEqType());
        processedEq.setLotoPoints(new HashSet<>());

        String sourceTagNumber = sourcePoint.getTagNumber();
        String destenationTagNumber = "";
        String destDescription = "";
        String docNum = "";

        if (sourceTagNumber.startsWith("01")) {
            if (sourcePoint.getVendor().getName().equalsIgnoreCase("kiewit"))
                docNum = sourcePoint.getMainFile().getFileNumber().replace('A', 'B');
            destenationTagNumber = "02" + sourceTagNumber.substring(2);
            if (sourcePoint.getDescription() != null)
                destDescription = Arrays.stream(sourcePoint.getDescription().split(" ")).map(e -> {
                            if (e.startsWith("01")) return e = "02" + e.substring(2);
                            else return e;
                        }).toList().toString()
                        .replaceAll("Unit1", "Unit2")
                        .replaceAll("Unit 1", "Unit 2")
                        .replaceAll("U1", "U2")
                        .replace("[", "")
                        .replace("]", "")
                        .replace(",", "");
        } else if (sourceTagNumber.startsWith("02")) {
            destenationTagNumber = "01" + sourceTagNumber.substring(2);

            if (sourcePoint.getDescription() != null) {
                destDescription = Arrays.stream(sourcePoint.getDescription().split(" ")).map(e -> {
                            if (e.startsWith("02")) return e = "01" + e.substring(2);
                            else return e;
                        }).toList().toString()
                        .replaceAll("Unit2", "Unit1")
                        .replaceAll("Unit 2", "Unit 1")
                        .replaceAll("U2", "U1")
                        .replace("[", "")
                        .replace("]", "")
                        .replace(",", "");
            }
        }
        processedEq.setTagNumber(destenationTagNumber);
        processedEq.setDescription(destDescription);
        if (docNum != "") {
//            List<FileObject> files = fileService.getIfNumberContains(docNum);
//            if(files!=null && files.size()!=0)processedEq.setMainFile(files.get(0));
        }
        Set<LotoPoint> lotoPoints = sourcePoint.getLotoPoints();
        if (lotoPoints != null) {
            for (LotoPoint lp : lotoPoints) {
                List<LotoPoint> points = (List<LotoPoint>) lotoPointMergeService.copyPointFromOtherUnit(lp.getId()).get("Match");
                processedEq.getLotoPoints().addAll(points);
            }
        }
        List<Equipment> byTagNumber = getByTagNumber(destenationTagNumber);
        if (byTagNumber == null || byTagNumber.size() == 0) return save(processedEq);
        else return null;

    }

    @Override
    public Equipment copyEqFromAnotherUnit(String eqId){
        Equipment source = getEntityById(eqId);
        if(source==null) return null;
        FileObject sourceFile = source.getMainFile();
        if(sourceFile==null) return null;
        Equipment newEquipment = new Equipment();
        newEquipment.setCoordinates(source.getCoordinates());
        newEquipment.setOriginalPictureSize(source.getOriginalPictureSize());
        newEquipment.setSystem(source.getSystem());
        newEquipment.setLocation(source.getLocation());
        newEquipment.setVendor(source.getVendor());
        newEquipment.setEqType(source.getEqType());
        newEquipment.setLotoPoints(new HashSet<>());

        String sourceTagNumber = source.getTagNumber();
        String from = sourceTagNumber.substring(0, 2);
        String to = from.equals("01")? "02" : "01";


        FileObject file = sourceFile;
        if (file.getVendor() != null && file.getVendor().getName().equalsIgnoreCase("kiewit")) {
            String fileNumber = file.getFileNumber();
            int indexOfPd = fileNumber.indexOf("PD-");
            if (indexOfPd != -1) {
                String pdPart = fileNumber.substring(indexOfPd);
                if (from.equals("01") && pdPart.matches("PD-.*A")) {
                    fileNumber = pdPart.substring(0, pdPart.length() - 1) + "B";
                    file.setFileNumber(fileNumber);
                } else if (from.equals("02") && pdPart.matches("PD-.*B")) {
                    fileNumber = pdPart.substring(0, pdPart.length() - 1) + "A";
                    List<FileObject> ifNumberContains = fileService.getIfNumberContains(fileNumber);
                    if (ifNumberContains!= null && ifNumberContains.size()!= 0) file = ifNumberContains.get(0);
                }
            }
        }
        newEquipment.setMainFile(file);
        newEquipment.setFiles(new ArrayList<>(Collections.singletonList(file)));

        String flippedDescription = flipUnitReferences(source.getDescription(), from, to);
        String flippedTagNumber = flipUnitReferences(source.getTagNumber(), from, to);

        newEquipment.setTagNumber(flippedTagNumber);
        newEquipment.setDescription(flippedDescription);

        save(newEquipment);

        file.addPoint(newEquipment);
        fileService.save(file);

        if(source.getLotoPoints()!=null && source.getLotoPoints().size()==1){
            LotoPoint lpSource = source.getLotoPoints().iterator().next();
            List<LotoPointDto> byTagNumber = lotoPointService.getByTagNumber(flippedTagNumber);
            LotoPoint newLp = null;
            if(byTagNumber != null && byTagNumber.size() == 1){
                newLp = lotoPointService.getEntityById(byTagNumber.get(0).getId());
            }else if(byTagNumber == null || byTagNumber.size() == 0){
                newLp = new LotoPoint();
                newLp.setTagNumber(flippedTagNumber);
                newLp.setNormPos(lpSource.getNormPos());
                newLp.setIsoPos(lpSource.getIsoPos());
                newLp.addEquipment(newEquipment);
                newLp.setSpecificLocation(lpSource.getSpecificLocation());
                newLp.setDescription(flippedDescription);
                lotoPointService.save(newLp);
            }

            if(newLp!= null)  {
                newEquipment.addLotoPoint(newLp);
                save(newEquipment);
            }




        }

        return newEquipment;

    }
    @Override
    public List<Equipment> getByTagNumberContains(String tag) {
        return equipmentRepo.findByTagNumberContaining(tag);
    }

    @Override
    public List<Equipment> getIfTagNumberContains(String value) {
        return equipmentRepo.findByTagNumberContainingIgnoreCase(value);
    }

    @Override
    public List<Equipment> getIfDescriptionContains(String value) {
        return equipmentRepo.findByDescriptionContainingIgnoreCase(value);
    }

    @Override
    public List<EquipmentDtoLight> getAllLight() {
        return equipmentRepo.getAllLight();
    }

    @Override
    public void assignEqTypeByTagContaining() {
        for (Equipment e : getAll()) {
            if (e.getEqType() == null) {
                if (e.getTagNumber().contains("-CPL-"))
                    e.setEqType(valueService.valueSetup("Equipment Type", "CONTROL PANEL"));
                if (e.getTagNumber().contains("-MPM-") || e.getTagNumber().contains("-PMP-"))
                    e.setEqType(valueService.valueSetup("Equipment Type", "Pump"));
                if (e.getTagNumber().contains("-SKD-") || e.getTagNumber().contains("-PMP-"))
                    e.setEqType(valueService.valueSetup("Equipment Type", "SKID"));
                if (e.getTagNumber().contains("-VINA-") || e.getTagNumber().contains("-VPDR-"))
                    e.setEqType(valueService.valueSetup("Equipment Type", "Manual Valve"));
                if (e.getTagNumber().contains("-TCV-") ||
                        e.getTagNumber().contains("-FCV-") ||
                        e.getTagNumber().contains("-PCV-") ||
                        e.getTagNumber().contains("-YV-") ||
                        e.getTagNumber().contains("-YCV-") ||
                        e.getTagNumber().contains("-LV-")
                ) e.setEqType(valueService.valueSetup("Equipment Type", "AOV"));
                if (e.getTagNumber().contains("-LV-")) e.setEqType(valueService.valueSetup("Equipment Type", "FCV"));
            }
            save(e);
        }
    }

    @Override
    public Collection<Equipment> getEntityByTagNumber(String otherUnitTag) {
        return equipmentRepo.findByTagNumber(otherUnitTag);
    }

    @Override
    public List<Equipment> getByDataServiceItemIdIsNull() {
        return equipmentRepo.findByNullDataServiceItemId();
    }

    @Override
    public Equipment createPointFromLotoPoint(Map<String, String> data) {
        String lpId = data.get("lpId");
        String currentEqId = data.get("eqId");
        String coordinates = data.get("coordinates");
        String originalPictureSize = data.get("originalPictureSize");

        LotoPoint lotoPoint = lotoPointService.getEntityById(lpId);
        if (lotoPoint == null) {
            throw new EntityNotFoundException("LotoPoint not found with id: " + lpId);
        }
        Equipment currentEq = getEntityById(currentEqId);
        if (currentEq == null) {
            throw new EntityNotFoundException("Equipment not found with id: " + currentEqId);
        }

        Equipment e = new Equipment();
        e.setSystem(currentEq.getSystem());
        e.setLocation(currentEq.getLocation());
        e.setVendor(currentEq.getVendor());
        e.setEqType(currentEq.getEqType());
        e.setTagNumber(lotoPoint.getTagNumber());
        e.setDescription(lotoPoint.getDescription());
        e.setMainFile(currentEq.getMainFile());
        e.setFiles(new ArrayList<>(currentEq.getFiles()));
        e.setLotoPoints(new HashSet<>(Collections.singletonList(lotoPoint)));
        e.setCoordinates(coordinates);
        e.setOriginalPictureSize(originalPictureSize);

        Equipment savedEquipment = save(e);

        currentEq.getLotoPoints().remove(lotoPoint);
        lotoPoint.getEquipmentList().remove(currentEq);
        lotoPoint.getEquipmentList().add(savedEquipment);

        save(currentEq);
        lotoPointService.save(lotoPoint);
        currentEq.getMainFile().addPoint(savedEquipment);
        fileService.save(currentEq.getMainFile());

        return savedEquipment;
    }

    @Override
    public void refactor(Value old, Value _new) {
        String cat = old.getCategory().getAlias();
        for (Equipment f : getByValue(old)) {
            if (cat.equals("vendor")) f.setVendor(_new);
            if (cat.equals("system")) f.setSystem(_new);
            if (cat.equals("eqType")) f.setEqType(_new);
            if (cat.equals("location")) f.setLocation(_new);
            save(f);
        }
    }

    public List<String> getByTagNumberStartingWith(String num) {
        return equipmentRepo.findByTagNumberStartingWith(num);
    }


//    @Override
//    public Equipment softDelete(Equipment entity) {
//        FileObject mainFile = entity.getMainFile();
//        mainFile.getPoints().stream().map(e->{if(e.getId() == entity.getId()) fileService.softDelete(e);})
//    }

    private String flipUnitReferences(String text, String fromUnit, String toUnit) {
        return Arrays.stream(text.split(" "))
                .map(word -> {
                    if (word.startsWith(fromUnit)) {
                        return toUnit + word.substring(2);
                    } else {
                        return word;
                    }
                })
                .collect(Collectors.joining(" "))
                .replace("Unit" + fromUnit.charAt(1), "Unit" + toUnit.charAt(1))
                .replace("UNIT " + fromUnit.charAt(1), "UNIT" + toUnit.charAt(1))
                .replace("UNIT" + fromUnit.charAt(1), "UNIT" + toUnit.charAt(1))
                .replace("Unit " + fromUnit.charAt(1), "Unit " + toUnit.charAt(1))
                .replace("U" + fromUnit.charAt(1), "U" + toUnit.charAt(1));
    }
}
