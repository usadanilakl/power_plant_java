package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.entities.equipment.EquipmentType;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.repository.plant.VendorRepo;
import com.dk_power.power_plant_java.sevice.ExcelService;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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
private final ExcelService excelService;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");
/***************************TransferMethods*************************************************
        transferMethods.transferPids();
        System.out.println(fileService.getAll().size());

        transferMethods.transferPoints();
        System.out.println("pointRepo.getAll().size() = " + pointRepo.getAll().size());

        transferMethods.transferPointsFromExcel();
 ********************************************************************************/

//        fileService.getAll().forEach(FileObject::buildFileLink);
//        System.out.println("fileService.getAll().get(33) = " + fileService.getAllDtos().get(48));




    }
}
