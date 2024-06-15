package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import com.dk_power.power_plant_java.util.data_transfer.JsonToPojo;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final GroupService<EquipmentType> equipmentTypeGroupService;
private final FileUploaderService fileUploaderService;
private final FileRepo fileRepo;
private final FileServiceImpl fileService;
private final PointServiceImpl pointRepo;
private final TransferMethods transferMethods;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");

//        transferMethods.transferPids();
//        transferMethods.transferPoints();


//        List<Point> points = new JsonToPojo<Point>().readProductsFromFile("/Equipment_mod.js", Point.class);
//        Set<FileObject>doubleFiles = new LinkedHashSet<>();
//        Set<String>missingFiles = new LinkedHashSet<>();
//        for (Point point : points) {
//            List<FileObject> filesFound = fileService.getIfNumberContains(point.getPid());
//            if( filesFound ==null|| filesFound.size()==0) missingFiles.add(point.getPid());
//            else if(filesFound.size()>1)doubleFiles.addAll(filesFound);
//        }
//
//        System.out.println("missingFiles = " + missingFiles);
//        doubleFiles.forEach(e-> System.out.println(e.getFileNumber()+" vendor: "+e.getVendor().getName()));




    }
}
