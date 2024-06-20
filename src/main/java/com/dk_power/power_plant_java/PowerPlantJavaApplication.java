package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.repository.plant.VendorRepo;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import com.dk_power.power_plant_java.util.Util;
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
private final VendorRepo vendorRepo;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");

//        transferMethods.transferPids();
//        System.out.println(fileService.getAll().size());
//        transferMethods.transferPoints();
//        System.out.println("pointRepo.getAll().size() = " + pointRepo.getAll().size());

        System.out.println("fileService.getAll().get(33) = " + fileService.getAll().get(33));


    }
}
